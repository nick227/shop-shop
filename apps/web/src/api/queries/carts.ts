/**
 * Cart Queries
 * 
 * All read operations related to shopping carts.
 * Feature-agnostic query functions.
 */

import { api } from '../client-adapter'
import type { CartWithTotals } from '@packages/sdk'

/**
 * Get cart by ID
 */
export async function getCartById(id: string): Promise<CartWithTotals | null> {
  try {
    const response = await api.carts.getCartById(id)
    return response.data || null
  } catch (error) {
    if (error instanceof Error && error.message.includes('404')) {
      return null
    }
    throw error
  }
}

/**
 * Get user's active cart
 */
export async function getActiveCart(): Promise<CartWithTotals | null> {
  try {
    const response = await api.carts.getActiveCart()
    return response.data || null
  } catch (error) {
    if (error instanceof Error && error.message.includes('404')) {
      return null
    }
    throw error
  }
}
