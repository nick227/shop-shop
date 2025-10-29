/**
 * Promotion Mutations
 * 
 * All write operations related to promotions.
 * Feature-agnostic mutation functions.
 */

import { api } from '../client-adapter'
import type { CreatePromotionInput, UpdatePromotionInput, PromotionResponse } from '@packages/sdk'

/**
 * Create promotion
 */
export async function createPromotion(input: CreatePromotionInput): Promise<PromotionResponse> {
  const response = await api.promotions.createPromotion(input)
  return response.data
}

/**
 * Update promotion
 */
export async function updatePromotion(id: string, input: UpdatePromotionInput): Promise<PromotionResponse> {
  const response = await api.promotions.updatePromotion(id, input)
  return response.data
}

/**
 * Delete promotion
 */
export async function deletePromotion(id: string): Promise<void> {
  await api.promotions.deletePromotion(id)
}
