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
    beforeCreate: async (data, context) => {
      // Ensure context has required fields
      if (!context?.userId || !context?.userRole) {
        throw new Error('Authentication required')
      }
      
      // Use policy for authorization
      const canCreate = await promotionPolicy.canCreate(data, {
        userId: context.userId,
        userRole: context.userRole,
      })
      if (canCreate !== true) {
        throw new Error(canCreate as string)
      }
      
      // Use domain service for preparation
      return promotionDomain.prepareForCreation(data, context.userId)
    },
    afterCreate: async (result) => {
      // Emit domain event for side effects
      await eventBus.emit(DomainEvents.PROMOTION_CREATED, result)
    },
  },
})

