/**
 * Integration tests: buildAffiliateCommissionCandidatesForOrder + upsertCommissionCandidate
 *
 * Uses a live DB connection (same as other server integration tests).
 * Each test cleans up its own data.
 */
import { randomUUID } from 'crypto'
import { describe, it, expect, afterAll } from 'vitest'
import { prisma, Decimal } from '@packages/db'
import {
  buildAffiliateCommissionCandidatesForOrder,
  upsertCommissionCandidate,
} from '@packages/db/services'
import {
  createAuthenticatedUser,
  createTestStore,
  TEST_NAMESPACE,
} from './helpers.js'

// ─── helpers ──────────────────────────────────────────────────────────────────

async function makeAffiliate(userId: string) {
  return prisma.affiliate.create({
    data: {
      userId,
      referralCode: `${TEST_NAMESPACE.slice(0, 4)}-${randomUUID().slice(0, 8).toUpperCase()}`,
      status: 'ACTIVE',
      commissionRate: new Decimal('0.05'),
      payoutProvider: 'MANUAL',
      payoutProviderStatus: 'NOT_SET',
      customerRateBpsOverride: 500,
    },
  })
}

async function makeOrder(
  userId: string,
  storeId: string,
  overrides: {
    paymentStatus?: 'PAID' | 'UNPAID' | 'REFUNDED'
    referredByAffiliateId?: string | null
  } = {},
) {
  return prisma.order.create({
    data: {
      userId,
      storeId,
      status: 'DELIVERED',
      paymentStatus: overrides.paymentStatus ?? 'PAID',
      deliveryType: 'PICKUP',
      deliveryMode: 'PICKUP',
      subtotal: new Decimal('40.00'),
      fees: new Decimal('2.00'),
      tax: new Decimal('3.00'),
      tip: new Decimal('0.00'),
      total: new Decimal('50.00'),
      serviceFeePercent: new Decimal('5.00'),
      serviceFeeAmount: new Decimal('2.50'),
      netToVendor: new Decimal('47.50'),
      ...(overrides.referredByAffiliateId !== undefined
        ? { referredByAffiliateId: overrides.referredByAffiliateId }
        : {}),
    },
  })
}

async function cleanup(userIds: string[], orderIds: string[], affiliateIds: string[]) {
  await prisma.commission.deleteMany({ where: { orderId: { in: orderIds } } })
  await prisma.orderItem.deleteMany({ where: { orderId: { in: orderIds } } })
  await prisma.orderEvent.deleteMany({ where: { orderId: { in: orderIds } } })
  await prisma.order.deleteMany({ where: { id: { in: orderIds } } })
  await prisma.affiliate.deleteMany({ where: { id: { in: affiliateIds } } })
  await prisma.store.deleteMany({ where: { slug: { startsWith: TEST_NAMESPACE } } })
  await prisma.user.deleteMany({ where: { id: { in: userIds } } })
}

// ─── tests ────────────────────────────────────────────────────────────────────

describe('buildAffiliateCommissionCandidatesForOrder', () => {
  it('returns empty array for an UNPAID order', async () => {
    const vendor = await createAuthenticatedUser('VENDOR')
    const buyer = await createAuthenticatedUser('USER')
    const store = await createTestStore(vendor.id)
    const affiliate = await makeAffiliate(await createAuthenticatedUser('USER').then((u) => u.id))
    const order = await makeOrder(buyer.id, store.id, {
      paymentStatus: 'UNPAID',
      referredByAffiliateId: affiliate.id,
    })

    const candidates = await buildAffiliateCommissionCandidatesForOrder(order.id)
    expect(candidates).toHaveLength(0)

    await cleanup([vendor.id, buyer.id, affiliate.userId], [order.id], [affiliate.id])
  })

  it('returns empty array when order has no referral attribution', async () => {
    const vendor = await createAuthenticatedUser('VENDOR')
    const buyer = await createAuthenticatedUser('USER')
    const store = await createTestStore(vendor.id)
    const order = await makeOrder(buyer.id, store.id, { paymentStatus: 'PAID' })

    const candidates = await buildAffiliateCommissionCandidatesForOrder(order.id)
    expect(candidates).toHaveLength(0)

    await cleanup([vendor.id, buyer.id], [order.id], [])
  })

  it('skips CUSTOMER_PURCHASE when buyer is the affiliate (self-referral)', async () => {
    const vendor = await createAuthenticatedUser('VENDOR')
    const buyer = await createAuthenticatedUser('USER')
    // Affiliate whose userId matches the buyer
    const buyerAffiliate = await makeAffiliate(buyer.id)
    const store = await createTestStore(vendor.id)
    const order = await makeOrder(buyer.id, store.id, {
      paymentStatus: 'PAID',
      referredByAffiliateId: buyerAffiliate.id,
    })

    const candidates = await buildAffiliateCommissionCandidatesForOrder(order.id)
    expect(candidates).toHaveLength(0)

    await cleanup([vendor.id, buyer.id], [order.id], [buyerAffiliate.id])
  })

  it('skips STORE_REVENUE when store owner is the affiliate (self-referral)', async () => {
    const vendor = await createAuthenticatedUser('VENDOR')
    const buyer = await createAuthenticatedUser('USER')
    const thirdParty = await createAuthenticatedUser('USER')
    const store = await createTestStore(vendor.id)

    // Store attributed to an affiliate whose userId matches the store owner
    const ownerAffiliate = await makeAffiliate(vendor.id)
    await prisma.store.update({
      where: { id: store.id },
      data: { referredByAffiliateId: ownerAffiliate.id },
    })

    // Buyer referred by an unrelated affiliate
    const buyerAffiliate = await makeAffiliate(thirdParty.id)
    const order = await makeOrder(buyer.id, store.id, {
      paymentStatus: 'PAID',
      referredByAffiliateId: buyerAffiliate.id,
    })

    const candidates = await buildAffiliateCommissionCandidatesForOrder(order.id)
    // Only CUSTOMER_PURCHASE should exist; STORE_REVENUE is self-referral
    expect(candidates).toHaveLength(1)
    expect(candidates[0]!.sourceType).toBe('CUSTOMER_PURCHASE')
    expect(candidates[0]!.affiliateId).toBe(buyerAffiliate.id)

    await cleanup([vendor.id, buyer.id, thirdParty.id], [order.id], [ownerAffiliate.id, buyerAffiliate.id])
  })

  it('skips STORE_REVENUE when buyer and store point to the same affiliate (no double-dip)', async () => {
    const vendor = await createAuthenticatedUser('VENDOR')
    const buyer = await createAuthenticatedUser('USER')
    const thirdParty = await createAuthenticatedUser('USER')
    const store = await createTestStore(vendor.id)

    const sharedAffiliate = await makeAffiliate(thirdParty.id)
    await prisma.store.update({
      where: { id: store.id },
      data: { referredByAffiliateId: sharedAffiliate.id },
    })
    const order = await makeOrder(buyer.id, store.id, {
      paymentStatus: 'PAID',
      referredByAffiliateId: sharedAffiliate.id,
    })

    const candidates = await buildAffiliateCommissionCandidatesForOrder(order.id)
    // Only CUSTOMER_PURCHASE for the shared affiliate; STORE_REVENUE blocked
    expect(candidates).toHaveLength(1)
    expect(candidates[0]!.sourceType).toBe('CUSTOMER_PURCHASE')
    expect(candidates[0]!.affiliateId).toBe(sharedAffiliate.id)

    await cleanup([vendor.id, buyer.id, thirdParty.id], [order.id], [sharedAffiliate.id])
  })

  it('builds both CUSTOMER_PURCHASE and STORE_REVENUE for different active affiliates', async () => {
    const vendor = await createAuthenticatedUser('VENDOR')
    const buyer = await createAuthenticatedUser('USER')
    const affiliateUser1 = await createAuthenticatedUser('USER')
    const affiliateUser2 = await createAuthenticatedUser('USER')
    const store = await createTestStore(vendor.id)

    const buyerAffiliate = await makeAffiliate(affiliateUser1.id)
    const storeAffiliate = await makeAffiliate(affiliateUser2.id)
    await prisma.store.update({
      where: { id: store.id },
      data: { referredByAffiliateId: storeAffiliate.id },
    })
    const order = await makeOrder(buyer.id, store.id, {
      paymentStatus: 'PAID',
      referredByAffiliateId: buyerAffiliate.id,
    })

    const candidates = await buildAffiliateCommissionCandidatesForOrder(order.id)
    expect(candidates).toHaveLength(2)
    const cp = candidates.find((c) => c.sourceType === 'CUSTOMER_PURCHASE')
    const sr = candidates.find((c) => c.sourceType === 'STORE_REVENUE')
    expect(cp).toBeDefined()
    expect(sr).toBeDefined()
    expect(cp!.affiliateId).toBe(buyerAffiliate.id)
    expect(sr!.affiliateId).toBe(storeAffiliate.id)
    // Both bases should equal the service fee in cents
    expect(cp!.commissionBaseCents).toBe(250) // $2.50 × 100
    expect(sr!.commissionBaseCents).toBe(250)
    // amountCents should be round((250 * 500) / 10000) = 13
    expect(cp!.amountCents).toBe(13)
    expect(sr!.amountCents).toBe(13)

    await cleanup(
      [vendor.id, buyer.id, affiliateUser1.id, affiliateUser2.id],
      [order.id],
      [buyerAffiliate.id, storeAffiliate.id],
    )
  })

  it('skips an INACTIVE affiliate', async () => {
    const vendor = await createAuthenticatedUser('VENDOR')
    const buyer = await createAuthenticatedUser('USER')
    const affiliateUser = await createAuthenticatedUser('USER')
    const store = await createTestStore(vendor.id)

    const inactiveAffiliate = await prisma.affiliate.create({
      data: {
        userId: affiliateUser.id,
        referralCode: `${TEST_NAMESPACE.slice(0, 4)}-${randomUUID().slice(0, 8).toUpperCase()}`,
        status: 'SUSPENDED',
        commissionRate: new Decimal('0.05'),
        payoutProvider: 'MANUAL',
        payoutProviderStatus: 'NOT_SET',
      },
    })
    const order = await makeOrder(buyer.id, store.id, {
      paymentStatus: 'PAID',
      referredByAffiliateId: inactiveAffiliate.id,
    })

    const candidates = await buildAffiliateCommissionCandidatesForOrder(order.id)
    expect(candidates).toHaveLength(0)

    await cleanup([vendor.id, buyer.id, affiliateUser.id], [order.id], [inactiveAffiliate.id])
  })
})

describe('upsertCommissionCandidate', () => {
  it('creates a Commission row on first call and updates on second (idempotent)', async () => {
    const vendor = await createAuthenticatedUser('VENDOR')
    const buyer = await createAuthenticatedUser('USER')
    const affiliateUser = await createAuthenticatedUser('USER')
    const store = await createTestStore(vendor.id)
    const affiliate = await makeAffiliate(affiliateUser.id)
    const order = await makeOrder(buyer.id, store.id)

    const candidate = {
      affiliateId: affiliate.id,
      orderId: order.id,
      storeId: store.id,
      sourceType: 'CUSTOMER_PURCHASE' as const,
      commissionBaseCents: 250,
      rateBps: 500,
      amountCents: 13,
      rateSource: 'PLATFORM_DEFAULT' as const,
      payoutGroupIdSnapshot: null,
    }

    await upsertCommissionCandidate(candidate)
    const after1 = await prisma.commission.count({ where: { orderId: order.id } })
    expect(after1).toBe(1)

    // Upsert again — should update, not insert
    await upsertCommissionCandidate({ ...candidate, amountCents: 15 })
    const after2 = await prisma.commission.count({ where: { orderId: order.id } })
    expect(after2).toBe(1)

    const row = await prisma.commission.findFirst({ where: { orderId: order.id } })
    expect(row!.amountCents).toBe(15)
    // Legacy Decimal field kept in sync
    expect(Number(row!.amount)).toBeCloseTo(0.15, 5)

    await cleanup([vendor.id, buyer.id, affiliateUser.id], [order.id], [affiliate.id])
  })
})
