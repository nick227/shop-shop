/**
 * The checkout pricing function: shopper service fee is a policy on the subtotal; the vendor commission
 * is the vendor's cost and never part of the shopper's total; server-supplied delivery and tax win.
 */
import { describe, it, expect } from 'vitest'
import { computeCheckoutTotals } from '@packages/domain'
import { CHECKOUT_TOTALS_CONFIG, SHOPPER_SERVICE_FEE_PERCENT } from '../commerce/pricingPolicy.js'

const cart = (commissionRate: number | null) =>
  ({
    items: [
      { unitPrice: '10.00', quantity: 2 },
      { unitPrice: '5.00', quantity: 1 },
    ],
    store: { id: 's1', commissionRate, deliveryCharge: '4.00', latitude: null, longitude: null },
  }) as unknown as Parameters<typeof computeCheckoutTotals>[0]

describe('checkout totals', () => {
  it('launches with no shopper service fee', () => {
    expect(SHOPPER_SERVICE_FEE_PERCENT).toBe(0)
    const totals = computeCheckoutTotals(cart(null), 'PICKUP', 0, CHECKOUT_TOTALS_CONFIG, { tax: 2 })
    expect(totals.serviceFeeAmount.toNumber()).toBe(0)
    expect(totals.total.toNumber()).toBe(27)
  })

  it('applies a service fee policy to the subtotal only, with a floor and a cap', () => {
    const policy = { ...CHECKOUT_TOTALS_CONFIG, shopperServiceFeePercent: 10, shopperServiceFeeMinimum: 1, shopperServiceFeeMaximum: 2 }
    // 10% of 25 = 2.50, capped at 2.00; tip and tax don't count toward it.
    const capped = computeCheckoutTotals(cart(null), 'DELIVERY', 5, policy, { tax: 2, deliveryFee: 6 })
    expect(capped.serviceFeeAmount.toNumber()).toBe(2)
    expect(capped.fees.toNumber()).toBe(6)
    expect(capped.total.toNumber()).toBe(40)
  })

  it('takes the commission from the vendor, at the store’s rate or the platform default', () => {
    const own = computeCheckoutTotals(cart(20), 'PICKUP', 0, CHECKOUT_TOTALS_CONFIG, { tax: 2 })
    expect(own.vendorCommissionAmount.toNumber()).toBe(5)
    expect(own.total.toNumber()).toBe(27)
    expect(own.netToVendor.toNumber()).toBe(22)
    const fallback = computeCheckoutTotals(cart(null), 'PICKUP', 0, CHECKOUT_TOTALS_CONFIG, { tax: 2 })
    expect(fallback.vendorCommissionPercent.toNumber()).toBe(CHECKOUT_TOTALS_CONFIG.platformFeePercent)
  })

  it('uses the store’s delivery charge when the server supplies no fee', () => {
    const totals = computeCheckoutTotals(cart(null), 'DELIVERY', 0, CHECKOUT_TOTALS_CONFIG, { tax: 0 })
    expect(totals.fees.toNumber()).toBe(4)
  })
})
