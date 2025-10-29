/**
 * Extension Patterns for Computed Fields - SDK-First Architecture
 * 
 * This file demonstrates clear patterns for extending SDK types with computed fields:
 * 1. Consistent extension naming conventions
 * 2. Type-safe computed field patterns
 * 3. Reusable computation utilities
 * 4. Performance-optimized computed fields
 */

import { useMemo } from 'react'
import type { 
  StoreResponse, 
  ItemResponse, 
  OrderResponse, 
  UserResponse 
} from '@api/types'

// ============================================
// Extension Type Patterns
// ============================================

/**
 * Store Extensions - Location-based computed fields
 */
export interface StoreWithLocation extends StoreResponse {
  /** Computed distance from user's location in miles */
  distance?: number
  /** Formatted full address string */
  fullAddress?: string
  /** Coordinates for mapping */
  coordinates?: {
    lat: number
    lng: number
  }
  /** Whether store is within delivery radius */
  isWithinDeliveryRadius?: boolean
  /** Estimated delivery time in minutes */
  estimatedDeliveryTime?: number
}

/**
 * Store Extensions - Business metrics
 */
export interface StoreWithMetrics extends StoreResponse {
  /** Computed average rating */
  averageRating?: number
  /** Total number of ratings */
  ratingCount?: number
  /** Computed revenue metrics */
  revenue?: {
    daily: number
    weekly: number
    monthly: number
  }
  /** Order completion rate */
  completionRate?: number
}

/**
 * Item Extensions - Pricing and availability
 */
export interface ItemWithPricing extends ItemResponse {
  /** Computed final price after discounts */
  finalPrice?: number
  /** Available discount percentage */
  discountPercentage?: number
  /** Whether item is on sale */
  isOnSale?: boolean
  /** Computed savings amount */
  savingsAmount?: number
}

/**
 * Order Extensions - Status and timing
 */
export interface OrderWithTiming extends OrderResponse {
  /** Computed order age in minutes */
  orderAge?: number
  /** Estimated completion time */
  estimatedCompletion?: Date
  /** Whether order is overdue */
  isOverdue?: boolean
  /** Computed status progress (0-100) */
  statusProgress?: number
}

/**
 * User Extensions - Activity and preferences
 */
export interface UserWithActivity extends UserResponse {
  /** Last activity timestamp */
  lastActive?: Date
  /** Computed activity level */
  activityLevel?: 'low' | 'medium' | 'high'
  /** Preferred store categories */
  preferredCategories?: string[]
  /** Computed loyalty score */
  loyaltyScore?: number
}

// ============================================
// Computation Utilities
// ============================================

/**
 * Location computation utilities
 */
export const locationUtils = {
  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  calculateDistance: (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 3959 // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  },

  /**
   * Format address components into full address string
   */
  formatAddress: (address: {
    street: string
    city: string
    state: string
    zip: string
    country?: string
  }): string => {
    const parts = [address.street, address.city, address.state, address.zip]
    if (address.country && address.country !== 'US') {
      parts.push(address.country)
    }
    return parts.join(', ')
  },

  /**
   * Check if coordinates are within delivery radius
   */
  isWithinRadius: (
    storeLat: number, 
    storeLng: number, 
    userLat: number, 
    userLng: number, 
    radiusMiles: number
  ): boolean => {
    const distance = locationUtils.calculateDistance(storeLat, storeLng, userLat, userLng)
    return distance <= radiusMiles
  }
}

/**
 * Pricing computation utilities
 */
export const pricingUtils = {
  /**
   * Calculate final price after applying discounts
   */
  calculateFinalPrice: (basePrice: number, discountPercentage?: number): number => {
    if (!discountPercentage) return basePrice
    return basePrice * (1 - discountPercentage / 100)
  },

  /**
   * Calculate savings amount
   */
  calculateSavings: (basePrice: number, finalPrice: number): number => {
    return basePrice - finalPrice
  },

  /**
   * Check if item is on sale
   */
  isOnSale: (basePrice: number, finalPrice: number): boolean => {
    return finalPrice < basePrice
  }
}

/**
 * Time computation utilities
 */
export const timeUtils = {
  /**
   * Calculate order age in minutes
   */
  calculateOrderAge: (createdAt: string): number => {
    const created = new Date(createdAt)
    const now = new Date()
    return Math.floor((now.getTime() - created.getTime()) / (1000 * 60))
  },

  /**
   * Estimate delivery time based on order status and prep time
   */
  estimateDeliveryTime: (
    orderStatus: string, 
    prepTimeMin: number, 
    deliveryTimeMin = 30
  ): number => {
    const statusDelays: Record<string, number> = {
      'PLACED': prepTimeMin + deliveryTimeMin,
      'ACCEPTED': prepTimeMin + deliveryTimeMin,
      'PREPARING': (prepTimeMin * 0.5) + deliveryTimeMin,
      'READY': deliveryTimeMin,
      'OUT_FOR_DELIVERY': deliveryTimeMin * 0.5,
      'DELIVERED': 0
    }
    return statusDelays[orderStatus] || prepTimeMin + deliveryTimeMin
  },

  /**
   * Check if order is overdue
   */
  isOverdue: (createdAt: string, estimatedTime: number): boolean => {
    const orderAge = timeUtils.calculateOrderAge(createdAt)
    return orderAge > estimatedTime
  }
}

// ============================================
// Hook Patterns for Computed Fields
// ============================================

/**
 * useStoreWithLocation - Store with location-based computed fields
 */
export function useStoreWithLocation(
  store: StoreResponse,
  userLocation?: { lat: number; lng: number }
): StoreWithLocation {
  return useMemo(() => {
    let computed: StoreWithLocation = { ...store }

    if (userLocation && store.latitude && store.longitude) {
      const distance = locationUtils.calculateDistance(
        userLocation.lat,
        userLocation.lng,
        Number.parseFloat(store.latitude),
        Number.parseFloat(store.longitude)
      )

      computed = {
        ...computed,
        distance,
        coordinates: {
          lat: Number.parseFloat(store.latitude),
          lng: Number.parseFloat(store.longitude)
        },
        fullAddress: locationUtils.formatAddress({
          street: store.addressStreet,
          city: store.addressCity,
          state: store.addressState,
          zip: store.addressZip,
          country: store.addressCountry
        }),
        isWithinDeliveryRadius: distance <= (store.deliveryDistance ? Number.parseFloat(store.deliveryDistance) : 25)
      }
    }

    return computed
  }, [store, userLocation])
}

/**
 * useItemWithPricing - Item with pricing-based computed fields
 */
export function useItemWithPricing(item: ItemResponse): ItemWithPricing {
  return useMemo(() => {
    const basePrice = Number.parseFloat(item.price)
    const discountPercentage = item.discountPercentage ? Number.parseFloat(item.discountPercentage) : 0
    const finalPrice = pricingUtils.calculateFinalPrice(basePrice, discountPercentage)
    const savingsAmount = pricingUtils.calculateSavings(basePrice, finalPrice)

    return {
      ...item,
      finalPrice,
      discountPercentage,
      isOnSale: pricingUtils.isOnSale(basePrice, finalPrice),
      savingsAmount
    }
  }, [item])
}

/**
 * useOrderWithTiming - Order with timing-based computed fields
 */
export function useOrderWithTiming(order: OrderResponse): OrderWithTiming {
  return useMemo(() => {
    const orderAge = timeUtils.calculateOrderAge(order.createdAt)
    const estimatedTime = timeUtils.estimateDeliveryTime(
      order.status,
      order.prepTimeMin || 30,
      30 // Default delivery time
    )
    const isOverdue = timeUtils.isOverdue(order.createdAt, estimatedTime)

    // Calculate status progress (0-100)
    const statusProgress = calculateStatusProgress(order.status)

    return {
      ...order,
      orderAge,
      estimatedCompletion: new Date(new Date(order.createdAt).getTime() + estimatedTime * 60_000),
      isOverdue,
      statusProgress
    }
  }, [order])
}

// ============================================
// Helper Functions
// ============================================

/**
 * Calculate order status progress (0-100)
 */
function calculateStatusProgress(status: string): number {
  const statusProgress: Record<string, number> = {
    'PLACED': 10,
    'ACCEPTED': 25,
    'PREPARING': 50,
    'READY': 75,
    'OUT_FOR_DELIVERY': 90,
    'DELIVERED': 100,
    'CANCELLED': 0
  }
  return statusProgress[status] || 0
}
