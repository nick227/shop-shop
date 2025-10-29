/**
 * Type Helpers & Utilities
 * Runtime helper functions for working with API types
 */

import type {
  StoreResponse,
  ListItems200ResponseDataInner
} from '@packages/sdk'
import type { CartWithTotals } from '../backend-types'

// Cart item data - extends SDK cart item with computed fields
// CartItemData - SDK doesn't have ListCarts200ResponseDataInnerItemsInner
export interface CartItemData { 
  id: string  // Add missing id field
  itemId: string  // Add missing itemId field
  unitPrice: string  // Add missing unitPrice field
  quantity: number  // Add missing quantity field
  titleSnapshot?: string  // Add missing titleSnapshot field
  notes?: string  // Add missing notes field
  // Additional computed fields for frontend
  item?: ListItems200ResponseDataInner
  currentItem?: ListItems200ResponseDataInner
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
  
  // Process cart items - they should be CartItemData[]
  if (Array.isArray(cart.items)) {
    for (const item of cart.items) {
      if (!item) continue
      
      const price = typeof item.unitPrice === 'string' 
        ? Number.parseFloat(item.unitPrice) 
        : Number(item.unitPrice) || 0
      
      const quantity = item.quantity ?? 1
      subtotal += price * quantity
      itemCount += quantity
    }
  }

  const taxRate = 0.1 // 10% tax
  const tax = subtotal * taxRate

  const deliveryFee = storeFees?.deliveryFee ?? 5.99
  const serviceFee = storeFees?.serviceFeePercent
    ? subtotal * (storeFees.serviceFeePercent / 100)
    : 0

  const fees = deliveryFee + serviceFee
  const total = subtotal + tax + fees

  return {
    ...cart,
    subtotal,
    tax,
    fees,
    total,
    itemCount,
  }
}

/**
 * Parse store with typed JSON fields
 */
export function parseStore(store: StoreResponse): StoreResponse & {
  fees: Record<string, unknown> | undefined
  hours: Record<string, unknown> | undefined
  address: Record<string, unknown> | undefined
} {
  const storeWithJson = store as StoreResponse & {
    feesJson?: string
    hoursJson?: string
    addressJson?: string
  }
  
  const parseJsonField = (jsonString: string | undefined): Record<string, unknown> | undefined => {
    if (!jsonString) return undefined
    try {
      return JSON.parse(jsonString) as Record<string, unknown>
    } catch {
      return undefined
    }
  }

  return {
    ...store,
    fees: parseJsonField(storeWithJson.feesJson),
    hours: parseJsonField(storeWithJson.hoursJson),
    address: parseJsonField(storeWithJson.addressJson),
  }
}

/**
 * Format price from string/number to number
 */
export function parsePrice(price: string | number): number {
  return typeof price === 'string' ? Number.parseFloat(price) : price
}

