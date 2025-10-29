/**
 * Order Mutations
 * 
 * All write operations related to orders.
 * Feature-agnostic mutation functions.
 */

import { api } from '../client-adapter'
import type { CreateOrderInput, UpdateOrderInput, OrderResponse } from '@packages/sdk'

/**
 * Create order
 */
export async function createOrder(input: CreateOrderInput): Promise<OrderResponse> {
  const response = await api.orders.createOrder(input)
  return response.data
}

/**
 * Update order
 */
export async function updateOrder(id: string, input: UpdateOrderInput): Promise<OrderResponse> {
  const response = await api.orders.updateOrder(id, input)
  return response.data
}

/**
 * Cancel order
 */
export async function cancelOrder(id: string): Promise<OrderResponse> {
  const response = await api.orders.cancelOrder(id)
  return response.data
}
