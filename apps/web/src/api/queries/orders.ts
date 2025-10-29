/**
 * Order Queries
 * 
 * All read operations related to orders.
 * Feature-agnostic query functions.
 */

import { api } from '../client-adapter'
import type { OrderResponse } from '@packages/sdk'

/**
 * Get all orders
 */
export async function getAllOrders(): Promise<OrderResponse[]> {
  const response = await api.orders.getAllOrders()
  return response.data || []
}

/**
 * Get order by ID
 */
export async function getOrderById(id: string): Promise<OrderResponse | null> {
  try {
    const response = await api.orders.getOrderById(id)
    return response.data || null
  } catch (error) {
    if (error instanceof Error && error.message.includes('404')) {
      return null
    }
    throw error
  }
}

/**
 * Get orders by user ID
 */
export async function getOrdersByUserId(userId: string): Promise<OrderResponse[]> {
  const response = await api.orders.getOrdersByUserId(userId)
  return response.data || []
}

/**
 * Get orders by store ID
 */
export async function getOrdersByStoreId(storeId: string): Promise<OrderResponse[]> {
  const response = await api.orders.getOrdersByStoreId(storeId)
  return response.data || []
}
