/**
 * Item Queries
 * 
 * All read operations related to items/products.
 * Feature-agnostic query functions.
 */

import { api } from '../client-adapter'
import type { ItemResponse } from '@packages/sdk'

/**
 * Get all items
 */
export async function getAllItems(): Promise<ItemResponse[]> {
  const response = await api.items.getAllItems()
  return response.data || []
}

/**
 * Get item by ID
 */
export async function getItemById(id: string): Promise<ItemResponse | null> {
  try {
    const response = await api.items.getItemById(id)
    return response.data || null
  } catch (error) {
    if (error instanceof Error && error.message.includes('404')) {
      return null
    }
    throw error
  }
}

/**
 * Get items by store ID
 */
export async function getItemsByStoreId(storeId: string): Promise<ItemResponse[]> {
  const response = await api.items.getItemsByStoreId(storeId)
  return response.data || []
}

/**
 * Search items by query
 */
export async function searchItems(query: string): Promise<ItemResponse[]> {
  const response = await api.items.searchItems(query)
  return response.data || []
}
