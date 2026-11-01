/**
 * New orders require an available store: published, administratively ACTIVE, and not paused by the merchant.
 * Checked when the checkout session starts and again inside the order transaction.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

vi.mock('../config/stripeConnectUrls.js', () => ({
  resolveStripeConnectUrls: vi.fn(() => ({ returnUrl: 'http://x/success', refreshUrl: 'http://x/refresh' })),
  isCodPaymentsEnabled: vi.fn(() => true),
}))

const processOrderPaymentMock = vi.fn()

vi.mock('@packages/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@packages/db')>()
  return {
    ...actual,
    processOrderPayment: (...args: Parameters<typeof actual.processOrderPayment>) => processOrderPaymentMock(...args),
  }
})

import { prisma, storeOrderingBlock } from '@packages/db'
import { completeCheckout, createCheckoutSession } from './checkout.service.js'
import { createAuthenticatedUser, createTestStore, createTestItem, cleanupTestData } from '../__tests__/helpers.js'

const COD = { sessionId: '', paymentMethod: { type: 'CASH', token: 'cod_test' }, tipAmount: 0, paymentRail: 'COD' as const }

describe('store availability at checkout', () => {
  let userId: string
  let storeId: string
  let itemId: string

  const startSession = () =>
    createCheckoutSession(userId, {
      items: [{ itemId, quantity: 1 }],
      deliveryType: 'PICKUP',
      deliveryMode: 'PICKUP',
      paymentMethod: { type: 'CASH', token: 'cod_test' },
      tipAmount: 0,
    })

  beforeEach(async () => {
    processOrderPaymentMock.mockReset()
    const user = await createAuthenticatedUser('USER')
    userId = user.id
    const store = await createTestStore(userId, { isPublished: true })
    storeId = store.id
    itemId = (await createTestItem(storeId, { isActive: true })).id
  })

  afterEach(async () => {
    await cleanupTestData()
    await prisma.user.deleteMany({ where: { id: userId } })
  })

  it.each([
    ['paused by the merchant', { acceptingOrders: false }, /not taking orders/],
    ['suspended by an admin', { status: 'PAUSED' as const }, /temporarily unavailable/],
    ['disabled by an admin', { status: 'DISABLED' as const }, /unavailable/],
    ['unpublished', { isPublished: false }, /not open yet/],
  ])('refuses to start checkout when the store is %s', async (_label, change, message) => {
    await prisma.store.update({ where: { id: storeId }, data: change })
    await expect(startSession()).rejects.toMatchObject({ statusCode: 409, message: expect.stringMatching(message) })
  })

  it('refuses to create the order when the store pauses after checkout started', async () => {
    const session = await startSession()
    await prisma.store.update({ where: { id: storeId }, data: { acceptingOrders: false } })

    await expect(completeCheckout(userId, { ...COD, sessionId: session.sessionId })).rejects.toMatchObject({
      statusCode: 409,
    })

    expect(await prisma.order.count({ where: { cartId: session.sessionId } })).toBe(0)
    const cart = await prisma.cart.findUnique({ where: { id: session.sessionId }, select: { status: true } })
    expect(cart?.status).toBe('ACTIVE')
  })

  it('still creates the order when the store is available', async () => {
    const session = await startSession()
    const result = await completeCheckout(userId, { ...COD, sessionId: session.sessionId })
    expect(result).toBeTruthy()
    expect(await prisma.order.count({ where: { cartId: session.sessionId } })).toBe(1)
  })
})

describe('storeOrderingBlock', () => {
  it('lets administrative restrictions win over the merchant switch', () => {
    expect(storeOrderingBlock({ status: 'DISABLED', isPublished: true, acceptingOrders: true })).toBe('DISABLED')
    expect(storeOrderingBlock({ status: 'PAUSED', isPublished: true, acceptingOrders: true })).toBe('SUSPENDED')
    expect(storeOrderingBlock({ status: 'ACTIVE', isPublished: true, acceptingOrders: false })).toBe('PAUSED_BY_STORE')
    expect(storeOrderingBlock({ status: 'ACTIVE', isPublished: true, acceptingOrders: true })).toBeNull()
  })
})
