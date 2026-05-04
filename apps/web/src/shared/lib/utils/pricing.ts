/**
 * Pricing utilities - re-export from shared module
 * 
 * 🚫 DEPRECATED: This file re-exports from packages/shared/pricing.ts
 * Use @packages/shared/pricing.ts directly for new code
 * 
 * This file exists for backward compatibility during migration
 */

export {
  TAX_RATE,
  DEFAULT_DELIVERY_FEE,
  FREE_DELIVERY_THRESHOLD,
  SERVICE_FEE_RATE,
  TIP_PERCENTAGES,
  DEFAULT_TIP_PERCENTAGE,
  calculateTax,
  calculateDeliveryFee,
  calculateServiceFee,
  calculateTip,
  calculateOrderTotal,
  calculateOrderPricing,
  getPricingBreakdown,
} from '@packages/shared/pricing'
export type { PricingLineItem } from '@packages/shared/pricing'
