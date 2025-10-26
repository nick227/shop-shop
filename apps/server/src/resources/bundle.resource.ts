import { defineResource } from '@packages/schemas/core'
import {
  CreateBundleInputSchema,
  UpdateBundleInputSchema,
  BundleResponseSchema,
  BundleListResponseSchema,
  BundleQuerySchema,
} from '@packages/schemas/dtos'

// ========================================
// Bundle Resource Definition
// ========================================

export const bundleResource = defineResource({
  name: 'bundle',
  model: 'Bundle',
  path: '/bundles',
  schemas: {
    create: CreateBundleInputSchema,
    update: UpdateBundleInputSchema,
    response: BundleResponseSchema,
    list: BundleListResponseSchema,
    query: BundleQuerySchema,
  },
  access: {
    create: ['VENDOR', 'ADMIN'],  // Only vendors can create bundles
    read: [],  // Public - customers can view bundles
    update: ['VENDOR', 'ADMIN'],  // Only vendors can update their bundles
    delete: ['VENDOR', 'ADMIN'],  // Only vendors can delete their bundles
    list: [],  // Public - customers can list bundles
  },
  ownership: {
    enabled: true,  // Enforce ownership: vendors can only modify bundles from their own stores
    relationPath: 'store.ownerUserId',  // Check via store
  },
  operations: ['create', 'read', 'update', 'delete', 'list'],
})
