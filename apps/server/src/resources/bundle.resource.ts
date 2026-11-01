import { hasStorePermission } from '@packages/db'
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

type BundleItemInput = { itemId: string; quantity: number; sortIndex?: number }

/**
 * Every item in a bundle must exist, be listed once, belong to the bundle's store, and be on sale.
 * This is the authorization boundary for "which items can go in this bundle", not the client.
 */
async function assertBundleItems(items: BundleItemInput[], storeId: string): Promise<void> {
  if (items.length < 2) throw new Error('Bundles must contain at least 2 items')
  const itemIds = items.map((i) => i.itemId)
  if (new Set(itemIds).size !== itemIds.length) throw new Error('Each item can appear in a bundle only once')

  const found = await prisma.item.findMany({
    where: { id: { in: itemIds } },
    select: { id: true, storeId: true, isActive: true, isSoldOut: true },
  })
  if (found.length !== itemIds.length) throw new Error('One or more bundle items not found')
  if (found.some((i) => i.storeId !== storeId)) throw new Error('All bundle items must belong to the same store')
  if (found.some((i) => !i.isActive || i.isSoldOut)) throw new Error('All bundle items must be active and not sold out')
}

const itemRows = (items: BundleItemInput[]) =>
  items.map((i, idx) => ({ itemId: i.itemId, quantity: i.quantity, sortIndex: i.sortIndex ?? idx }))

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
    authorizeAccess: async (existing, context, operation) => {
      if (operation === 'read') return
      const storeId = (existing as { storeId: string }).storeId
      if (!context?.userId || !await hasStorePermission(context.userId, storeId, 'MANAGE_ITEMS')) throw new Error('Forbidden')
    },
    beforeCreate: async (data: any, context: any) => {
      if (!context.userId || !await hasStorePermission(context.userId, data.storeId, 'MANAGE_ITEMS')) {
        throw new Error('Forbidden')
      }

      const { items, pricing, ...bundle } = data as { storeId: string; items: BundleItemInput[]; pricing?: Record<string, unknown> }
      await assertBundleItems(items, bundle.storeId)

      // Prisma needs nested writes for the BundleItem and BundlePricing relations.
      return {
        ...bundle,
        items: { create: itemRows(items) },
        ...(pricing ? { pricing: { create: pricing } } : {}),
      }
    },

    beforeUpdate: async (id: string, data: any, context: any) => {
      const bundle = await prisma.bundle.findUnique({
        where: { id },
        select: { storeId: true },
      })
      if (data.storeId && data.storeId !== bundle?.storeId) throw new Error('Store cannot be changed')
      if (!bundle) throw new Error('Bundle not found')

      if (!context.userId || !await hasStorePermission(context.userId, bundle.storeId, 'MANAGE_ITEMS')) {
        throw new Error('Forbidden')
      }

      // storeId was checked above; it is never written, so a bundle cannot change store.
      const { items, pricing, ...rest } = data as {
        items?: BundleItemInput[]
        pricing?: Record<string, unknown>
        storeId?: string
      }
      const changes = Object.fromEntries(Object.entries(rest).filter(([key]) => key !== 'storeId'))
      if (items) await assertBundleItems(items, bundle.storeId)

      // Replace the item list and pricing as a whole; both run inside the bundle update.
      return {
        ...changes,
        ...(items ? { items: { deleteMany: {}, create: itemRows(items) } } : {}),
        ...(pricing ? { pricing: { upsert: { create: pricing, update: pricing } } } : {}),
      }
    },

    beforeDelete: async (id: string, context: any) => {
      const bundle = await prisma.bundle.findUnique({
        where: { id },
        select: { storeId: true },
      })
      if (!bundle) throw new Error('Bundle not found')

      if (!context.userId || !await hasStorePermission(context.userId, bundle.storeId, 'MANAGE_ITEMS')) {
        throw new Error('Forbidden')
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
