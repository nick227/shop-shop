import { defineResource } from '@packages/schemas/core'
import {
  CreateBundleInputSchema,
  UpdateBundleInputSchema,
  BundleResponseSchema,
  BundleListResponseSchema,
  BundleQuerySchema,
} from '@packages/schemas/dtos'
import { prisma } from '@packages/db'
import { checkBundleActivationRequirements } from '@packages/db/services'

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
    create: ['VENDOR', 'ADMIN'],
    read: [],
    update: ['VENDOR', 'ADMIN'],
    delete: ['VENDOR', 'ADMIN'],
    list: [],
  },
  ownership: {
    enabled: true,
    relationPath: 'store.ownerUserId',
  },
  operations: ['create', 'read', 'update', 'delete', 'list'],
  customHooks: {
    beforeCreate: async (data: any, context: any) => {
      const store = await prisma.store.findUnique({
        where: { id: data.storeId },
        select: { ownerUserId: true },
      })
      if (!store || (context.userRole !== 'ADMIN' && store.ownerUserId !== context.userId)) {
        throw new Error('Only the store owner can create bundles')
      }

      if (Array.isArray(data.items) && data.items.length > 0) {
        // Production validation: minimum 2 items required
        if (data.items.length < 2) {
          throw new Error('Bundles must contain at least 2 items')
        }

        const itemIds: string[] = data.items.map((i: any) => i.itemId)
        const items = await prisma.item.findMany({
          where: { id: { in: itemIds } },
          select: { id: true, storeId: true, isActive: true, isSoldOut: true },
        })
        
        if (items.length !== itemIds.length) throw new Error('One or more bundle items not found')
        
        // All items must belong to the same store
        const wrong = items.filter((i) => i.storeId !== data.storeId)
        if (wrong.length > 0) throw new Error('All bundle items must belong to the same store')
        
        // All items must be active and not sold out
        const inactiveItems = items.filter((i) => !i.isActive || i.isSoldOut)
        if (inactiveItems.length > 0) throw new Error('All bundle items must be active and not sold out')
      }

      return data
    },

    beforeUpdate: async (id: string, data: any, context: any) => {
      const bundle = await prisma.bundle.findUnique({
        where: { id },
        select: { storeId: true },
      })
      if (!bundle) throw new Error('Bundle not found')

      const store = await prisma.store.findUnique({
        where: { id: bundle.storeId },
        select: { ownerUserId: true },
      })
      if (!store || (context.userRole !== 'ADMIN' && store.ownerUserId !== context.userId)) {
        throw new Error('Only the store owner can update bundles')
      }

      if (Array.isArray(data.items) && data.items.length > 0) {
        // Production validation: minimum 2 items required
        if (data.items.length < 2) {
          throw new Error('Bundles must contain at least 2 items')
        }

        const itemIds: string[] = data.items.map((i: any) => i.itemId)
        const items = await prisma.item.findMany({
          where: { id: { in: itemIds } },
          select: { id: true, storeId: true, isActive: true, isSoldOut: true },
        })
        
        // All items must belong to the same store
        const wrong = items.filter((i) => i.storeId !== bundle.storeId)
        if (wrong.length > 0) throw new Error('All bundle items must belong to the same store')
        
        // All items must be active and not sold out
        const inactiveItems = items.filter((i) => !i.isActive || i.isSoldOut)
        if (inactiveItems.length > 0) throw new Error('All bundle items must be active and not sold out')
      }

      return data
    },

    beforeDelete: async (id: string, context: any) => {
      const bundle = await prisma.bundle.findUnique({
        where: { id },
        select: { storeId: true },
      })
      if (!bundle) throw new Error('Bundle not found')

      const store = await prisma.store.findUnique({
        where: { id: bundle.storeId },
        select: { ownerUserId: true },
      })
      if (!store || (context.userRole !== 'ADMIN' && store.ownerUserId !== context.userId)) {
        throw new Error('Only the store owner can delete bundles')
      }
    },

    beforeList: async (filters: any, context: any) => {
      const f = { ...(filters as Record<string, unknown>) }

      // Vendor listing their own store's bundles — skip activation checks
      if (f.storeId && f.ownerUserId) return f

      // Public listing: enforce strict bundle requirements
      if (!f.ownerUserId) {
        f.isActive = true

        if (f.storeId) {
          const bundles = await prisma.bundle.findMany({
            where: { storeId: f.storeId as string, isActive: true },
            include: {
              items: {
                include: { item: { select: { isActive: true, isSoldOut: true, storeId: true } } },
              },
            },
          })
          
          // Filter bundles that meet ALL requirements
          const eligibleBundles = bundles.filter((bundle) => {
            // Must have at least 2 items
            if (bundle.items.length < 2) return false
            
            // All items must belong to same store as bundle
            const allItemsFromSameStore = bundle.items.every((bi) => bi.item.storeId === bundle.storeId)
            if (!allItemsFromSameStore) return false
            
            // All items must be active and not sold out
            const allItemsActive = bundle.items.every((bi) => bi.item.isActive && !bi.item.isSoldOut)
            if (!allItemsActive) return false
            
            return true
          })
          
          const eligibleIds = eligibleBundles.map((b) => b.id)
          f.id = eligibleIds.length > 0 ? { in: eligibleIds } : { in: ['__none__'] }
        }
      }

      return f
    },
  },
})
