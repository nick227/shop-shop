/**
 * Store Queries
 * 
 * All read operations related to stores.
 * Feature-agnostic query functions.
 */

import { api } from '../client-adapter'
import type { StoreResponse } from '@packages/sdk'

/**
 * Get all stores
 */
export async function getAllStores(): Promise<StoreResponse[]> {
  const response = await api.stores.getAllStores()
  return response.data || []
}

/**
 * Get store by ID
 */
export async function getStoreById(id: string): Promise<StoreResponse | null> {
  try {
    const response = await api.stores.getStoreById(id)
    return response.data || null
  } catch (error) {
    if (error instanceof Error && error.message.includes('404')) {
      return null
    }
    throw error
  }
}

/**
 * Search stores by query
 */
export async function searchStores(query: string): Promise<StoreResponse[]> {
  const response = await api.stores.searchStores(query)
  return response.data || []
}

/**
 * Get stores by location
 */
export async function getStoresByLocation(
  latitude: number,
  longitude: number,
  radius?: number
): Promise<StoreResponse[]> {
  const response = await api.stores.getStoresByLocation(latitude, longitude, radius)
  return response.data || []
}
