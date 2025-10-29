/**
 * Bundle Queries
 * 
 * All read operations related to bundles.
 * Feature-agnostic query functions.
 */

import { api } from '../client-adapter'
import type { Bundle } from '@packages/sdk'

/**
 * Get all bundles
 */
export async function getAllBundles(): Promise<Bundle[]> {
  const response = await api.bundles.getAllBundles()
  return response.data || []
}

/**
 * Get bundle by ID
 */
export async function getBundleById(id: string): Promise<Bundle | null> {
  try {
    const response = await api.bundles.getBundleById(id)
    return response.data || null
  } catch (error) {
    if (error instanceof Error && error.message.includes('404')) {
      return null
    }
    throw error
  }
}

/**
 * Get bundles by store ID
 */
export async function getBundlesByStoreId(storeId: string): Promise<Bundle[]> {
  const response = await api.bundles.getBundlesByStoreId(storeId)
  return response.data || []
}
