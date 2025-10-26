import { defineResource } from '@packages/schemas/core'
import {
  CreateStoreInputSchema,
  UpdateStoreInputSchema,
  StoreResponseSchema,
  StoreListResponseSchema,
  StoreQuerySchema,
} from '@packages/schemas/dtos'
import { StoreDomain, eventBus, DomainEvents, locationDomain } from '@packages/domain'

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
    create: ['USER', 'VENDOR', 'ADMIN'],  // Open platform: any user can create stores
    read: [],  // Public
    update: ['USER', 'VENDOR', 'ADMIN'],  // Any authenticated user can update their own store
    delete: ['ADMIN'],  // Only admins can delete
    list: [],  // Public
  },
  ownership: {
    enabled: true,  // Enforce ownership: users can only update their own stores
    relationPath: 'ownerUserId',
  },
  operations: ['create', 'read', 'update', 'delete', 'list'],
  customHooks: {
    beforeCreate: async (data, context) => {
      // Use domain service for preparation
      return storeDomain.prepareForCreation(data, context!.userId!)
    },
    afterCreate: async (result) => {
      // Emit domain event
      await eventBus.emit(DomainEvents.STORE_CREATED, result)
    },
    beforeList: async (filters) => {
      // Remove location params from Prisma filters (they're used in afterList instead)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { latitude, longitude, radiusMiles, city, state, zip, ...prismaFilters } = filters as Record<string, unknown>
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

