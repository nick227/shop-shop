/**
 * Platform pricing policy: the one place checkout and order creation read fees from.
 *
 * - The shopper service fee is a platform policy on the subtotal, shown to the shopper. 0% at launch.
 * - The vendor commission is the vendor's cost: the store's own `commissionRate`, or the platform default
 *   below. It comes out of the vendor's share and is never added to the shopper's total.
 * - The Stripe application fee is what the platform keeps: service fee + commission.
 *
 * Overridable per environment: SHOPPER_SERVICE_FEE_PERCENT, DEFAULT_VENDOR_COMMISSION_PERCENT.
 */
import type { CheckoutTotalsConfig } from '@packages/domain'

function percentFromEnv(name: string, fallback: number): number {
  const raw = process.env[name]
  if (raw === undefined || raw.trim() === '') return fallback
  const value = Number.parseFloat(raw)
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    throw new Error(`${name} must be a percent between 0 and 100 (got "${raw}")`)
  }
  return value
}

/** Sales tax rate used until the tax provider lands (see apps/server/src/commerce, tax work in progress). */
export const INTERIM_TAX_RATE = 0.0825
export const DEFAULT_DELIVERY_FEE = 3.99

export const SHOPPER_SERVICE_FEE_PERCENT = percentFromEnv('SHOPPER_SERVICE_FEE_PERCENT', 0)
export const DEFAULT_VENDOR_COMMISSION_PERCENT = percentFromEnv('DEFAULT_VENDOR_COMMISSION_PERCENT', 3)

export const CHECKOUT_TOTALS_CONFIG: CheckoutTotalsConfig = {
  taxRate: INTERIM_TAX_RATE,
  defaultDeliveryFee: DEFAULT_DELIVERY_FEE,
  platformFeePercent: DEFAULT_VENDOR_COMMISSION_PERCENT,
  shopperServiceFeePercent: SHOPPER_SERVICE_FEE_PERCENT,
}
