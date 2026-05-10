/**
 * Phase 2: Affiliate system data backfill.
 *
 * Idempotent — every step is a no-op when already applied.
 *
 * Run with:
 *   node --import tsx prisma/backfill-affiliate-phase2.ts
 *
 * Or via package script:
 *   pnpm --filter @packages/db run backfill:affiliate
 *
 * Tasks performed:
 *   1. Find the default AffiliatePayoutGroup.
 *   2. Assign it to every Affiliate where payoutGroupId is NULL.
 *   3. Convert Affiliate.commissionRate → customerRateBpsOverride (×10000, round).
 *      storeRateBpsOverride is left NULL (no equivalent Decimal field to convert).
 *   4. Backfill existing Commission rows (sourceType IS NULL):
 *        sourceType            = CUSTOMER_PURCHASE
 *        commissionBaseCents   = ROUND(serviceFeeBase × 100)
 *        rateBps               = ROUND(rate × 10000)
 *        amountCents           = ROUND(amount × 100)
 *        rateSource            = PLATFORM_DEFAULT
 *      Duplicate (affiliateId, orderId) pairs are handled safely via MIN(id) JOIN —
 *      only the oldest row per pair is updated; extras remain NULL and are reported.
 *   5. Create Affiliate records for every User who does not have one:
 *        status            = ACTIVE
 *        payoutGroupId     = default group id
 *        referralCode      = nanoid(8).toUpperCase() with collision retry
 *        payoutProvider    = MANUAL
 *        commissionRate    = 0.10  (keeps old column populated for existing runtime code)
 *        storeRateBpsOverride left NULL
 */

import { PrismaClient } from '../src/generated/client/index.js'
import { nanoid } from 'nanoid'
import { randomUUID } from 'crypto'

const prisma = new PrismaClient()

// ─── helpers ─────────────────────────────────────────────────────────────────

async function generateUniqueReferralCode(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = nanoid(8).toUpperCase()
    const existing = await prisma.affiliate.findUnique({
      where: { referralCode: code },
      select: { id: true },
    })
    if (!existing) return code
  }
  // Fallback: UUID-derived 12-char code — guaranteed unique
  return randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase()
}

// ─── main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== Affiliate System Phase 2 Backfill ===\n')

  // ── 1. Find default payout group ─────────────────────────────────────────
  const defaultGroup = await prisma.affiliatePayoutGroup.findFirst({
    where: { isDefault: true, isActive: true },
  })
  if (!defaultGroup) {
    throw new Error(
      'No active default AffiliatePayoutGroup found. Run Phase 1 migration first.',
    )
  }
  console.log(`[1] Default payout group: "${defaultGroup.name}" (${defaultGroup.id})`)
  console.log(
    `    customerRateBps=${defaultGroup.customerRateBps}  storeRateBps=${defaultGroup.storeRateBps}`,
  )

  // ── 2. Assign default group to Affiliates without one ────────────────────
  const affiliatesWithoutGroup = await prisma.affiliate.count({
    where: { payoutGroupId: null },
  })
  if (affiliatesWithoutGroup > 0) {
    const result = await prisma.affiliate.updateMany({
      where: { payoutGroupId: null },
      data: { payoutGroupId: defaultGroup.id },
    })
    console.log(`\n[2] Assigned default payout group to ${result.count} affiliates`)
  } else {
    console.log('\n[2] All affiliates already have a payout group — skipped')
  }

  // ── 3. Convert commissionRate → customerRateBpsOverride ──────────────────
  const affiliatesNeedingBps = await prisma.affiliate.findMany({
    where: { customerRateBpsOverride: null },
    select: { id: true, commissionRate: true },
  })
  if (affiliatesNeedingBps.length > 0) {
    await Promise.all(
      affiliatesNeedingBps.map((a) => {
        const bps = Math.round(Number(a.commissionRate) * 10000)
        return prisma.affiliate.update({
          where: { id: a.id },
          data: { customerRateBpsOverride: bps },
        })
      }),
    )
    console.log(
      `\n[3] Converted commissionRate → customerRateBpsOverride for ${affiliatesNeedingBps.length} affiliates`,
    )
    console.log('    storeRateBpsOverride left NULL (no source column to convert)')
  } else {
    console.log('\n[3] All affiliates already have customerRateBpsOverride — skipped')
  }

  // ── 4. Backfill Commission rows ──────────────────────────────────────────
  const nullCount = await prisma.commission.count({ where: { sourceType: null } })

  if (nullCount === 0) {
    console.log('\n[4] All Commission rows already have sourceType — skipped')
  } else {
    // Check for duplicates: count distinct (affiliateId, orderId) pairs vs total rows.
    // If equal: no duplicates. If not: some (affiliateId, orderId) have multiple NULL rows.
    // Either way we use the MIN(id) JOIN so only the oldest row per pair is updated —
    // the unique constraint on (affiliateId, orderId, sourceType) is satisfied.
    const dupeRows = await prisma.$queryRaw<{ dupeGroups: bigint }[]>`
      SELECT COUNT(*) as dupeGroups
      FROM (
        SELECT affiliateId, orderId
        FROM Commission
        WHERE sourceType IS NULL
        GROUP BY affiliateId, orderId
        HAVING COUNT(*) > 1
      ) sub
    `
    const dupeGroupCount = Number(dupeRows[0]?.dupeGroups ?? 0)
    if (dupeGroupCount > 0) {
      console.warn(
        `\n[4] ⚠  ${dupeGroupCount} (affiliateId, orderId) pair(s) have multiple NULL-sourceType rows.`,
      )
      console.warn('    Only the oldest row per pair will be backfilled; extras are skipped.')
      console.warn(
        '    Investigate duplicates manually before enforcing the unique constraint in Phase 3.',
      )
    }

    // Update via MIN(id) JOIN — always duplicate-safe.
    // MySQL does not allow updating a table referenced in its own subquery directly,
    // so we wrap in a derived table (double-subquery trick).
    const updated = await prisma.$executeRaw`
      UPDATE Commission AS c
      INNER JOIN (
        SELECT MIN(id) AS id
        FROM Commission
        WHERE sourceType IS NULL
        GROUP BY affiliateId, orderId
      ) AS canonical ON c.id = canonical.id
      SET
        c.sourceType            = 'CUSTOMER_PURCHASE',
        c.commissionBaseCents   = CAST(ROUND(c.serviceFeeBase * 100) AS SIGNED),
        c.rateBps               = CAST(ROUND(c.rate * 10000) AS SIGNED),
        c.amountCents           = CAST(ROUND(c.amount * 100) AS SIGNED),
        c.rateSource            = 'PLATFORM_DEFAULT'
      WHERE c.sourceType IS NULL
    `
    const skipped = nullCount - updated
    console.log(`\n[4] Commission backfill: ${updated} rows updated, ${skipped} duplicate(s) skipped`)
  }

  // ── 5. Create Affiliate records for Users without one ────────────────────
  const usersWithoutAffiliate = await prisma.user.findMany({
    where: { affiliate: null },
    select: { id: true, email: true, name: true },
  })

  console.log(
    `\n[5] Found ${usersWithoutAffiliate.length} users without an Affiliate record`,
  )

  let created = 0
  for (const user of usersWithoutAffiliate) {
    const referralCode = await generateUniqueReferralCode()
    await prisma.affiliate.create({
      data: {
        userId: user.id,
        referralCode,
        status: 'ACTIVE',
        payoutGroupId: defaultGroup.id,
        payoutProvider: 'MANUAL',
        payoutProviderStatus: 'NOT_SET',
        // Keep old column populated — runtime code (calculateCommissionForOrder) still reads it.
        commissionRate: 0.10,
        // customerRateBpsOverride = 1000 (mirrors 0.10 * 10000) so the new field is consistent.
        customerRateBpsOverride: 1000,
        // storeRateBpsOverride left NULL — defers to group rate.
      },
    })
    created++
    if (created % 50 === 0) {
      console.log(`  ... ${created}/${usersWithoutAffiliate.length}`)
    }
  }
  console.log(`[5] Created ${created} new Affiliate records`)

  // ── Summary ───────────────────────────────────────────────────────────────
  const finalCounts = await Promise.all([
    prisma.affiliate.count(),
    prisma.commission.count({ where: { sourceType: null } }),
    prisma.affiliate.count({ where: { payoutGroupId: null } }),
  ])

  console.log('\n=== Summary ===')
  console.log(`Total affiliates:              ${finalCounts[0]}`)
  console.log(`Commissions still null-source: ${finalCounts[1]} (duplicates — investigate)`)
  console.log(`Affiliates without group:      ${finalCounts[2]}`)

  if (finalCounts[1] > 0) {
    console.warn('\n⚠  Some Commission rows still have sourceType=NULL (duplicate pairs).')
    console.warn('   Run the following query to inspect them:')
    console.warn(
      '   SELECT affiliateId, orderId, COUNT(*) FROM Commission WHERE sourceType IS NULL GROUP BY affiliateId, orderId HAVING COUNT(*) > 1;',
    )
  } else {
    console.log('\n✓ Phase 2 backfill complete — no issues detected.')
  }
}

main()
  .catch((err: unknown) => {
    console.error('\nBackfill failed:', err)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
