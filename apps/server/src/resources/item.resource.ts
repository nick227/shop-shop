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

import { NIL_UUID, sanitizeItemListWhere } from './item-list.filters'

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
    afterRead: async (result) => {
      const item = result as { id: string }
      const [mediaAssets, itemTags] = await Promise.all([
        prisma.mediaAsset.findMany({
          where: { itemId: item.id, kind: 'IMAGE' },
          orderBy: { sortIndex: 'asc' },
        }),
        prisma.itemTag.findMany({
          where: { itemId: item.id },
          select: { tag: { select: { slug: true, label: true, category: true } } },
        }),
      ])
      return {
        ...(result as Record<string, unknown>),
        mediaAssets,
        tags: itemTags.map((t) => t.tag),
      }
    },
    afterList: async (result) => {
      const listResult = result as { data: Array<{ id: string; [key: string]: unknown }>; total: number }
      const itemIds = listResult.data.map((item) => item.id)

      // Two batch queries instead of N*2 individual queries
      const [allMedia, allItemTags] = await Promise.all([
        prisma.mediaAsset.findMany({
          where: { itemId: { in: itemIds }, kind: 'IMAGE' },
          orderBy: { sortIndex: 'asc' },
        }),
        prisma.itemTag.findMany({
          where: { itemId: { in: itemIds } },
          select: { itemId: true, tag: { select: { slug: true, label: true, category: true } } },
        }),
      ])

      // Build O(1) lookup maps
      const mediaByItem = new Map<string, typeof allMedia>()
      for (const m of allMedia) {
        if (!m.itemId) continue
        const arr = mediaByItem.get(m.itemId)
        if (arr) arr.push(m)
        else mediaByItem.set(m.itemId, [m])
      }

      const tagsByItem = new Map<string, Array<{ slug: string; label: string; category: string }>>()
      for (const t of allItemTags) {
        const arr = tagsByItem.get(t.itemId)
        if (arr) arr.push(t.tag)
        else tagsByItem.set(t.itemId, [t.tag])
      }

      return {
        ...listResult,
        data: listResult.data.map((item) => ({
          ...item,
          mediaAssets: mediaByItem.get(item.id) ?? [],
          tags: tagsByItem.get(item.id) ?? [],
        })),
      }
    },
  },
  operations: ['create', 'read', 'update', 'delete', 'list'],
})
