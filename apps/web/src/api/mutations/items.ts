/**
 * Item Mutations
 * 
 * All write operations related to items/products.
 * Feature-agnostic mutation functions.
 */

import { api } from '../client-adapter'
import type { CreateItemInput, UpdateItemInput, ItemResponse } from '@packages/sdk'

/**
 * Create item
 */
export async function createItem(input: CreateItemInput): Promise<ItemResponse> {
  const response = await api.items.createItem(input)
  return response.data
}

/**
 * Update item
 */
export async function updateItem(id: string, input: UpdateItemInput): Promise<ItemResponse> {
  const response = await api.items.updateItem(id, input)
  return response.data
}

/**
 * Delete item
 */
export async function deleteItem(id: string): Promise<void> {
  await api.items.deleteItem(id)
}
