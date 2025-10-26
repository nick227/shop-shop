/**
 * Type Helpers & Utilities
 * Runtime helper functions for working with API types
 */

import type { 
  StoreResponse,
  ListCarts200ResponseDataInner,
  ListCarts200ResponseDataInnerItemsInner
} from '@packages/sdk'
// import type { OrderItem, AddressSnapshot } from '@/types/extensions'

// Cart with totals interface - extends SDK cart with computed fields
export interface CartWithTotals extends ListCarts200ResponseDataInner {
  // Computed fields for frontend display
  itemCount: number
  subtotal: number
  totalWeight?: number
  tax: number
  deliveryFee: number
  fees: number  // Total fees
  total: number
}

// Cart item data - extends SDK cart item with computed fields
export interface CartItemData extends ListCarts200ResponseDataInnerItemsInner {
  // Additional computed fields for frontend
  item?: import('@packages/sdk').ListItems200ResponseDataInner
  currentItem?: import('@packages/sdk').ListItems200ResponseDataInner
  weight?: number // Weight in pounds/kilograms
}

// ============================================
// Extended Types with Calculated Fields
// ============================================

// CartWithTotals is now in backend-types.ts

export interface StoreFees {
  deliveryFee?: number
  serviceFeePercent?: number
}

// ============================================
// Helper Functions
// ============================================

/**
 * Calculate cart totals including tax and fees - OPTIMIZED VERSION
 * Single-pass processing for better performance
 */
export function calculateCartTotals(
  cart: CartWithTotals,
  storeFees?: StoreFees
): CartWithTotals {
  // Single-pass calculation for all values
  let subtotal = 0
  let itemCount = 0
  let totalWeight = 0
  
  for (let i = 0; i < cart.items.length; i++) {
    const item = cart.items[i]
    if (!item) continue
    
    const price = typeof item.unitPrice === 'string' 
      ? Number.parseFloat(item.unitPrice) 
      : item.unitPrice
    
    subtotal += price * item.quantity
    itemCount += item.quantity
    
    // Calculate weight if available
    if (item.weight) {
      totalWeight += item.weight * item.quantity
    }
  }

  const taxRate = 0.1 // 10% tax
  const tax = subtotal * taxRate

  const deliveryFee = storeFees?.["deliveryFee"] || 5.99;
  const serviceFee = storeFees?.serviceFeePercent
    ? subtotal * (storeFees.serviceFeePercent / 100)
    : 0;

  const fees = deliveryFee + serviceFee
  const total = subtotal + tax + fees

  return {
    ...cart,
    subtotal,
    tax,
    fees,
    total,
    itemCount,
    totalWeight,
  }
}

/**
 * Parse store with typed JSON fields
 */
export function parseStore(store: StoreResponse): StoreResponse & {
  fees: Record<string, unknown> | null
  hours: Record<string, unknown> | null
  address: Record<string, unknown> | null
} {
  return {
    ...store,
    fees: (store as any).feesJson || null,
    hours: (store as any).hoursJson || null,
    address: (store as any).addressJson || null,
  }
}

/**
 * Format price from string/number to number
 */
export function parsePrice(price: string | number): number {
  return typeof price === 'string' ? Number.parseFloat(price) : price
}

