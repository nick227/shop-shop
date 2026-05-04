/**
 * Shared pricing utilities and constants
 * Centralized pricing logic for both client and server
 */

// ===== Pricing Constants =====

/**
 * Default tax rate (8.25% - common US tax rate)
 */
export const TAX_RATE = 0.0825;

/**
 * Default delivery fee in dollars
 */
export const DEFAULT_DELIVERY_FEE = 3.99;

/**
 * Minimum order amount for free delivery
 */
export const FREE_DELIVERY_THRESHOLD = 25;

/**
 * Service fee percentage
 */
export const SERVICE_FEE_RATE = 0.03;

/**
 * Tip percentages for quick selection
 */
export const TIP_PERCENTAGES = [0.15, 0.18, 0.2, 0.25] as const;

/**
 * Default tip percentage
 */
export const DEFAULT_TIP_PERCENTAGE = 0.18;

// ===== Pricing Calculation Functions =====

/**
 * Calculate tax amount
 */
export function calculateTax(subtotal: number, taxRate: number = TAX_RATE): number {
  return Math.round(subtotal * taxRate * 100) / 100;
}

/**
 * Calculate delivery fee
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
 * Calculate service fee
 */
export function calculateServiceFee(subtotal: number, serviceFeeRate: number = SERVICE_FEE_RATE): number {
  return Math.round(subtotal * serviceFeeRate * 100) / 100;
}

/**
 * Calculate tip amount
 */
export function calculateTip(subtotal: number, tipPercentage: number = DEFAULT_TIP_PERCENTAGE): number {
  return Math.round(subtotal * tipPercentage * 100) / 100;
}

/**
 * Calculate order total with all fees
 */
export function calculateOrderTotal(params: {
  subtotal: number;
  deliveryFee?: number;
  tax?: number;
  tip?: number;
  serviceFee?: number;
}): number {
  const {
    subtotal,
    deliveryFee = DEFAULT_DELIVERY_FEE,
    tax = calculateTax(subtotal),
    tip = 0,
    serviceFee = calculateServiceFee(subtotal)
  } = params;

  return subtotal + deliveryFee + tax + tip + serviceFee;
}

/**
 * Calculate complete order pricing breakdown
 */
export function calculateOrderPricing(params: {
  subtotal: number;
  tipPercentage?: number;
  deliveryFee?: number;
  includeServiceFee?: boolean;
}): {
  subtotal: number;
  deliveryFee: number;
  tax: number;
  tip: number;
  serviceFee: number;
  total: number;
} {
  const {
    subtotal,
    tipPercentage = DEFAULT_TIP_PERCENTAGE,
    includeServiceFee = true
  } = params;
  
  const deliveryFee = calculateDeliveryFee(subtotal);

  const tax = calculateTax(subtotal);
  const tip = calculateTip(subtotal, tipPercentage);
  const serviceFee = includeServiceFee ? calculateServiceFee(subtotal) : 0;

  const total = calculateOrderTotal({
    subtotal,
    deliveryFee,
    tax,
    tip,
    serviceFee
  });

  return {
    subtotal,
    deliveryFee,
    tax,
    tip,
    serviceFee,
    total
  };
}
