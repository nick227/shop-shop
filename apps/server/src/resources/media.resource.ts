import { defineResource } from '@packages/schemas/core'
import {
  MediaAssetResponseSchema,
  MediaAssetListResponseSchema,
  UpdateMediaSortInputSchema,
} from '@packages/schemas/dtos'
import { z } from 'zod'

// ========================================
// Media Resource Definition
// Note: Upload endpoint (/media/upload) remains custom due to multipart/form-data
// This resource covers: list, read, delete, and sort update
// ========================================

// Query schema for filtering media
const MediaQuerySchema = z.object({
  storeId: z.string().uuid().optional().describe('Filter by store ID'),
  itemId: z.string().uuid().optional().describe('Filter by item ID'),
})

export const mediaResource = defineResource({
  name: 'media',
  model: 'MediaAsset',
  path: '/media',
  schemas: {
    // No create schema - upload is handled separately with multipart/form-data
    update: UpdateMediaSortInputSchema,
    response: MediaAssetResponseSchema,
    list: MediaAssetListResponseSchema,
    query: MediaQuerySchema,
  },
  access: {
    // No create here - upload route has its own auth
    read: [],  // Public - media URLs are public
    update: ['USER', 'VENDOR', 'ADMIN'],  // Only owners can update sort order
    delete: ['USER', 'VENDOR', 'ADMIN'],  // Only owners can delete
    list: [],  // Public - anyone can list media for a store/item
  },
  ownership: {
    enabled: true,
    relationPath: 'store.ownerUserId',  // Check ownership via store or item
  },
  operations: ['read', 'update', 'delete', 'list'],  // No create - handled by upload route
  customHooks: {
    beforeDelete: async (id, context) => {
      // Ownership verification is handled in media.service.ts deleteMedia function
      // Just pass through
    },
    beforeUpdate: async (id, data, context) => {
      // Ownership verification is handled in media.service.ts updateMediaSort function
      // Just pass through
      return data
    },
  },
})

