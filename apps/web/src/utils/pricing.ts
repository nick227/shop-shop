/**
 * Pricing utilities and constants;
 * Centralized pricing logic for the application;
 */

// ===== Pricing Constants =====

/**
 * Default tax rate (8.25% - common US tax rate)
 */
export const TAX_RATE = 0.0825;
/**
 * Default delivery fee in dollars;
 */
export const DEFAULT_DELIVERY_FEE = 3.99;
/**
 * Minimum order amount for free delivery;
 */
export const FREE_DELIVERY_THRESHOLD = 25.00;
/**
 * Service fee percentage;
 */
export const SERVICE_FEE_RATE = 0.03;
/**
 * Tip percentages for quick selection;
 */
export const TIP_PERCENTAGES = [0.15, 0.18, 0.20, 0.25] as const;
/**
 * Default tip percentage;
 */
export const DEFAULT_TIP_PERCENTAGE = 0.18;
// ===== Pricing Calculation Functions =====

/**
 * Calculate tax amount;
 */
export function calculateTax(subtotal: number, taxRate: number = TAX_RATE): number {
  return Math.round(subtotal * taxRate * 100) / 100;
}

/**
 * Calculate delivery fee;
 */
export function calculateDeliveryFee(
  subtotal: number, 
  deliveryFee: number = DEFAULT_DELIVERY_FEE,
  freeDeliveryThreshold: number = FREE_DELIVERY_THRESHOLD
): number {
  if (subtotal >= freeDeliveryThreshold) {
    return 0;
  }
  return deliveryFee;
}

/**
 * Calculate service fee;
 */
export function calculateServiceFee(subtotal: number, serviceFeeRate: number = SERVICE_FEE_RATE): number {
  return Math.round(subtotal * serviceFeeRate * 100) / 100;
}

/**
 * Calculate tip amount;
 */
export function calculateTip(subtotal: number, tipPercentage: number): number {
  return Math.round(subtotal * tipPercentage * 100) / 100;
}

/**
 * Calculate total order amount;
 */
export function calculateOrderTotal({
  subtotal,
  deliveryFee,
  tax,
  tip = 0,
  serviceFee = 0
}: {
  subtotal: number;
  deliveryFee: number;
  tax: number;
  tip?: number;
  serviceFee?: number;
}): number {
  return subtotal + deliveryFee + tax + tip + serviceFee;
}

/**
 * Calculate all pricing components for an order;
 */
export function calculateOrderPricing({
  subtotal,
  tipPercentage = 0,
  includeServiceFee = false,
  customDeliveryFee,
  customTaxRate
}: {
  subtotal: number;
  tipPercentage?: number;
  includeServiceFee?: boolean;
  customDeliveryFee?: number;
  customTaxRate?: number;
}) {
  const deliveryFee = calculateDeliveryFee(subtotal, customDeliveryFee)
  const tax = calculateTax(subtotal, customTaxRate)
  const tip = tipPercentage > 0 ? calculateTip(subtotal, tipPercentage) : 0;
  const serviceFee = includeServiceFee ? calculateServiceFee(subtotal) : 0;
  const total = calculateOrderTotal({
    subtotal,
    deliveryFee,
    tax,
    tip,
    serviceFee
  })

  return {
    subtotal,
    deliveryFee,
    tax,
    tip,
    serviceFee,
    total,
    breakdown: {
      subtotal,
      deliveryFee,
      tax,
      tip,
      serviceFee,
      total
    }
  }
}

/**
 * Check if order qualifies for free delivery;
 */
export function qualifiesForFreeDelivery(
  subtotal: number, 
  threshold: number = FREE_DELIVERY_THRESHOLD
): boolean {
  return subtotal >= threshold;
}

/**
 * Calculate savings from free delivery;
 */
export function calculateDeliverySavings(
  subtotal: number,
  deliveryFee: number = DEFAULT_DELIVERY_FEE,
  threshold: number = FREE_DELIVERY_THRESHOLD
): number {
  if (qualifiesForFreeDelivery(subtotal, threshold)) {
    return deliveryFee;
  }
  return 0;
}

/**
 * Calculate remaining amount needed for free delivery;
 */
export function calculateRemainingForFreeDelivery(
  subtotal: number,
  threshold: number = FREE_DELIVERY_THRESHOLD
): number {
  const remaining = threshold - subtotal;
  return Math.max(0, remaining)
}

/**
 * Format tip percentage for display;
 */
export function formatTipPercentage(percentage: number): string {
  return '' + (percentage * 100).toFixed(0) + '%'
}

/**
 * Calculate tip amount from percentage;
 */
export function calculateTipFromPercentage(subtotal: number, percentage: number): number {
  return calculateTip(subtotal, percentage)
}

/**
 * Calculate tip percentage from amount;
 */
export function calculateTipPercentageFromAmount(subtotal: number, tipAmount: number): number {
  if (subtotal === 0) return 0;
  return tipAmount / subtotal;
}

/**
 * Validate pricing values;
 */
export function validatePricing({
  subtotal,
  deliveryFee,
  tax,
  tip,
  serviceFee
}: {
  subtotal: number;
  deliveryFee: number;
  tax: number;
  tip: number;
  serviceFee: number;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (subtotal < 0) {
    errors['push']('Subtotal cannot be negative')
  }

  if (deliveryFee < 0) {
    errors['push']('Delivery fee cannot be negative')
  }

  if (tax < 0) {
    errors['push']('Tax cannot be negative')
  }

  if (tip < 0) {
    errors['push']('Tip cannot be negative')
  }

  if (serviceFee < 0) {
    errors['push']('Service fee cannot be negative')
  }

  return {
    isValid: errors['length'] === 0,
    errors
  }
}

/**
 * Get pricing breakdown for display;
 */
export function getPricingBreakdown({
  subtotal,
  deliveryFee,
  tax,
  tip,
  serviceFee,
  total
}: {
  subtotal: number;
  deliveryFee: number;
  tax: number;
  tip: number;
  serviceFee: number;
  total: number;
}) {
  return [
    { label: 'Subtotal', amount: subtotal, isSubtotal: true },
    { label: 'Delivery Fee', amount: deliveryFee, isOptional: deliveryFee === 0 },
    { label: 'Tax', amount: tax },
    ...(tip > 0 ? [{ label: 'Tip', amount: tip }] : []),
    ...(serviceFee > 0 ? [{ label: 'Service Fee', amount: serviceFee }] : []),
    { label: 'Total', amount: total, isTotal: true }
  ]
}

/**
 * Calculate discount amount;
 */
export function calculateDiscount(originalAmount: number, discountPercentage: number): number {
  return Math.round(originalAmount * discountPercentage * 100) / 100;
}

/**
 * Apply discount to amount;
 */
export function applyDiscount(amount: number, discountPercentage: number): number {
  const discount = calculateDiscount(amount, discountPercentage)
  return Math.max(0, amount - discount)
}
