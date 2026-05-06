import { defineResource } from '@packages/schemas/core'
import {
  CreateItemInputSchema,
  UpdateItemInputSchema,
  ItemResponseSchema,
  ItemListResponseSchema,
  ItemQuerySchema,
} from '@packages/schemas/dtos'
import { StoreDomain, eventBus, DomainEvents, locationDomain } from '@packages/domain'
import { prisma } from '@packages/db'
import { checkProductActivationRequirements } from '@packages/db/services'

import { NIL_UUID, sanitizeItemListWhere } from './item-list.filters.js'

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
    create: ['VENDOR', 'ADMIN'],  // Only VENDOR users can create items
    read: [],  // Public
    update: ['VENDOR', 'ADMIN'],  // Only VENDOR users can update their own items
    delete: ['VENDOR', 'ADMIN'],  // Only VENDOR users can delete their own items
    list: [],  // Public
  },
  ownership: {
    enabled: true,  // Enforce ownership: users can only modify items from their own stores
    relationPath: 'store.ownerUserId',  // Check via store
  },
  customHooks: {
    beforeCreate: async (data: any, context: any) => {
      // Enforce VENDOR role for item creation
      if (context.userRole !== 'VENDOR' && context.userRole !== 'ADMIN') {
        throw new Error('Only VENDOR users can create items')
      }
      
      // Verify user owns the store
      const store = await prisma.store.findUnique({
        where: { id: data.storeId },
        select: { ownerUserId: true },
      })
      
      if (!store || (context.userRole !== 'ADMIN' && store.ownerUserId !== context.userId)) {
        throw new Error('Only store owner can create items')
      }
      
      return data
    },
    beforeUpdate: async (id: string, data: any, context: any) => {
      // Enforce VENDOR role for item updates
      if (context.userRole !== 'VENDOR' && context.userRole !== 'ADMIN') {
        throw new Error('Only VENDOR users can update items')
      }
      
      // Verify user owns the store
      const item = await prisma.item.findUnique({
        where: { id },
        select: { storeId: true },
      })
      
      if (!item) {
        throw new Error('Item not found')
      }
      
      const store = await prisma.store.findUnique({
        where: { id: item.storeId },
        select: { ownerUserId: true },
      })
      
      if (!store || (context.userRole !== 'ADMIN' && store.ownerUserId !== context.userId)) {
        throw new Error('Only store owner can update items')
      }
      
      return data
    },
    beforeDelete: async (id: string, context: any) => {
      // Enforce VENDOR role for item deletion
      if (context.userRole !== 'VENDOR' && context.userRole !== 'ADMIN') {
        throw new Error('Only VENDOR users can delete items')
      }
      
      // Verify user owns the store
      const item = await prisma.item.findUnique({
        where: { id },
        select: { storeId: true },
      })
      
      if (!item) {
        throw new Error('Item not found')
      }
      
      const store = await prisma.store.findUnique({
        where: { id: item.storeId },
        select: { ownerUserId: true },
      })
      
      if (!store || (context.userRole !== 'ADMIN' && store.ownerUserId !== context.userId)) {
        throw new Error('Only store owner can delete items')
      }
      
    },
    beforeList: async (filters) => {
      const nextFilters = sanitizeItemListWhere(filters as Record<string, unknown>)
      // Apply activation requirements for public listings
      if (!nextFilters.storeId) {
        // For public listings without store filter, check product activation
        const itemList = await prisma.item.findMany({
          where: nextFilters,
          select: { id: true },
        })
        
        const itemIds = itemList.map(item => item.id)
        const activationChecks = await Promise.all(
          itemIds.map(itemId => checkProductActivationRequirements(itemId))
        )
        
        // Only show products that meet activation requirements
        const eligibleItemIds = activationChecks
          .filter(check => check.canAppearPublicly)
          .map((_, index) => itemIds[index])
        
        // Filter by eligible item IDs
        if (eligibleItemIds.length > 0) {
          nextFilters.id = { in: eligibleItemIds }
        } else {
          nextFilters.id = { in: [NIL_UUID] }
        }
      }
      
      return nextFilters
    },
  },
  operations: ['create', 'read', 'update', 'delete', 'list'],
})
