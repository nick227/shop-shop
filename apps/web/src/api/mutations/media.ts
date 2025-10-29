/**
 * Media Mutations
 * 
 * All write operations related to media.
 * Feature-agnostic mutation functions.
 */

import { api } from '../client-adapter'
import type { CreateMediaInput, MediaResponse } from '@packages/sdk'

/**
 * Upload media
 */
export async function uploadMedia(input: CreateMediaInput): Promise<MediaResponse> {
  const response = await api.media.uploadMedia(input)
  return response.data
}

/**
 * Delete media
 */
export async function deleteMedia(id: string): Promise<void> {
  await api.media.deleteMedia(id)
}
