/**
 * Store Mutations
 * 
 * All write operations related to stores.
 * Feature-agnostic mutation functions.
 */

import { api } from '../client-adapter'
import type { CreateStoreInput, UpdateStoreInput, StoreResponse } from '@packages/sdk'

/**
 * Create store
 */
export async function createStore(input: CreateStoreInput): Promise<StoreResponse> {
  const response = await api.stores.createStore(input)
  return response.data
}

/**
 * Update store
 */
export async function updateStore(id: string, input: UpdateStoreInput): Promise<StoreResponse> {
  const response = await api.stores.updateStore(id, input)
  return response.data
}

/**
 * Delete store
 */
export async function deleteStore(id: string): Promise<void> {
  await api.stores.deleteStore(id)
}
