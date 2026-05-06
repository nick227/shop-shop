import { defineResource } from '@packages/schemas/core'
import {
  CreateStoreInputSchema,
  UpdateStoreInputSchema,
  StoreResponseSchema,
  StoreListResponseSchema,
  StoreQuerySchema,
} from '@packages/schemas/dtos'
import { StoreDomain, eventBus, DomainEvents, locationDomain } from '@packages/domain'
import { prisma } from '@packages/db'
import { checkStoreActivationRequirements } from '@packages/db/services'

// ========================================
// Store Resource Definition
// Uses centralized domain services
// ========================================

const storeDomain = new StoreDomain()

export const storeResource = defineResource({
  name: 'store',
  model: 'Store',
  schemas: {
    create: CreateStoreInputSchema,
    update: UpdateStoreInputSchema,
    response: StoreResponseSchema,
    list: StoreListResponseSchema,
    query: StoreQuerySchema,
  },
  access: {
    create: ['USER', 'VENDOR', 'ADMIN'],  // Open vendor model: store creation converts USER -> VENDOR
    read: [],  // Public
    update: ['USER', 'VENDOR', 'ADMIN'],  // Ownership hook decides who can update
    delete: ['ADMIN'],  // Only admins can delete
    list: [],  // Public
  },
  ownership: {
    enabled: true,  // Enforce ownership: users can only update their own stores
    relationPath: 'ownerUserId',
  },
  operations: ['create', 'read', 'update', 'delete', 'list'],
  customHooks: {
    beforeCreate: async (data: any, context: any) => {
      if (!['USER', 'VENDOR', 'ADMIN'].includes(context.userRole)) {
        throw new Error('Authenticated users can create stores')
      }
      
      // Use domain service for preparation
      return storeDomain.prepareForCreation(data, context.userId)
    },
    beforeUpdate: async (id: string, data: any, context: any) => {
      // Enforce ownership: only store owner can update
      const store = await prisma.store.findUnique({
        where: { id },
        select: { ownerUserId: true },
      })
      
      if (!store || (context.userRole !== 'ADMIN' && store.ownerUserId !== context.userId)) {
        throw new Error('Only store owner can update store')
      }
      
      return data
    },
    beforeDelete: async (id: string, context: any) => {
      // Enforce ownership: only store owner can delete
      const store = await prisma.store.findUnique({
        where: { id },
        select: { ownerUserId: true },
      })
      
      if (!store || (context.userRole !== 'ADMIN' && store.ownerUserId !== context.userId)) {
        throw new Error('Only store owner can delete store')
      }
      
    },
    afterCreate: async (result, context) => {
      if (context?.userId && context.userRole === 'USER') {
        await prisma.user.update({
          where: { id: context.userId },
          data: { role: 'VENDOR' },
        })
      }

      // Emit domain event
      await eventBus.emit(DomainEvents.STORE_CREATED, result)
    },
    beforeList: async (filters) => {
      // Remove location params from Prisma filters (they're used in afterList instead)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { latitude, longitude, radiusMiles, city, state, zip, ...rest } = filters as Record<string, unknown>
      const prismaFilters: Record<string, unknown> = { ...rest }

      if (!prismaFilters.ownerUserId && !prismaFilters.status) {
        prismaFilters.status = 'ACTIVE'
      }
      if (!prismaFilters.ownerUserId && prismaFilters.isPublished === undefined) {
        prismaFilters.isPublished = true
      }
      if (typeof prismaFilters.isPublished === 'string') {
        prismaFilters.isPublished = prismaFilters.isPublished === 'true'
      }

      // Public marketplace: restrict to stores that pass activation checks (by store id, not ownerUserId)
      if (!prismaFilters.ownerUserId) {
        const storeList = await prisma.store.findMany({
          where: prismaFilters,
          select: { id: true },
        })

        const storeIds = storeList.map(store => store.id)
        const activationChecks = await Promise.all(
          storeIds.map(storeId => checkStoreActivationRequirements(storeId))
        )

        const eligibleStoreIds = activationChecks
          .filter(check => check.canAppearInMarketplace)
          .map((_, index) => storeIds[index])

        if (eligibleStoreIds.length > 0) {
          prismaFilters.id = { in: eligibleStoreIds }
        } else {
          prismaFilters.id = { in: ['00000000-0000-0000-0000-000000000000'] }
        }
      }

      return prismaFilters
    },
    afterList: async (result, context) => {
      const listResult = result as { data: Array<{
        id: string
        latitude?: number | null
        longitude?: number | null
        [key: string]: unknown
      }>, total: number }
      
      // Extract location filters from query
      const filters = (context as unknown as { filters?: Record<string, unknown> })?.filters || {}
      const latitude = filters.latitude as number | undefined
      const longitude = filters.longitude as number | undefined
      const radiusMiles = (filters.radiusMiles as number) || 25
      
      // If no user location provided, return as-is
      if (!latitude || !longitude) {
        return listResult
      }
      
      // Calculate distance for each store and filter by radius
      const storesWithDistance = listResult.data
        .map(store => {
          // Skip stores without coordinates
          if (!locationDomain.isValidCoordinates(store.latitude, store.longitude)) {
            return null
          }
          
          const distance = locationDomain.calculateDistance(
            latitude,
            longitude,
            Number(store.latitude),
            Number(store.longitude)
          )
          
          return {
            ...store,
            distance,
          } as typeof store & { distance: number; deliveryDistance?: number | null }
        })
        .filter((store): store is NonNullable<typeof store> => {
          if (store === null) return false
          
          // Check if store is within user's search radius
          const withinSearchRadius = store.distance <= radiusMiles
          
          // Check if store delivers to user's location (using store's deliveryDistance)
          const storeDeliveryDistance = store.deliveryDistance ? Number(store.deliveryDistance) : null
          const withinDeliveryRadius = storeDeliveryDistance === null || store.distance <= storeDeliveryDistance
          
          // Store must be within both search radius AND delivery radius
          return withinSearchRadius && withinDeliveryRadius
        })
        .sort((a, b) => a.distance - b.distance)
      
      return {
        data: storesWithDistance,
        total: storesWithDistance.length,
      }
    },
  },
})
