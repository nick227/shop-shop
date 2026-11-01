import { hasStorePermission, getAccountCapabilities } from '@packages/db'
import { defineResource } from '@packages/schemas/core'
import {
  CreatePromotionInputSchema,
  UpdatePromotionInputSchema,
  PromotionResponseSchema,
  PromotionListResponseSchema,
} from '@packages/schemas/dtos'
import { PromotionPolicy, PromotionDomain, eventBus, DomainEvents } from '@packages/domain'

// ========================================
// Promotion Resource Definition
// Uses centralized domain services
// ========================================

const promotionPolicy = new PromotionPolicy()
const promotionDomain = new PromotionDomain()

export const promotionResource = defineResource({
  name: 'promotion',
  model: 'Promotion',
  schemas: {
    create: CreatePromotionInputSchema,
    update: UpdatePromotionInputSchema,
    response: PromotionResponseSchema,
    list: PromotionListResponseSchema,
  },
  access: {
    create: ['USER', 'VENDOR', 'ADMIN'],  // Open platform: any user can create promotions
    read: [],  // Public
    update: ['USER', 'VENDOR', 'ADMIN'],  // Any authenticated user can update their own promotions
    delete: ['USER', 'VENDOR', 'ADMIN'],  // Any authenticated user can delete their own promotions
    list: [],  // Public
  },
  ownership: {
    enabled: true,  // Enforce ownership
    relationPath: 'store.ownerUserId',
  },
  operations: ['create', 'read', 'update', 'delete', 'list'],
  customHooks: {
    authorizeAccess: async (existing, context, operation) => {
      if (operation === 'read') return
      if (!context?.userId) throw new Error('Forbidden')
      const storeId = (existing as { storeId?: string }).storeId
      if (storeId ? !await hasStorePermission(context.userId, storeId, 'MANAGE_STORE_SETTINGS')
        : !(await getAccountCapabilities(context.userId)).canAdministerStores) throw new Error('Forbidden')
    },
    beforeUpdate: async (_id, data) => {
      const { storeId: _storeId, ...updates } = data as Record<string, unknown>
      return updates
    },
    beforeCreate: async (data, context) => {
      // Ensure context has required fields
      if (!context?.userId || !context?.userRole) {
        throw new Error('Authentication required')
      }
      
      const storeId = (data as { storeId?: string }).storeId
      if (storeId ? !await hasStorePermission(context.userId, storeId, 'MANAGE_STORE_SETTINGS')
        : !(await getAccountCapabilities(context.userId)).canAdministerStores) throw new Error('Forbidden')
      
      // Use domain service for preparation
      return promotionDomain.prepareForCreation(data, context.userId)
    },
    afterCreate: async (result) => {
      // Emit domain event for side effects
      await eventBus.emit(DomainEvents.PROMOTION_CREATED, result)
    },
  },
})

