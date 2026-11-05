/**
 * One order's money, end to end: the quote the shopper sees, the order that's created, what the platform
 * keeps (Stripe application fee), and what the vendor is paid. Tips are paid to the vendor exactly once.
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

import { computePayoutBreakdownCents, platformApplicationFee, prisma, snapshotOrderForPayout } from '@packages/db'
import { completeCheckout, createCheckoutSession, quoteCheckout } from './checkout.service.js'
import { createAuthenticatedUser, createTestStore, createTestItem, cleanupTestData } from '../__tests__/helpers.js'

describe('order money flow', () => {
  let userId: string
  let storeId: string
  let itemId: string

  beforeEach(async () => {
    userId = (await createAuthenticatedUser('USER')).id
    storeId = (await createTestStore(userId, { isPublished: true })).id
    await prisma.store.update({ where: { id: storeId }, data: { commissionRate: 10 } })
    itemId = (await createTestItem(storeId, { title: 'Brisket plate', price: '20.00' })).id
  })

  afterEach(async () => {
    await cleanupTestData()
    await prisma.user.deleteMany({ where: { id: userId } })
  })

  it('pays the vendor the total minus platform fees, with the tip counted once', async () => {
    const lines = [{ itemId, quantity: 2 }]
    const quote = await quoteCheckout({ items: lines, deliveryType: 'PICKUP', tipAmount: 5 })
    // 40.00 subtotal + 3.30 tax + 5.00 tip; no shopper service fee at launch.
    expect(quote).toMatchObject({ subtotal: 40, tax: 3.3, tip: 5, serviceFee: 0, total: 48.3 })

    const session = await createCheckoutSession(userId, {
      items: lines,
      deliveryType: 'PICKUP',
      deliveryMode: 'PICKUP',
      paymentMethod: { type: 'CASH', token: 'cod_test' },
      tipAmount: 5,
    })
    const done = await completeCheckout(userId, {
      sessionId: session.sessionId,
      paymentMethod: { type: 'CASH', token: 'cod_test' },
      tipAmount: 5,
      paymentRail: 'COD',
    })
    const order = await prisma.order.findUniqueOrThrow({ where: { id: (done as { order: { id: string } }).order.id } })

    // The order is what the shopper was quoted.
    expect(Number(order.total)).toBe(quote.total)
    // The vendor's 10% commission on the 40.00 subtotal; never in the shopper's total.
    expect(Number(order.vendorCommissionAmount)).toBe(4)
    // The platform keeps service fee + commission; the vendor keeps the rest, tip included.
    expect(platformApplicationFee(order).toNumber()).toBe(4)
    expect(Number(order.netToVendor)).toBe(44.3)

    const payout = computePayoutBreakdownCents({ orders: [snapshotOrderForPayout(order)] })
    expect(payout.tipsCents).toBe(500)
    expect(payout.platformFeesCents).toBe(400)
    // Paid once: 48.30 charged - 4.00 platform = 44.30. (Before the fix this was 49.30.)
    expect(payout.netPayoutCents).toBe(4430)
    expect(payout.netPayoutCents + payout.platformFeesCents).toBe(Math.round(quote.total * 100))
  })
})
