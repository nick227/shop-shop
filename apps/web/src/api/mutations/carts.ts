/**
 * Cart Mutations
 * 
 * All write operations related to shopping carts.
 * Feature-agnostic mutation functions.
 */

import { api } from '../client-adapter'
import type { AddCartItemInput, UpdateCartItemInput, CartWithTotals } from '@packages/sdk'

/**
 * Add item to cart
 */
export async function addItemToCart(input: AddCartItemInput): Promise<CartWithTotals> {
  const response = await api.carts.addItemToCart(input)
  return response.data
}

/**
 * Update cart item
 */
export async function updateCartItem(cartId: string, itemId: string, input: UpdateCartItemInput): Promise<CartWithTotals> {
  const response = await api.carts.updateCartItem(cartId, itemId, input)
  return response.data
}

/**
 * Remove item from cart
 */
export async function removeItemFromCart(cartId: string, itemId: string): Promise<CartWithTotals> {
  const response = await api.carts.removeItemFromCart(cartId, itemId)
  return response.data
}

/**
 * Clear cart
 */
export async function clearCart(cartId: string): Promise<CartWithTotals> {
  const response = await api.carts.clearCart(cartId)
  return response.data
}
