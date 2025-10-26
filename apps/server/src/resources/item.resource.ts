import { defineResource } from '@packages/schemas/core'
import {
  CreateItemInputSchema,
  UpdateItemInputSchema,
  ItemResponseSchema,
  ItemListResponseSchema,
  ItemQuerySchema,
} from '@packages/schemas/dtos'

// ========================================
// Item Resource Definition
// ========================================

export const itemResource = defineResource({
  name: 'item',
  model: 'Item',
  path: '/items',
  schemas: {
    create: CreateItemInputSchema,
    update: UpdateItemInputSchema,
    response: ItemResponseSchema,
    list: ItemListResponseSchema,
    query: ItemQuerySchema,
  },
  access: {
    create: ['USER', 'VENDOR', 'ADMIN'],  // Open platform: any user can create items
    read: [],  // Public
    update: ['USER', 'VENDOR', 'ADMIN'],  // Any authenticated user can update their own items
    delete: ['USER', 'VENDOR', 'ADMIN'],  // Any authenticated user can delete their own items
    list: [],  // Public
  },
  ownership: {
    enabled: true,  // Enforce ownership: users can only modify items from their own stores
    relationPath: 'store.ownerUserId',  // Check via store
  },
  operations: ['create', 'read', 'update', 'delete', 'list'],
})

