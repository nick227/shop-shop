/**
 * COD rail: enabled vs disabled, and no Stripe API for COD completion.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

vi.mock('../config/stripeConnectUrls.js', () => ({
  resolveStripeConnectUrls: vi.fn(() => ({
    returnUrl: 'http://localhost:5177/vendor/connect/success',
    refreshUrl: 'http://localhost:5177/vendor/connect/refresh',
  })),
  isCodPaymentsEnabled: vi.fn(),
}))

const processOrderPaymentMock = vi.fn()

vi.mock('@packages/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@packages/db')>()
  return {
    ...actual,
    processOrderPayment: (...args: Parameters<typeof actual.processOrderPayment>) =>
      processOrderPaymentMock(...args),
  }
})

import { isCodPaymentsEnabled } from '../config/stripeConnectUrls.js'
import { completeCheckout, createCheckoutSession } from './checkout.service.js'
import { prisma } from '@packages/db'
import {
  createAuthenticatedUser,
  createTestStore,
  createTestItem,
  cleanupTestData,
} from '../__tests__/helpers.js'

describe('completeCheckout COD rail', () => {
  let userId: string
  let sessionId: string

  beforeEach(async () => {
    processOrderPaymentMock.mockReset()
    vi.mocked(isCodPaymentsEnabled).mockReset()

    const user = await createAuthenticatedUser('USER')
    userId = user.id
    const store = await createTestStore(userId, { isPublished: true })
    const item = await createTestItem(store.id, { isActive: true })

    const session = await createCheckoutSession(userId, {
      items: [{ itemId: item.id, quantity: 1 }],
      deliveryType: 'PICKUP',
      deliveryMode: 'PICKUP',
      paymentMethod: { type: 'CREDIT_CARD', token: 'pm_hold' },
      tipAmount: 0,
    })
    sessionId = session.sessionId
  })

  afterEach(async () => {
    await cleanupTestData()
    await prisma.user.deleteMany({ where: { id: userId } })
  })

  it('returns 403 when COD is disabled (explicit paymentRail)', async () => {
    vi.mocked(isCodPaymentsEnabled).mockReturnValue(false)

    await expect(
      completeCheckout(userId, {
        sessionId,
        paymentMethod: { type: 'CREDIT_CARD', token: 'pm_test_visa' },
        tipAmount: 0,
        paymentRail: 'COD',
      }),
    ).rejects.toMatchObject({
      message: expect.stringMatching(/not enabled/i),
    })

    expect(processOrderPaymentMock).not.toHaveBeenCalled()
  })

  it('returns 403 when COD is disabled (cod_test token resolves to COD)', async () => {
    vi.mocked(isCodPaymentsEnabled).mockReturnValue(false)

    await expect(
      completeCheckout(userId, {
        sessionId,
        paymentMethod: { type: 'CREDIT_CARD', token: 'cod_test' },
        tipAmount: 0,
      }),
    ).rejects.toMatchObject({
      message: expect.stringMatching(/not enabled/i),
    })

    expect(processOrderPaymentMock).not.toHaveBeenCalled()
  })

  it('returns 400 when COD disabled but client forces CARD with cod_test token', async () => {
    vi.mocked(isCodPaymentsEnabled).mockReturnValue(false)

    await expect(
      completeCheckout(userId, {
        sessionId,
        paymentMethod: { type: 'CREDIT_CARD', token: 'cod_test' },
        tipAmount: 0,
        paymentRail: 'CARD',
      }),
    ).rejects.toMatchObject({
      message: expect.stringMatching(/Invalid Stripe payment method/i),
    })

    expect(processOrderPaymentMock).not.toHaveBeenCalled()
  })

  it('creates PLACED + UNPAID and does not call Stripe when COD is enabled', async () => {
    vi.mocked(isCodPaymentsEnabled).mockReturnValue(true)

    const result = await completeCheckout(userId, {
      sessionId,
      paymentMethod: { type: 'CREDIT_CARD', token: 'cod_test' },
      tipAmount: 0,
    })

    expect(result.paymentId).toBeNull()
    expect(result.order.status).toBe('PLACED')

    expect(processOrderPaymentMock).not.toHaveBeenCalled()

    const row = await prisma.order.findUnique({
      where: { id: result.order.id },
      select: { paymentStatus: true, status: true, stripePaymentIntentId: true },
    })
    expect(row?.paymentStatus).toBe('UNPAID')
    expect(row?.status).toBe('PLACED')
    expect(row?.stripePaymentIntentId).toBeNull()
  })
})
