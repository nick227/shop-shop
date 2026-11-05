/**
 * Shoppers see the totals checkout charges: quotes come from the same pricing code as orders, prices come
 * from the database (never the client), and bundles check out at their resolved price.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

vi.mock('../config/stripeConnectUrls.js', () => ({
  resolveStripeConnectUrls: vi.fn(() => ({ returnUrl: 'http://x/success', refreshUrl: 'http://x/refresh' })),
  isCodPaymentsEnabled: vi.fn(() => true),
}))
vi.mock('@packages/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@packages/db')>()
  return { ...actual, processOrderPayment: vi.fn(), publishOrderCreated: vi.fn(async () => undefined) }
})

import { prisma } from '@packages/db'
import { completeCheckout, createCheckoutSession, quoteCheckout } from './checkout.service.js'
import { createAuthenticatedUser, createTestStore, createTestItem, cleanupTestData } from '../__tests__/helpers.js'

describe('checkout quote', () => {
  let userId: string
  let storeId: string
  let taco: string
  let soda: string
  let bundleId: string

  beforeEach(async () => {
    userId = (await createAuthenticatedUser('USER')).id
    storeId = (await createTestStore(userId, { isPublished: true })).id
    await prisma.store.update({ where: { id: storeId }, data: { deliveryCharge: 2.5, commissionRate: null } })
    taco = (await createTestItem(storeId, { title: 'Taco', price: '4.00' })).id
    soda = (await createTestItem(storeId, { title: 'Soda', price: '2.00' })).id
    bundleId = (
      await prisma.bundle.create({
        data: {
          storeId,
          name: 'Taco combo',
          items: { create: [{ itemId: taco, quantity: 2, sortIndex: 0 }, { itemId: soda, sortIndex: 1 }] },
          pricing: { create: { pricingType: 'FIXED_PRICE', fixedPrice: 8 } },
        },
      })
    ).id
  })

  afterEach(async () => {
    await cleanupTestData()
    await prisma.user.deleteMany({ where: { id: userId } })
  })

  it('prices lines from the database and adds the store’s own delivery fee, tax and service fee', async () => {
    const quote = await quoteCheckout({
      items: [{ itemId: taco, quantity: 2 }, { bundleId, quantity: 1 }],
      deliveryType: 'DELIVERY',
      tipAmount: 3,
    })
    // 2 × 4.00 + 8.00 bundle
    expect(quote.subtotal).toBe(16)
    expect(quote.deliveryFee).toBe(2.5)
    expect(quote.tax).toBe(1.32)
    expect(quote.tip).toBe(3)
    // No shopper service fee at launch; the vendor's commission never reaches the shopper's total.
    expect(quote.serviceFee).toBe(0)
    expect(quote.total).toBe(22.82)
    expect(quote.lines).toEqual([
      { itemId: taco, bundleId: null, title: 'Taco', quantity: 2, unitPrice: 4 },
      { itemId: null, bundleId, title: 'Taco combo', quantity: 1, unitPrice: 8 },
    ])
  })

  it('uses the store’s own commission rate, still without charging the shopper for it', async () => {
    await prisma.store.update({ where: { id: storeId }, data: { commissionRate: 12.5 } })
    const lines = [{ itemId: taco, quantity: 2 }]
    const quote = await quoteCheckout({ items: lines, deliveryType: 'PICKUP' })
    const session = await createCheckoutSession(userId, {
      items: lines,
      deliveryType: 'PICKUP',
      deliveryMode: 'PICKUP',
      paymentMethod: { type: 'CASH', token: 'cod_test' },
    })
    const done = await completeCheckout(userId, { sessionId: session.sessionId, paymentMethod: { type: 'CASH', token: 'cod_test' }, tipAmount: 0, paymentRail: 'COD' })
    const order = await prisma.order.findUniqueOrThrow({ where: { id: (done as { order: { id: string } }).order.id } })
    expect(quote.total).toBe(8.66) // 8.00 + 0.66 tax; no commission in it
    expect(Number(order.vendorCommissionPercent)).toBe(12.5)
    expect(Number(order.vendorCommissionAmount)).toBe(1)
    expect(Number(order.netToVendor)).toBe(7.66)
  })

  it('charges no delivery fee for pickup', async () => {
    const quote = await quoteCheckout({ items: [{ itemId: taco, quantity: 1 }], deliveryType: 'PICKUP' })
    expect(quote.deliveryFee).toBe(0)
  })

  it('matches what the order is created with, bundles included', async () => {
    const lines = [{ itemId: soda, quantity: 1 }, { bundleId, quantity: 1 }]
    const quote = await quoteCheckout({ items: lines, deliveryType: 'PICKUP' })
    const session = await createCheckoutSession(userId, {
      items: lines,
      deliveryType: 'PICKUP',
      deliveryMode: 'PICKUP',
      paymentMethod: { type: 'CASH', token: 'cod_test' },
    })
    expect(session.total).toBe(quote.total)
    const done = await completeCheckout(userId, {
      sessionId: session.sessionId,
      paymentMethod: { type: 'CASH', token: 'cod_test' },
      tipAmount: 0,
      paymentRail: 'COD',
    })
    const orderId = (done as { order: { id: string } }).order.id
    const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId }, include: { items: true } })
    expect(Number(order.total)).toBe(quote.total)
    // Subtotal 2 + 8 = 10; the platform default commission (3%) comes out of the vendor's share.
    expect(Number(order.serviceFeeAmount)).toBe(0)
    expect(Number(order.vendorCommissionPercent)).toBe(3)
    expect(Number(order.vendorCommissionAmount)).toBe(0.3)
    expect(Number(order.netToVendor)).toBe(Number((quote.total - 0.3).toFixed(2)))
    expect(order.items.map((line) => ({ bundleId: line.bundleId, unitPrice: Number(line.unitPrice) }))).toEqual(
      expect.arrayContaining([
        { bundleId, unitPrice: 8 },
        { bundleId: null, unitPrice: 2 },
      ]),
    )
  })

  it('refuses unavailable lines, other stores’ items together, and bad quantities', async () => {
    await prisma.item.update({ where: { id: soda }, data: { isSoldOut: true } })
    await expect(quoteCheckout({ items: [{ bundleId, quantity: 1 }], deliveryType: 'PICKUP' })).rejects.toThrow(/not available/)
    const otherStore = (await createTestStore(userId, { isPublished: true })).id
    const elsewhere = (await createTestItem(otherStore, { title: 'Elsewhere' })).id
    await expect(
      quoteCheckout({ items: [{ itemId: taco, quantity: 1 }, { itemId: elsewhere, quantity: 1 }], deliveryType: 'PICKUP' }),
    ).rejects.toThrow(/same store/)
    await expect(quoteCheckout({ items: [{ itemId: taco, quantity: 0 }], deliveryType: 'PICKUP' })).rejects.toThrow(/quantity/)
  })
})
