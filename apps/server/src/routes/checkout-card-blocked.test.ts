/**
 * Card checkout returns 402 when the store cannot accept online cards (Connect gate).
 */
import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest'
import Fastify from 'fastify'
import checkoutRoutes from './checkout.js'
import { globalErrorHandler } from '../middleware/errorHandler.js'
import {
  createAuthenticatedUser,
  authHeaders,
  createTestStore,
  createTestItem,
  cleanupTestData,
  TEST_NAMESPACE,
} from '../__tests__/helpers.js'
import { prisma } from '@packages/db'

describe('Checkout complete blocks card when store cannot accept online payments', () => {
  const app = Fastify({ logger: false })
  app.setErrorHandler(globalErrorHandler)

  let user: Awaited<ReturnType<typeof createAuthenticatedUser>>
  let storeId: string
  let itemId: string

  beforeAll(async () => {
    await app.register(checkoutRoutes, { prefix: '/api/v1/checkout' })
    await app.ready()
  })

  beforeEach(async () => {
    user = await createAuthenticatedUser('USER')
    const store = await createTestStore(user.id, {
      isPublished: true,
      stripeAccountId: null,
      stripeOnboarded: false,
      stripeChargesEnabled: false,
    })
    storeId = store.id
    const item = await createTestItem(storeId, { isActive: true })
    itemId = item.id
  })

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { startsWith: TEST_NAMESPACE } } })
    await cleanupTestData()
    await app.close()
  })

  it('returns 402 on complete when Stripe Connect / charges are not ready', async () => {
    const sessionResp = await app.inject({
      method: 'POST',
      url: '/api/v1/checkout/session',
      headers: authHeaders(user.token),
      payload: {
        items: [{ itemId, quantity: 1 }],
        deliveryType: 'PICKUP',
        deliveryMode: 'PICKUP',
        paymentMethod: { type: 'CREDIT_CARD', token: 'pm_test_visa' },
        tipAmount: 0,
      },
    })
    expect(sessionResp.statusCode).toBe(200)
    const { sessionId } = JSON.parse(sessionResp.body) as { sessionId: string }

    const completeResp = await app.inject({
      method: 'POST',
      url: '/api/v1/checkout/complete',
      headers: authHeaders(user.token),
      payload: {
        sessionId,
        paymentMethod: { type: 'CREDIT_CARD', token: 'pm_test_visa' },
        tipAmount: 0,
      },
    })

    expect(completeResp.statusCode).toBe(402)
    const body = JSON.parse(completeResp.body) as { message?: string }
    expect(body.message).toMatch(/cannot accept card payments|Stripe Connect/i)

    const pending = await prisma.order.findFirst({
      where: { cartId: sessionId },
      select: { paymentStatus: true, status: true },
    })
    expect(pending?.status).toBe('PENDING_PAYMENT')
    expect(pending?.paymentStatus).toBe('UNPAID')
  })
})
