import { defineResource } from '@packages/schemas/core'
import {
  CreatePostInputSchema,
  PostResponseSchema,
  PostListResponseSchema,
  PostQuerySchema,
} from '@packages/schemas/dtos'

// ========================================
// River (Social Feed) Resource Definition
// ========================================

export const riverResource = defineResource({
  name: 'post',
  model: 'Post',
  path: '/river/posts',
  schemas: {
    create: CreatePostInputSchema,
    update: CreatePostInputSchema, // Posts can be updated (edit content)
    response: PostResponseSchema,
    list: PostListResponseSchema,
    query: PostQuerySchema,
  },
  access: {
    create: ['USER', 'VENDOR', 'ADMIN'],
    read: [], // Public
    update: ['USER', 'VENDOR', 'ADMIN'],
    delete: ['USER', 'VENDOR', 'ADMIN'],
    list: [], // Public feed
  },
  ownership: {
    enabled: true,
    relationPath: 'userId', // Users can only update/delete their own posts
  },
  operations: ['create', 'read', 'update', 'delete', 'list'],
  customHooks: {
    beforeCreate: async (data, context) => {
      return {
        ...(data as Record<string, unknown>),
        userId: context!.userId,
      }
    },
    beforeList: async (params) => {
      // Filter out non-database fields from where clause
      const p = params as Record<string, unknown>
      const { where, ...otherParams } = p
      const filteredWhere = { ...(where as Record<string, unknown>) }
      
      // Remove query parameters that are not database fields
      delete filteredWhere.sortBy
      delete filteredWhere.hasMedia
      
      return {
        ...otherParams,
        where: filteredWhere,
      }
    },
    afterList: async (result) => {
      // Add store/user info to each post if needed
      const listResult = result as { data: Array<{
        id: string
        storeId: string
        [key: string]: unknown
      }> }
      
      // Future: Add joins for store names, user info, etc.
      
      return listResult
    },
  },
})

