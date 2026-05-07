import { randomUUID } from 'crypto'
import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest'
import Fastify from 'fastify'

vi.mock('@packages/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@packages/db')>()

  return {
    ...actual,
    processOrderPayment: async (input: { orderId: string; userId: string; paymentMethodId?: string }) => {
      const order = await actual.prisma.order.findUnique({
        where: { id: input.orderId },
        select: { id: true, userId: true, total: true, paymentStatus: true },
      })
      if (!order) throw new Error('Order not found')
      if (order.userId !== input.userId) throw new Error('Unauthorized: Order does not belong to user')
      if (order.paymentStatus === 'PAID') throw new Error('Order already paid')

      const paymentIntentId = `pi_mock_${randomUUID()}`
      await actual.prisma.order.update({
        where: { id: order.id },
        data: { stripePaymentIntentId: paymentIntentId },
      })

      return {
        paymentIntentId,
        clientSecret: `secret_${paymentIntentId}`,
        amount: Number(order.total) * 100,
        status: 'succeeded',
      }
    },
  }
})

import checkoutRoutes from './checkout.js'
import { prisma, handlePaymentIntentSucceeded } from '@packages/db'
import { createAuthenticatedUser, authHeaders, createTestStore, createTestItem, cleanupTestData } from '../__tests__/helpers.js'

describe('Checkout Routes E2E', () => {
  const app = Fastify({ logger: false })

  let user: Awaited<ReturnType<typeof createAuthenticatedUser>>
  let storeId: string
  let itemId: string

  beforeAll(async () => {
    await app.register(checkoutRoutes, { prefix: '/api/v1/checkout' })
    await app.ready()
  })

  beforeEach(async () => {
    user = await createAuthenticatedUser('USER')
    const store = await createTestStore(user.id, { isPublished: true })
    storeId = store.id
    const item = await createTestItem(storeId, { isActive: true })
    itemId = item.id
  })

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { contains: '@checkout.local' } } })
    await cleanupTestData()
    await app.close()
  })

  it('completes a full payment flow from cart → order → payment confirmation', async () => {
    const sessionResp = await app.inject({
      method: 'POST',
      url: '/api/v1/checkout/session',
      headers: authHeaders(user.token),
      payload: {
        items: [{ itemId, quantity: 2 }],
        deliveryType: 'PICKUP',
        paymentMethod: { type: 'CREDIT_CARD', token: 'pm_test_visa' },
        tipAmount: 2.5,
      },
    })
    expect(sessionResp.statusCode, sessionResp.body).toBe(200)
    const sessionBody = JSON.parse(sessionResp.body) as { sessionId: string; total: number }
    expect(sessionBody.sessionId).toBeTruthy()
    expect(sessionBody.total).toBeGreaterThan(0)

    const completeResp = await app.inject({
      method: 'POST',
      url: '/api/v1/checkout/complete',
      headers: authHeaders(user.token),
      payload: {
        sessionId: sessionBody.sessionId,
        paymentMethod: { type: 'CREDIT_CARD', token: 'pm_test_visa' },
        tipAmount: 2.5,
      },
    })
    expect(completeResp.statusCode, completeResp.body).toBe(200)
    const completeBody = JSON.parse(completeResp.body) as { order: { id: string; status: string }; paymentId: string }
    expect(completeBody.order.id).toBeTruthy()
    expect(completeBody.order.status).toBe('PENDING_PAYMENT')
    expect(completeBody.paymentId).toMatch(/^pi_/)

    // Stripe webhook handler confirms payment and transitions order → PLACED
    await handlePaymentIntentSucceeded(completeBody.paymentId)
    const updated = await prisma.order.findUnique({
      where: { id: completeBody.order.id },
      select: { status: true, paymentStatus: true, cartId: true, storeId: true },
    })
    expect(updated?.paymentStatus).toBe('PAID')
    expect(updated?.status).toBe('PLACED')
    expect(updated?.cartId).toBe(sessionBody.sessionId)
    expect(updated?.storeId).toBe(storeId)

    const statusResp = await app.inject({
      method: 'GET',
      url: `/api/v1/checkout/status/${sessionBody.sessionId}`,
      headers: authHeaders(user.token),
    })
    expect(statusResp.statusCode, statusResp.body).toBe(200)
    const statusBody = JSON.parse(statusResp.body) as { order: { id: string; status: string; paymentStatus: string } | null }
    expect(statusBody.order?.id).toBe(completeBody.order.id)
    expect(statusBody.order?.paymentStatus).toBe('PAID')
  })

  it('supports guest checkout (no auth) and still creates a paid order', async () => {
    const sessionResp = await app.inject({
      method: 'POST',
      url: '/api/v1/checkout/session',
      payload: {
        items: [{ itemId, quantity: 1 }],
        deliveryType: 'PICKUP',
        paymentMethod: { type: 'CREDIT_CARD', token: 'pm_test_guest' },
      },
    })
    expect(sessionResp.statusCode, sessionResp.body).toBe(200)
    const { sessionId } = JSON.parse(sessionResp.body) as { sessionId: string }

    const completeResp = await app.inject({
      method: 'POST',
      url: '/api/v1/checkout/complete',
      payload: {
        sessionId,
        paymentMethod: { type: 'CREDIT_CARD', token: 'pm_test_guest' },
        tipAmount: 0,
      },
    })
    expect(completeResp.statusCode, completeResp.body).toBe(200)
    const completeBody = JSON.parse(completeResp.body) as { order: { id: string }; paymentId: string }

    await handlePaymentIntentSucceeded(completeBody.paymentId)
    const updated = await prisma.order.findUnique({
      where: { id: completeBody.order.id },
      select: { status: true, paymentStatus: true },
    })
    expect(updated?.paymentStatus).toBe('PAID')
    expect(updated?.status).toBe('PLACED')
  })
})

