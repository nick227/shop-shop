/**
 * Promotion Queries
 * 
 * All read operations related to promotions.
 * Feature-agnostic query functions.
 */

import { api } from '../client-adapter'
import type { PromotionResponse } from '@packages/sdk'

/**
 * Get all promotions
 */
export async function getAllPromotions(): Promise<PromotionResponse[]> {
  const response = await api.promotions.getAllPromotions()
  return response.data || []
}

/**
 * Get promotion by ID
 */
export async function getPromotionById(id: string): Promise<PromotionResponse | null> {
  try {
    const response = await api.promotions.getPromotionById(id)
    return response.data || null
  } catch (error) {
    if (error instanceof Error && error.message.includes('404')) {
      return null
    }
    throw error
  }
}

/**
 * Get promotions by store ID
 */
export async function getPromotionsByStoreId(storeId: string): Promise<PromotionResponse[]> {
  const response = await api.promotions.getPromotionsByStoreId(storeId)
  return response.data || []
}
