/**
 * Integration tests for commission creation triggered by order status transitions.
 * Tests that DELIVERED and COMPLETED milestones fire runAffiliateCommissions correctly.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { prisma, Decimal, orderService, runAffiliateCommissions } from '@packages/db'
import {
  createAuthenticatedUser,
  createTestStore,
  cleanupTestData,
  TEST_NAMESPACE,
} from '../__tests__/helpers.js'

// ─── Shared helpers ───────────────────────────────────────────────────────────

async function createAffiliate(userId: string) {
  const { randomUUID } = await import('crypto')
  return prisma.affiliate.create({
    data: {
      userId,
      referralCode: `${TEST_NAMESPACE.slice(0, 6)}-${randomUUID().slice(0, 8)}`.toUpperCase(),
      status: 'ACTIVE',
    },
  })
}

async function createCodOrderAtStatus(opts: {
  buyerId: string
  storeId: string
  affiliateId: string
  referralCode: string
  status: string
}) {
  const total = new Decimal('50.00')
  return prisma.order.create({
    data: {
      userId: opts.buyerId,
      storeId: opts.storeId,
      status: opts.status as any,
      paymentStatus: 'UNPAID',
      deliveryType: 'PICKUP',
      deliveryMode: 'PICKUP',
      referredByAffiliateId: opts.affiliateId,
      referredByReferralCode: opts.referralCode,
      affiliateAttributionSource: 'CUSTOMER_REFERRAL',
      // stripePaymentIntentId intentionally omitted → null → COD
      subtotal: total.mul('0.80'),
      fees: total.mul('0.05'),
      tax: total.mul('0.05'),
      tip: new Decimal('0'),
      total,
      serviceFeePercent: new Decimal('5.00'),
      serviceFeeAmount: new Decimal('2.50'),
      netToVendor: total.mul('0.95'),
    },
  })
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('OrderService commission milestones (COD)', () => {
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

  // ── Test 3: DELIVERED creates PENDING commission ──────────────────────────

  it('creates a PENDING Commission when a COD order transitions to DELIVERED', async () => {
    // Valid pre-transition state: OUT_FOR_DELIVERY → DELIVERED
    const order = await createCodOrderAtStatus({
      buyerId: buyerUserId,
      storeId,
      affiliateId,
      referralCode,
      status: 'OUT_FOR_DELIVERY',
    })

    await orderService.transitionOrderStatus({ orderId: order.id, newStatus: 'DELIVERED' })

    const commissions = await prisma.commission.findMany({ where: { orderId: order.id } })
    expect(commissions.length).toBeGreaterThanOrEqual(1)
    expect(commissions[0]!.status).toBe('PENDING')
    expect(commissions[0]!.affiliateId).toBe(affiliateId)
  })

  // ── Test 4: COMPLETED order creates PENDING commission ────────────────────

  it('creates a PENDING Commission when runAffiliateCommissions is called on a COD COMPLETED order', async () => {
    // COMPLETED is a legacy terminal state — no state-machine transition leads to it.
    // We create the order directly at COMPLETED and call runAffiliateCommissions to verify
    // the commission builder handles the COMPLETED milestone.
    const order = await createCodOrderAtStatus({
      buyerId: buyerUserId,
      storeId,
      affiliateId,
      referralCode,
      status: 'COMPLETED',
    })

    await runAffiliateCommissions(order.id)

    const commissions = await prisma.commission.findMany({ where: { orderId: order.id } })
    expect(commissions.length).toBeGreaterThanOrEqual(1)
    expect(commissions[0]!.status).toBe('PENDING')
  })

  // ── Test 5: Transition to DELIVERED doesn't duplicate commissions ──────────

  it('does not duplicate commissions if the order is already DELIVERED (idempotent upsert)', async () => {
    const order = await createCodOrderAtStatus({
      buyerId: buyerUserId,
      storeId,
      affiliateId,
      referralCode,
      status: 'OUT_FOR_DELIVERY',
    })

    // First transition — fires runAffiliateCommissions internally
    await orderService.transitionOrderStatus({ orderId: order.id, newStatus: 'DELIVERED' })

    // Direct second call — simulates a retry or background job re-run
    await runAffiliateCommissions(order.id)

    const commissions = await prisma.commission.findMany({ where: { orderId: order.id } })
    // Should still have exactly the same commission rows — no duplicates
    expect(commissions).toHaveLength(1)
  })
})
