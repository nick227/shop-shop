/**
 * Type Helpers & Utilities
 * Runtime helper functions for working with API types
 */

import type {
  StoreResponse,
  ListCarts200ResponseDataInner
} from '@packages/sdk'
// import type { OrderItem, AddressSnapshot } from '@/types/extensions'

// Cart with totals interface - extends SDK cart with computed fields
export interface CartWithTotals extends ListCarts200ResponseDataInner {
  id: string  // Add missing id field
  // Computed fields for frontend display
  itemCount: number
  subtotal: number
  totalWeight?: number
  tax: number
  deliveryFee: number
  fees: number  // Total fees
  total: number
  taxAmount?: number
}

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
  
  // Note: SDK cart.items is a string, not an array
  // This is a limitation of the current SDK
  // For now, we'll use default values
  if (typeof cart.items === 'string' && cart.items) {
    // Parse items from string if needed
    try {
      const items = JSON.parse(cart.items)
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (!item) continue
        
        const price = typeof item.unitPrice === 'string' 
          ? Number.parseFloat(item.unitPrice) 
          : item.unitPrice || 0
        
        subtotal += price * (item.quantity || 1)
        itemCount += item.quantity || 1
        
        // Calculate weight if available
        if (item.weight) {
          totalWeight += item.weight * (item.quantity || 1)
        }
      }
    } catch (error) {
      // If parsing fails, use default values
      console.warn('Failed to parse cart items:', error)
    }
  }

  const taxRate = 0.1 // 10% tax
  const tax = subtotal * taxRate

  const deliveryFee = storeFees?.deliveryFee || 5.99;
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
  fees: Record<string, unknown> | undefined
  hours: Record<string, unknown> | undefined
  address: Record<string, unknown> | undefined
} {
  return {
    ...store,
    fees: (store as any).feesJson || undefined,
    hours: (store as any).hoursJson || undefined,
    address: (store as any).addressJson || undefined,
  }
}

/**
 * Format price from string/number to number
 */
export function parsePrice(price: string | number): number {
  return typeof price === 'string' ? Number.parseFloat(price) : price
}

