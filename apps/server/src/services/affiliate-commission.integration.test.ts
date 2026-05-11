/**
 * Integration tests for affiliate commission candidate building.
 * Tests self-referral skips, no-double-dip guard, and COD eligibility using a real DB.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { prisma, Decimal, buildAffiliateCommissionCandidatesForOrder, runAffiliateCommissions } from '@packages/db'
import {
  createAuthenticatedUser,
  createTestStore,
  cleanupTestData,
  TEST_NAMESPACE,
} from '../__tests__/helpers.js'

// ─── Shared helpers ───────────────────────────────────────────────────────────

const SERVICE_FEE_AMOUNT = new Decimal('2.50')

async function createAffiliate(userId: string, code?: string) {
  const { randomUUID } = await import('crypto')
  return prisma.affiliate.create({
    data: {
      userId,
      referralCode: code ?? `${TEST_NAMESPACE.slice(0, 6)}-${randomUUID().slice(0, 8)}`.toUpperCase(),
      status: 'ACTIVE',
    },
  })
}

/** Create a COD order attributed to a given affiliate. */
async function createAttributedOrder(opts: {
  buyerId: string
  storeId: string
  affiliateId: string
  referralCode: string
  status?: string
  paymentStatus?: string
  stripePaymentIntentId?: string | null
}) {
  const total = new Decimal('50.00')
  return prisma.order.create({
    data: {
      userId: opts.buyerId,
      storeId: opts.storeId,
      status: (opts.status ?? 'PLACED') as any,
      paymentStatus: (opts.paymentStatus ?? 'UNPAID') as any,
      deliveryType: 'PICKUP',
      deliveryMode: 'PICKUP',
      referredByAffiliateId: opts.affiliateId,
      referredByReferralCode: opts.referralCode,
      affiliateAttributionSource: 'CUSTOMER_REFERRAL',
      ...(opts.stripePaymentIntentId !== undefined
        ? { stripePaymentIntentId: opts.stripePaymentIntentId }
        : {}),
      subtotal: total.mul('0.80'),
      fees: total.mul('0.05'),
      tax: total.mul('0.05'),
      tip: new Decimal('0'),
      total,
      serviceFeePercent: new Decimal('5.00'),
      serviceFeeAmount: SERVICE_FEE_AMOUNT,
      netToVendor: total.mul('0.95'),
    },
  })
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('buildAffiliateCommissionCandidatesForOrder', () => {
  let affiliateUserId: string
  let storeOwnerUserId: string
  let buyerUserId: string
  let affiliateId: string
  let referralCode: string
  let storeId: string

  beforeEach(async () => {
    const affiliateUser = await createAuthenticatedUser('USER')
    const storeOwner = await createAuthenticatedUser('VENDOR')
    const buyer = await createAuthenticatedUser('USER')

    affiliateUserId = affiliateUser.id
    storeOwnerUserId = storeOwner.id
    buyerUserId = buyer.id

    const affiliate = await createAffiliate(affiliateUserId)
    affiliateId = affiliate.id
    referralCode = affiliate.referralCode

    const store = await createTestStore(storeOwnerUserId, { isPublished: true })
    storeId = store.id
  })

  afterEach(async () => {
    await cleanupTestData()
    await prisma.affiliate.deleteMany({ where: { userId: { in: [affiliateUserId, storeOwnerUserId, buyerUserId] } } })
    await prisma.user.deleteMany({ where: { id: { in: [affiliateUserId, storeOwnerUserId, buyerUserId] } } })
  })

  // ── Test 7: Self-referral ─────────────────────────────────────────────────

  it('creates no commission when the buyer is the affiliate themselves (self-referral)', async () => {
    // The buyer IS the affiliate — order attributed to themselves.
    const order = await createAttributedOrder({
      buyerId: affiliateUserId, // same as affiliate owner
      storeId,
      affiliateId,
      referralCode,
      status: 'PLACED',
      paymentStatus: 'PAID',
      stripePaymentIntentId: 'pi_test_selfreferral',
    })

    const candidates = await buildAffiliateCommissionCandidatesForOrder(order.id)
    expect(candidates).toHaveLength(0)
  })

  // ── Test 8: Same-affiliate no-double-dip ──────────────────────────────────

  it('skips STORE_REVENUE when store referral and customer referral belong to the same affiliate', async () => {
    // Store is also attributed to the same affiliate.
    await prisma.store.update({
      where: { id: storeId },
      data: { referredByAffiliateId: affiliateId },
    })

    const order = await createAttributedOrder({
      buyerId: buyerUserId,
      storeId,
      affiliateId, // same affiliate attributed on the order (customer path)
      referralCode,
      paymentStatus: 'PAID',
      stripePaymentIntentId: 'pi_test_nodoubledip',
    })

    const candidates = await buildAffiliateCommissionCandidatesForOrder(order.id)
    expect(candidates).toHaveLength(1)
    expect(candidates[0]!.sourceType).toBe('CUSTOMER_PURCHASE')
  })

  // ── COD eligibility: PLACED → no commission yet ───────────────────────────

  it('returns no candidates for a COD order that is only PLACED (not yet delivered)', async () => {
    const order = await createAttributedOrder({
      buyerId: buyerUserId,
      storeId,
      affiliateId,
      referralCode,
      status: 'PLACED',
      paymentStatus: 'UNPAID',
      // stripePaymentIntentId omitted (null by default = COD)
    })

    const candidates = await buildAffiliateCommissionCandidatesForOrder(order.id)
    expect(candidates).toHaveLength(0)
  })

  // ── COD eligibility: DELIVERED → commission created ───────────────────────

  it('returns CUSTOMER_PURCHASE candidate for a COD order that reached DELIVERED', async () => {
    const order = await createAttributedOrder({
      buyerId: buyerUserId,
      storeId,
      affiliateId,
      referralCode,
      status: 'DELIVERED',
      paymentStatus: 'UNPAID',
      // stripePaymentIntentId null by default = COD
    })

    const candidates = await buildAffiliateCommissionCandidatesForOrder(order.id)
    expect(candidates.length).toBeGreaterThanOrEqual(1)
    const customer = candidates.find((c) => c.sourceType === 'CUSTOMER_PURCHASE')
    expect(customer).toBeDefined()
    expect(customer!.affiliateId).toBe(affiliateId)
    expect(customer!.amountCents).toBeGreaterThan(0)
  })

  // ── Idempotency (Test 5): runAffiliateCommissions twice = 1 row ───────────

  it('running commission twice for the same COD-fulfilled order creates exactly one Commission row', async () => {
    const order = await createAttributedOrder({
      buyerId: buyerUserId,
      storeId,
      affiliateId,
      referralCode,
      status: 'DELIVERED',
      paymentStatus: 'UNPAID',
    })

    await runAffiliateCommissions(order.id)
    await runAffiliateCommissions(order.id)

    const commissions = await prisma.commission.findMany({ where: { orderId: order.id } })
    expect(commissions).toHaveLength(1)
    expect(commissions[0]!.status).toBe('PENDING')
  })
})
