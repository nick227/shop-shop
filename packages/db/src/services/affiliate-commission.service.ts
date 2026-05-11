/**
 * Affiliate commission service — rate resolution, candidate building, and persistence.
 *
 * Entry points:
 *  - runAffiliateCommissions(orderId): called by order.service on DELIVERED/COMPLETED,
 *    and by payment.service on Stripe payment_intent.succeeded.
 *  - buildAffiliateCommissionCandidatesForOrder: pure candidate builder (also used in tests).
 */

import type { CommissionSourceType, AffiliateRateSource } from '../generated/client/index.js'
import { prisma } from '../client.js'
import type { ExtendedPrismaClient } from '../client.js'

// ─── Public types ─────────────────────────────────────────────────────────────

export interface RateResolutionResult {
  rateBps: number
  rateSource: AffiliateRateSource
  payoutGroupIdSnapshot: string | null
}

export interface EffectiveRatesResult {
  customer: RateResolutionResult
  store: RateResolutionResult
  platformCustomerDefaultBps: number
  platformStoreDefaultBps: number
  platformMaxBurdenBps: number
}

export interface CommissionCandidate {
  affiliateId: string
  orderId: string
  storeId: string
  sourceType: CommissionSourceType
  /** Service-fee amount in integer cents — the base the rate is applied to. */
  commissionBaseCents: number
  rateBps: number
  amountCents: number
  rateSource: AffiliateRateSource
  payoutGroupIdSnapshot: string | null
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

async function loadAffiliateSettings(db: ExtendedPrismaClient) {
  const keys = [
    'platform.affiliate_customer_rate_bps',
    'platform.affiliate_store_rate_bps',
    'platform.affiliate_max_burden_bps',
  ] as const
  const rows = await db.systemSetting.findMany({ where: { key: { in: [...keys] } } })
  const map = Object.fromEntries(rows.map((r) => [r.key, parseInt(r.value, 10)]))
  return {
    customerRateDefaultBps: map['platform.affiliate_customer_rate_bps'] ?? 500,
    storeRateDefaultBps: map['platform.affiliate_store_rate_bps'] ?? 500,
    maxBurdenBps: map['platform.affiliate_max_burden_bps'] ?? 5000,
  }
}

// ─── Pure helpers (exported for unit tests) ───────────────────────────────────

/**
 * 3-tier cascade: user override → payout group → platform system default.
 * A zero override (0 bps) is a valid intentional value — not a fallthrough.
 */
export function resolveRateFromValues(
  overrideBps: number | null,
  groupBps: number | null,
  systemDefaultBps: number,
  payoutGroupId: string | null,
): RateResolutionResult {
  if (overrideBps !== null) {
    return {
      rateBps: overrideBps,
      rateSource: 'USER_OVERRIDE',
      payoutGroupIdSnapshot: payoutGroupId,
    }
  }
  if (groupBps !== null) {
    return {
      rateBps: groupBps,
      rateSource: 'PAYOUT_GROUP',
      payoutGroupIdSnapshot: payoutGroupId,
    }
  }
  return {
    rateBps: systemDefaultBps,
    rateSource: 'PLATFORM_DEFAULT',
    payoutGroupIdSnapshot: null,
  }
}

/** Commission amount in integer cents: round((base * rateBps) / 10000). */
export function calculateCommissionAmountCents(
  commissionBaseCents: number,
  rateBps: number,
): number {
  return Math.round((commissionBaseCents * rateBps) / 10000)
}

/**
 * Cap total affiliate burden to platform.affiliate_max_burden_bps of the service fee.
 *
 * Sort order: CUSTOMER_PURCHASE is paid in full first; STORE_REVENUE gets the remainder.
 * Any other source types are treated as lower priority (paid after STORE_REVENUE).
 */
export function applyDualCommissionCap(
  candidates: CommissionCandidate[],
  serviceFeeAmountCents: number,
  maxBurdenBps: number,
): CommissionCandidate[] {
  if (candidates.length === 0) return candidates

  const maxBurdenCents = Math.round((serviceFeeAmountCents * maxBurdenBps) / 10000)

  const priority: Record<string, number> = {
    CUSTOMER_PURCHASE: 0,
    STORE_REVENUE: 1,
    MANUAL: 2,
  }
  const sorted = [...candidates].sort(
    (a, b) => (priority[a.sourceType] ?? 99) - (priority[b.sourceType] ?? 99),
  )

  let burdenUsed = 0
  return sorted.map((c) => {
    const available = Math.max(0, maxBurdenCents - burdenUsed)
    const cappedAmount = Math.min(c.amountCents, available)
    burdenUsed += cappedAmount
    return cappedAmount === c.amountCents ? c : { ...c, amountCents: cappedAmount }
  })
}

// ─── DB functions ─────────────────────────────────────────────────────────────

/**
 * Resolve the effective rate bps for one affiliate + source type combination.
 * Reads the affiliate's override, payout group, and system settings in one call.
 */
export async function resolveAffiliateRate(
  affiliateId: string,
  sourceType: CommissionSourceType,
  db: ExtendedPrismaClient = prisma,
): Promise<RateResolutionResult> {
  const [affiliate, settings] = await Promise.all([
    db.affiliate.findUniqueOrThrow({
      where: { id: affiliateId },
      select: {
        customerRateBpsOverride: true,
        storeRateBpsOverride: true,
        payoutGroupId: true,
        payoutGroup: {
          select: { id: true, customerRateBps: true, storeRateBps: true },
        },
      },
    }),
    loadAffiliateSettings(db),
  ])

  const isCustomer = sourceType === 'CUSTOMER_PURCHASE'
  const overrideBps = isCustomer
    ? affiliate.customerRateBpsOverride
    : affiliate.storeRateBpsOverride
  const groupBps = isCustomer
    ? (affiliate.payoutGroup?.customerRateBps ?? null)
    : (affiliate.payoutGroup?.storeRateBps ?? null)
  const systemDefaultBps = isCustomer
    ? settings.customerRateDefaultBps
    : settings.storeRateDefaultBps

  return resolveRateFromValues(overrideBps, groupBps, systemDefaultBps, affiliate.payoutGroupId)
}

/**
 * Resolve both customer and store rates for an affiliate in one DB round-trip.
 * This is the single source of truth for rate resolution — used by both commission
 * creation and the admin effective-rates API so they can never diverge.
 */
export async function getEffectiveAffiliateRates(
  affiliateId: string,
  db: ExtendedPrismaClient = prisma,
): Promise<EffectiveRatesResult> {
  const [affiliate, settings] = await Promise.all([
    db.affiliate.findUniqueOrThrow({
      where: { id: affiliateId },
      select: {
        customerRateBpsOverride: true,
        storeRateBpsOverride: true,
        payoutGroupId: true,
        payoutGroup: {
          select: { id: true, customerRateBps: true, storeRateBps: true },
        },
      },
    }),
    loadAffiliateSettings(db),
  ])

  const customer = resolveRateFromValues(
    affiliate.customerRateBpsOverride,
    affiliate.payoutGroup?.customerRateBps ?? null,
    settings.customerRateDefaultBps,
    affiliate.payoutGroupId,
  )
  const store = resolveRateFromValues(
    affiliate.storeRateBpsOverride,
    affiliate.payoutGroup?.storeRateBps ?? null,
    settings.storeRateDefaultBps,
    affiliate.payoutGroupId,
  )

  return {
    customer,
    store,
    platformCustomerDefaultBps: settings.customerRateDefaultBps,
    platformStoreDefaultBps: settings.storeRateDefaultBps,
    platformMaxBurdenBps: settings.maxBurdenBps,
  }
}

/**
 * Build commission candidates for a paid or COD-fulfilled order.
 *
 * Eligibility:
 * - STRIPE: paymentStatus === 'PAID'.
 * - COD: stripePaymentIntentId is null + paymentStatus === 'UNPAID' +
 *   status is DELIVERED or COMPLETED (cash collected at delivery).
 *
 * Other rules:
 * - CUSTOMER_PURCHASE: buyer must be attributed to an active affiliate that is NOT
 *   the buyer themselves (self-referral skip).
 * - STORE_REVENUE: store must be attributed to an active affiliate that is NOT
 *   the store owner (self-referral skip), AND must be a different affiliate than
 *   the buyer's (same-affiliate no double-dip rule).
 * - Cap applied via applyDualCommissionCap.
 *
 * Returns an empty array when the order is not eligible or has no attribution.
 */
export async function buildAffiliateCommissionCandidatesForOrder(
  orderId: string,
  db: ExtendedPrismaClient = prisma,
): Promise<CommissionCandidate[]> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      userId: true,
      storeId: true,
      status: true,
      paymentStatus: true,
      stripePaymentIntentId: true,
      serviceFeeAmount: true,
      referredByAffiliateId: true,
    },
  })
  if (!order) return []

  const isStripePaid = order.paymentStatus === 'PAID'
  const isCodFulfilled =
    order.stripePaymentIntentId == null &&
    order.paymentStatus === 'UNPAID' &&
    (order.status === 'DELIVERED' || order.status === 'COMPLETED')

  if (!isStripePaid && !isCodFulfilled) return []

  const store = await db.store.findUnique({
    where: { id: order.storeId },
    select: { ownerUserId: true, referredByAffiliateId: true },
  })
  if (!store) return []

  // Fetch both potential affiliates in parallel
  const [rawBuyerAffiliate, rawStoreAffiliate] = await Promise.all([
    order.referredByAffiliateId
      ? db.affiliate.findUnique({
          where: { id: order.referredByAffiliateId },
          select: { id: true, userId: true, status: true },
        })
      : null,
    store.referredByAffiliateId
      ? db.affiliate.findUnique({
          where: { id: store.referredByAffiliateId },
          select: { id: true, userId: true, status: true },
        })
      : null,
  ])

  if (!rawBuyerAffiliate && !rawStoreAffiliate) return []

  const serviceFeeAmountCents = Math.round(Number(order.serviceFeeAmount) * 100)
  const settings = await loadAffiliateSettings(db)

  const candidates: CommissionCandidate[] = []

  // ── CUSTOMER_PURCHASE ──────────────────────────────────────────────────────
  const buyerAffiliate =
    rawBuyerAffiliate?.status === 'ACTIVE' &&
    rawBuyerAffiliate.userId !== order.userId // skip self-referral
      ? rawBuyerAffiliate
      : null

  if (buyerAffiliate) {
    const { rateBps, rateSource, payoutGroupIdSnapshot } = await resolveAffiliateRate(
      buyerAffiliate.id,
      'CUSTOMER_PURCHASE',
      db,
    )
    candidates.push({
      affiliateId: buyerAffiliate.id,
      orderId: order.id,
      storeId: order.storeId,
      sourceType: 'CUSTOMER_PURCHASE',
      commissionBaseCents: serviceFeeAmountCents,
      rateBps,
      amountCents: calculateCommissionAmountCents(serviceFeeAmountCents, rateBps),
      rateSource,
      payoutGroupIdSnapshot,
    })
  }

  // ── STORE_REVENUE ──────────────────────────────────────────────────────────
  // Blocked when: same affiliate as buyer, store owner self-referral, or inactive.
  const isSameAsBuyer = rawBuyerAffiliate?.id === rawStoreAffiliate?.id
  const storeAffiliate =
    rawStoreAffiliate?.status === 'ACTIVE' &&
    !isSameAsBuyer &&
    rawStoreAffiliate.userId !== store.ownerUserId // skip self-referral
      ? rawStoreAffiliate
      : null

  if (storeAffiliate) {
    const { rateBps, rateSource, payoutGroupIdSnapshot } = await resolveAffiliateRate(
      storeAffiliate.id,
      'STORE_REVENUE',
      db,
    )
    candidates.push({
      affiliateId: storeAffiliate.id,
      orderId: order.id,
      storeId: order.storeId,
      sourceType: 'STORE_REVENUE',
      commissionBaseCents: serviceFeeAmountCents,
      rateBps,
      amountCents: calculateCommissionAmountCents(serviceFeeAmountCents, rateBps),
      rateSource,
      payoutGroupIdSnapshot,
    })
  }

  return applyDualCommissionCap(candidates, serviceFeeAmountCents, settings.maxBurdenBps)
}

/**
 * Persist a commission candidate as a Commission row.
 *
 * Idempotent: upserts by (affiliateId, orderId, sourceType). Re-running on the same
 * candidate updates the rate/amount fields but does not change status or paidAt.
 *
 * Legacy Decimal fields (amount, rate, serviceFeeBase) are kept in sync so existing
 * code that reads them (calculateCommissionForOrder, payout reports) keeps working.
 */
export async function upsertCommissionCandidate(
  candidate: CommissionCandidate,
  db: ExtendedPrismaClient = prisma,
): Promise<void> {
  // Legacy Decimal mirrors — kept until Phase 2 Decimal columns are dropped.
  const legacyAmount = candidate.amountCents / 100
  const legacyRate = candidate.rateBps / 10000
  const legacyServiceFeeBase = candidate.commissionBaseCents / 100

  await db.commission.upsert({
    where: {
      affiliateId_orderId_sourceType: {
        affiliateId: candidate.affiliateId,
        orderId: candidate.orderId,
        sourceType: candidate.sourceType,
      },
    },
    create: {
      affiliateId: candidate.affiliateId,
      orderId: candidate.orderId,
      storeId: candidate.storeId,
      sourceType: candidate.sourceType,
      commissionBaseCents: candidate.commissionBaseCents,
      rateBps: candidate.rateBps,
      amountCents: candidate.amountCents,
      rateSource: candidate.rateSource,
      payoutGroupIdSnapshot: candidate.payoutGroupIdSnapshot,
      // Legacy mirrors
      amount: legacyAmount,
      rate: legacyRate,
      serviceFeeBase: legacyServiceFeeBase,
      status: 'PENDING',
    },
    update: {
      commissionBaseCents: candidate.commissionBaseCents,
      rateBps: candidate.rateBps,
      amountCents: candidate.amountCents,
      rateSource: candidate.rateSource,
      payoutGroupIdSnapshot: candidate.payoutGroupIdSnapshot,
      // Legacy mirrors
      amount: legacyAmount,
      rate: legacyRate,
      serviceFeeBase: legacyServiceFeeBase,
    },
  })
}

/**
 * Build and persist V2 commission candidates for a paid/COD-fulfilled order.
 * Errors are swallowed so a commission failure never breaks the caller's response.
 * Idempotent: safe to call multiple times for the same order.
 */
export async function runAffiliateCommissions(orderId: string): Promise<void> {
  try {
    const candidates = await buildAffiliateCommissionCandidatesForOrder(orderId)
    await Promise.all(candidates.map((c) => upsertCommissionCandidate(c)))
  } catch (err) {
    console.error('[Commission] runAffiliateCommissions failed for order', orderId, err)
  }
}
