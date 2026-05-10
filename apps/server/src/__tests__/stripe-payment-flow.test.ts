/**
 * Integration Test: Stripe Payment Flow
 * Tests the full payment lifecycle: order creation → PI → webhook → PLACED
 * Also verifies idempotency and payment failure handling.
 */

import { randomUUID } from 'crypto'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  prisma,
  Decimal,
  handlePaymentIntentSucceeded,
  handlePaymentIntentFailed,
} from '@packages/db'

describe('Stripe Payment Flow', () => {
  let testUserId: string
  let testStoreId: string
  let testOrderId: string

  beforeEach(async () => {
    const user = await prisma.user.create({
      data: {
        email: `pay-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
        passwordHash: 'test',
        name: 'Payment Test User',
      },
    })
    testUserId = user.id

    const store = await prisma.store.create({
      data: {
        ownerUserId: testUserId,
        name: 'Payment Test Store',
        slug: `pay-store-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        prepTimeMin: 15,
      },
    })
    testStoreId = store.id
  })

  async function createPendingOrder(piId?: string) {
    const order = await prisma.order.create({
      data: {
        userId: testUserId,
        storeId: testStoreId,
        status: 'PENDING_PAYMENT',
        deliveryType: 'PICKUP',
        paymentStatus: 'UNPAID',
        subtotal: 20.0,
        fees: 0,
        tax: 1.6,
        tip: 0,
        total: 21.6,
        serviceFeePercent: 3.0,
        serviceFeeAmount: 0.6,
        netToVendor: 21.0,
        stripePaymentIntentId: piId,
      },
    })
    testOrderId = order.id
    return order
  }

  // ── payment_intent.succeeded ─────────────────────────────────────────────

  it('should mark order PAID and transition PENDING_PAYMENT → PLACED on payment success', async () => {
    const piId = `pi_test_flow_${randomUUID()}`
    await createPendingOrder(piId)

    await handlePaymentIntentSucceeded(piId)

    const order = await prisma.order.findUnique({ where: { id: testOrderId } })
    expect(order?.paymentStatus).toBe('PAID')
    expect(order?.status).toBe('PLACED')
  })

  it('should create OrderEvent audit entry for PLACED transition on payment success', async () => {
    const piId = `pi_test_flow_${randomUUID()}`
    await createPendingOrder(piId)

    await handlePaymentIntentSucceeded(piId)

    const events = await prisma.orderEvent.findMany({
      where: { orderId: testOrderId },
      orderBy: { createdAt: 'asc' },
    })
    expect(events.length).toBeGreaterThanOrEqual(1)

    const placedEvent = events.find((e) => e.status === 'PLACED')
    expect(placedEvent).toBeDefined()
    expect(placedEvent?.note).toBe('Payment confirmed')
  })

  it('should no-op when webhook retries after order is already PAID and PLACED', async () => {
    const piId = `pi_already_done_${randomUUID()}`
    await prisma.order.create({
      data: {
        userId: testUserId,
        storeId: testStoreId,
        status: 'PLACED',
        deliveryType: 'PICKUP',
        paymentStatus: 'PAID',
        subtotal: 2,
        fees: 0,
        tax: 0,
        tip: 0,
        total: 2,
        serviceFeePercent: 0,
        serviceFeeAmount: 0,
        netToVendor: 2,
        stripePaymentIntentId: piId,
      },
    })

    await expect(handlePaymentIntentSucceeded(piId)).resolves.not.toThrow()

    const after = await prisma.order.findFirst({ where: { stripePaymentIntentId: piId } })
    expect(after?.status).toBe('PLACED')
    expect(after?.paymentStatus).toBe('PAID')
  })

  it('should not double-transition an already PLACED order on duplicate webhook', async () => {
    const piId = `pi_test_flow2_${randomUUID()}`
    const order = await prisma.order.create({
      data: {
        userId: testUserId,
        storeId: testStoreId,
        status: 'PLACED',
        deliveryType: 'PICKUP',
        paymentStatus: 'PAID',
        subtotal: 10.0,
        fees: 0,
        tax: 0.8,
        tip: 0,
        total: 10.8,
        serviceFeePercent: 3.0,
        serviceFeeAmount: 0.3,
        netToVendor: 10.5,
        stripePaymentIntentId: piId,
      },
    })
    testOrderId = order.id

    // Second webhook delivery — should not throw or re-transition
    await expect(handlePaymentIntentSucceeded(piId)).resolves.not.toThrow()

    const after = await prisma.order.findUnique({ where: { id: testOrderId } })
    expect(after?.status).toBe('PLACED')
    expect(after?.paymentStatus).toBe('PAID')
  })

  it('should silently skip when no order matches the payment intent', async () => {
    await expect(handlePaymentIntentSucceeded('pi_unknown_xyz')).resolves.not.toThrow()
  })

  // ── payment_intent.payment_failed ────────────────────────────────────────

  it('should leave order PENDING_PAYMENT and record OrderEvent on payment failure', async () => {
    const piId = `pi_test_flow_${randomUUID()}`
    await createPendingOrder(piId)

    await handlePaymentIntentFailed(piId)

    const order = await prisma.order.findUnique({ where: { id: testOrderId } })
    expect(order?.paymentStatus).toBe('UNPAID')
    expect(order?.status).toBe('PENDING_PAYMENT')

    const events = await prisma.orderEvent.findMany({ where: { orderId: testOrderId } })
    expect(events.length).toBeGreaterThanOrEqual(1)
    const failedEvent = events.find((e) => e.note?.includes('Payment failed'))
    expect(failedEvent).toBeDefined()
  })

  it('should silently skip when no order matches a failed payment intent', async () => {
    await expect(handlePaymentIntentFailed('pi_unknown_xyz')).resolves.not.toThrow()
  })

  // ── Order initial status ──────────────────────────────────────────────────

  it('should start orders in PENDING_PAYMENT status', async () => {
    const order = await createPendingOrder()
    expect(order.status).toBe('PENDING_PAYMENT')
    expect(order.paymentStatus).toBe('UNPAID')
  })

  // ── State machine includes PENDING_PAYMENT ────────────────────────────────

  it('should allow PENDING_PAYMENT → PLACED transition', async () => {
    const { canTransitionTo } = await import('@packages/db')
    expect(canTransitionTo('PENDING_PAYMENT', 'PLACED').valid).toBe(true)
  })

  it('should allow PENDING_PAYMENT → CANCELED transition', async () => {
    const { canTransitionTo } = await import('@packages/db')
    expect(canTransitionTo('PENDING_PAYMENT', 'CANCELED').valid).toBe(true)
  })

  it('should block skipping PENDING_PAYMENT directly to ACCEPTED', async () => {
    const { canTransitionTo } = await import('@packages/db')
    const result = canTransitionTo('PENDING_PAYMENT', 'ACCEPTED')
    expect(result.valid).toBe(false)
  })
})

// ─── Commission creation via payment webhook ──────────────────────────────────

describe('Stripe webhook → affiliate commission creation (Phase 3B)', () => {
  const piPrefix = `pi_comm_test_`
  const createdUserIds: string[] = []
  const createdAffiliateIds: string[] = []
  const createdOrderIds: string[] = []

  afterEach(async () => {
    await prisma.commission.deleteMany({ where: { orderId: { in: createdOrderIds } } })
    await prisma.orderItem.deleteMany({ where: { orderId: { in: createdOrderIds } } })
    await prisma.orderEvent.deleteMany({ where: { orderId: { in: createdOrderIds } } })
    await prisma.order.deleteMany({ where: { id: { in: createdOrderIds } } })
    await prisma.store.deleteMany({
      where: { slug: { startsWith: 'pi-comm-store-' } },
    })
    await prisma.affiliate.deleteMany({ where: { id: { in: createdAffiliateIds } } })
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } })
    createdUserIds.length = 0
    createdAffiliateIds.length = 0
    createdOrderIds.length = 0
  })

  const makeUser = async (tag: string) => {
    const u = await prisma.user.create({
      data: {
        email: `pi-comm-${tag}-${randomUUID()}@test.com`,
        passwordHash: 'x',
        name: tag,
      },
    })
    createdUserIds.push(u.id)
    return u
  }

  const makeAffiliate = async (userId: string) => {
    const a = await prisma.affiliate.create({
      data: {
        userId,
        referralCode: `PICT${randomUUID().slice(0, 6).toUpperCase()}`,
        status: 'ACTIVE',
        commissionRate: new Decimal('0.05'),
        payoutProvider: 'MANUAL',
        payoutProviderStatus: 'NOT_SET',
        customerRateBpsOverride: 500,
      },
    })
    createdAffiliateIds.push(a.id)
    return a
  }

  const makeOrder = async (opts: {
    userId: string
    storeId: string
    piId: string
    referredByAffiliateId?: string
  }) => {
    const o = await prisma.order.create({
      data: {
        userId: opts.userId,
        storeId: opts.storeId,
        status: 'PENDING_PAYMENT',
        paymentStatus: 'UNPAID',
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
        stripePaymentIntentId: opts.piId,
        ...(opts.referredByAffiliateId ? { referredByAffiliateId: opts.referredByAffiliateId } : {}),
      },
    })
    createdOrderIds.push(o.id)
    return o
  }

  it('creates a CUSTOMER_PURCHASE commission when buyer is attributed to an active affiliate', async () => {
    const vendor = await makeUser('vendor')
    const buyer = await makeUser('buyer')
    const affUser = await makeUser('aff-user')
    const store = await prisma.store.create({
      data: { ownerUserId: vendor.id, name: 'Comm Store', slug: `pi-comm-store-${randomUUID()}` },
    })
    const affiliate = await makeAffiliate(affUser.id)

    const piId = `${piPrefix}${randomUUID()}`
    await makeOrder({ userId: buyer.id, storeId: store.id, piId, referredByAffiliateId: affiliate.id })

    await handlePaymentIntentSucceeded(piId)

    const commissions = await prisma.commission.findMany({
      where: { orderId: createdOrderIds[createdOrderIds.length - 1]! },
    })
    expect(commissions).toHaveLength(1)
    expect(commissions[0]!.sourceType).toBe('CUSTOMER_PURCHASE')
    expect(commissions[0]!.affiliateId).toBe(affiliate.id)
    expect(commissions[0]!.amountCents).toBe(13) // round((250 * 500) / 10000)
    expect(commissions[0]!.rateBps).toBe(500)
    expect(commissions[0]!.status).toBe('PENDING')
    // Legacy Decimal mirrors kept in sync
    expect(Number(commissions[0]!.amount)).toBeCloseTo(0.13, 5)
  })

  it('creates STORE_REVENUE commission when store is attributed to a different active affiliate', async () => {
    const vendor = await makeUser('vendor2')
    const buyer = await makeUser('buyer2')
    const affUser1 = await makeUser('aff-buyer')
    const affUser2 = await makeUser('aff-store')
    const store = await prisma.store.create({
      data: { ownerUserId: vendor.id, name: 'Comm Store 2', slug: `pi-comm-store-${randomUUID()}` },
    })
    const buyerAffiliate = await makeAffiliate(affUser1.id)
    const storeAffiliate = await makeAffiliate(affUser2.id)

    // Attribute the store to the storeAffiliate
    await prisma.store.update({
      where: { id: store.id },
      data: { referredByAffiliateId: storeAffiliate.id },
    })

    const piId = `${piPrefix}${randomUUID()}`
    await makeOrder({
      userId: buyer.id,
      storeId: store.id,
      piId,
      referredByAffiliateId: buyerAffiliate.id,
    })

    await handlePaymentIntentSucceeded(piId)

    const commissions = await prisma.commission.findMany({
      where: { orderId: createdOrderIds[createdOrderIds.length - 1]! },
      orderBy: { sourceType: 'asc' },
    })
    expect(commissions).toHaveLength(2)
    const cp = commissions.find((c) => c.sourceType === 'CUSTOMER_PURCHASE')!
    const sr = commissions.find((c) => c.sourceType === 'STORE_REVENUE')!
    expect(cp.affiliateId).toBe(buyerAffiliate.id)
    expect(sr.affiliateId).toBe(storeAffiliate.id)
    expect(cp.amountCents).toBe(13)
    expect(sr.amountCents).toBe(13)
  })

  it('does not duplicate commissions when handlePaymentIntentSucceeded is called twice (idempotent)', async () => {
    const vendor = await makeUser('vendor3')
    const buyer = await makeUser('buyer3')
    const affUser = await makeUser('aff-idem')
    const store = await prisma.store.create({
      data: { ownerUserId: vendor.id, name: 'Idem Store', slug: `pi-comm-store-${randomUUID()}` },
    })
    const affiliate = await makeAffiliate(affUser.id)

    const piId = `${piPrefix}${randomUUID()}`
    await makeOrder({ userId: buyer.id, storeId: store.id, piId, referredByAffiliateId: affiliate.id })

    await handlePaymentIntentSucceeded(piId)
    await handlePaymentIntentSucceeded(piId) // second call — idempotent path

    const count = await prisma.commission.count({
      where: { orderId: createdOrderIds[createdOrderIds.length - 1]! },
    })
    expect(count).toBe(1)
  })

  it('creates no commission when order has no affiliate attribution', async () => {
    const vendor = await makeUser('vendor4')
    const buyer = await makeUser('buyer4')
    const store = await prisma.store.create({
      data: { ownerUserId: vendor.id, name: 'No-Aff Store', slug: `pi-comm-store-${randomUUID()}` },
    })

    const piId = `${piPrefix}${randomUUID()}`
    await makeOrder({ userId: buyer.id, storeId: store.id, piId })

    await handlePaymentIntentSucceeded(piId)

    const count = await prisma.commission.count({
      where: { orderId: createdOrderIds[createdOrderIds.length - 1]! },
    })
    expect(count).toBe(0)
  })
})
