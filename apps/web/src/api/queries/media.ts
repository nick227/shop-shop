/**
 * Media Queries
 * 
 * All read operations related to media.
 * Feature-agnostic query functions.
 */

import { api } from '../client-adapter'
import type { MediaResponse } from '@packages/sdk'

/**
 * Get media by ID
 */
export async function getMediaById(id: string): Promise<MediaResponse | null> {
  try {
    const response = await api.media.getMediaById(id)
    return response.data || null
  } catch (error) {
    if (error instanceof Error && error.message.includes('404')) {
      return null
    }
    throw error
  }
}

/**
 * Get media by store ID
 */
export async function getMediaByStoreId(storeId: string): Promise<MediaResponse[]> {
  const response = await api.media.getMediaByStoreId(storeId)
  return response.data || []
}
