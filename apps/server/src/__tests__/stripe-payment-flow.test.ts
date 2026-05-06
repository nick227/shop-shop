/**
 * Integration Test: Stripe Payment Flow
 * Tests the full payment lifecycle: order creation → PI → webhook → PLACED
 * Also verifies idempotency and payment failure handling.
 */

import { randomUUID } from 'crypto'
import { describe, it, expect, beforeEach } from 'vitest'
import {
  prisma,
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
