/**
 * Type Mappers - Convert SDK types to Frontend types
 * 
 * This file provides type-safe mappers that convert SDK response types
 * to frontend-expected types, handling missing fields and type transformations.
 * 
 * ⚠️  AUTO-GENERATED - DO NOT EDIT MANUALLY
 * Generated from: SDK types
 * 
 * To regenerate: pnpm gen:types
 */

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable unicorn/no-null */

import type {
  ListStores200ResponseDataInner,
  ListItems200ResponseDataInner,
  ListOrders200ResponseDataInner,
  ListAddresss200ResponseDataInner,
  ListBundles200ResponseDataInner,
  ListCarts200ResponseDataInner,
  ListPromotions200ResponseDataInner,
  ListUsers200ResponseDataInner,
  AuthResponse as SDKAuthResponse,
  PaymentIntentResponse as SDKPaymentIntentResponse,
  SDKTipResponse as SDKTipResponse,
  UserPublicResponse as SDKUserPublicResponse
} from './types'

import type {
  StoreResponse,
  ItemResponse,
  OrderResponse,
  AddressResponse,
  Bundle,
  CartResponse,
  UserResponse,
  BundleItem,
  BundlePricing
} from './backend-types'

import type {
  PromotionResponse
} from './types'

// Note: AuthResponse, PaymentIntentResponse, TipResponse, UserPublicResponse 
// are not available in ./types, using SDK types directly

// ============================================
// Utility Types for SDK Data
// ============================================

/**
 * Extended SDK types that include frontend-expected fields
 * These represent what the SDK data would look like if it had these fields
 */
interface SDKWithId {
  id?: string
  createdAt?: string
  updatedAt?: string
}

// Removed unused interface types to fix linting errors

// ============================================
// Type Guards
// ============================================

/**
 * Type guard to check if SDK data has frontend-expected fields
 */
function hasIdField(data: unknown): data is SDKWithId {
  return typeof data === 'object' && data !== null && 'id' in data
}

function hasTimestampFields(data: unknown): data is SDKWithId {
  return hasIdField(data) && 'createdAt' in data && 'updatedAt' in data
}

// ============================================
// Safe Field Extractors
// ============================================

/**
 * Safely extract id field with fallback
 */
function extractId(data: unknown, fallback = ''): string {
  if (hasIdField(data) && typeof data.id === 'string') {
    return data.id
  }
  return fallback
}

/**
 * Safely extract timestamp fields with fallback
 */
function extractTimestamps(data: unknown): { createdAt: string; updatedAt: string } {
  const now = new Date().toISOString()
  
  if (hasTimestampFields(data)) {
    return {
      createdAt: typeof data.createdAt === 'string' ? data.createdAt : now,
      updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : now
    }
  }
  
  return {
    createdAt: now,
    updatedAt: now
  }
}

/**
 * Safely extract numeric field with fallback
 */
function extractNumber(data: unknown, field: string, fallback = 0): number {
  if (typeof data === 'object' && data !== null && field in data) {
    const value = (data as Record<string, unknown>)[field]
    if (typeof value === 'number') return value
    if (typeof value === 'string') {
      const parsed = Number.parseFloat(value)
      if (!Number.isNaN(parsed)) return parsed
    }
  }
  return fallback
}

/**
 * Safely extract boolean field with fallback
 */
function extractBoolean(data: unknown, field: string, fallback = false): boolean {
  if (typeof data === 'object' && data !== null && field in data) {
    const value = (data as Record<string, unknown>)[field]
    if (typeof value === 'boolean') return value
    if (typeof value === 'string') return value === 'true'
  }
  return fallback
}

/**
 * Safely extract string field with fallback
 */
function extractString(data: unknown, field: string, fallback = ''): string {
  if (typeof data === 'object' && data !== null && field in data) {
    const value = (data as Record<string, unknown>)[field]
    if (typeof value === 'string') return value
  }
  return fallback
}

/**
 * Safely parse JSON field
 */
function parseJsonField<T>(data: unknown, field: string, fallback: T): T {
  if (typeof data === 'object' && data !== null && field in data) {
    const value = (data as Record<string, unknown>)[field]
    if (typeof value === 'string') {
      try {
        return JSON.parse(value) as T
      } catch {
        // Return fallback if JSON parsing fails
      }
    }
  }
  return fallback
}

// ============================================
// Main Mapper Functions
// ============================================

/**
 * Map SDK store data to frontend StoreResponse
 */
export function mapStore(sdk: ListStores200ResponseDataInner): StoreResponse {
  const timestamps = extractTimestamps(sdk)
  const id = extractId(sdk, `store-${Date.now()}`)
  
  // Parse fees JSON
  const fees = parseJsonField(sdk, 'feesJson', {})
  const deliveryFee = extractNumber(fees, 'deliveryFee', 0)
  const minOrder = extractNumber(fees, 'minOrder', 0)
  
  return {
    ...sdk,
    id,
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
    deliveryFee,
    minOrder,
    distance: undefined, // Add missing distance property
    // Map address fields
    city: sdk.addressCity ?? undefined,
    state: sdk.addressState ?? undefined,
    zipCode: sdk.addressZip ?? undefined,
  } as StoreResponse
}

/**
 * Map SDK item data to frontend ItemResponse
 */
export function mapItem(sdk: ListItems200ResponseDataInner): ItemResponse {
  const timestamps = extractTimestamps(sdk)
  const id = extractId(sdk, `item-${Date.now()}`)
  
  return {
    ...sdk,
    id,
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  }
}

/**
 * Map SDK order data to frontend OrderResponse
 */
export function mapOrder(sdk: ListOrders200ResponseDataInner): OrderResponse {
  const timestamps = extractTimestamps(sdk)
  const id = extractId(sdk, `order-${Date.now()}`)
  
  return {
    ...sdk,
    id,
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
    stripePaymentIntentId: null,
    stripeChargeId: null,
    status: 'PENDING',
    deliveryType: 'DELIVERY',
    paymentStatus: 'PENDING',
    // Convert null to undefined for type compatibility
    addressSnapshot: sdk.addressSnapshot ?? undefined,
  } as OrderResponse
}

/**
 * Map SDK address data to frontend AddressResponse
 */
export function mapAddress(sdk: ListAddresss200ResponseDataInner): AddressResponse {
  const timestamps = extractTimestamps(sdk)
  const id = extractId(sdk, `address-${Date.now()}`)
  
  return {
    ...sdk,
    id,
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  }
}

/**
 * Map SDK bundle data to frontend Bundle
 */
export function mapBundle(sdk: ListBundles200ResponseDataInner): Bundle {
  const timestamps = extractTimestamps(sdk)
  const id = extractId(sdk, `bundle-${Date.now()}`)
  
  // Parse JSON strings from SDK
  const items = parseJsonField(sdk, 'items', [])
  const pricing = parseJsonField(sdk, 'pricing', {})
  
  // Transform items to include required fields
  const bundleItems: BundleItem[] = items.map((item: unknown, index: number) => {
    if (typeof item !== 'object' || item === null) {
      return {
        id: `bundle-item-${index}`,
        bundleId: id,
        itemId: '',
        quantity: 1,
        sortIndex: index,
        price: 0,
        title: undefined,
      }
    }
    
    const itemData = item as Record<string, unknown>
    return {
      id: extractString(itemData, 'id', `bundle-item-${index}`),
      bundleId: id,
      itemId: extractString(itemData, 'itemId', extractString(itemData, 'id', '')),
      quantity: extractNumber(itemData, 'quantity', 1),
      sortIndex: extractNumber(itemData, 'sortIndex', index),
      price: extractNumber(itemData, 'price'),
      title: extractString(itemData, 'title'),
    } as BundleItem
  })
  
  return {
    id,
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
    storeId: (sdk as any).storeId ?? '',
    name: (sdk as any).name ?? '',
    description: (sdk as any).description ?? '',
    imageUrl: (sdk as any).imageUrl ?? '',
    isActive: extractBoolean(sdk, 'isActive', false),
    sortIndex: extractNumber(sdk, 'sortIndex', 0),
    items: bundleItems,
    pricing: pricing as BundlePricing,
    // Calculate computed fields
    totalItems: bundleItems.length,
    individualPrice: bundleItems.reduce((sum, item) => sum + (extractNumber(item, 'price', 0)), 0),
    bundlePrice: extractNumber(pricing, 'fixedPrice', 0),
    savings: 0, // Will be calculated based on pricing type
    savingsPercent: 0, // Will be calculated based on pricing type
  }
}

/**
 * Map SDK cart data to frontend CartResponse
 */
export function mapCart(sdk: ListCarts200ResponseDataInner): CartResponse {
  const timestamps = extractTimestamps(sdk)
  const id = extractId(sdk, `cart-${Date.now()}`)
  
  return {
    ...sdk,
    id,
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  } as CartResponse
}

/**
 * Map SDK promotion data to frontend PromotionResponse
 */
export function mapPromotion(sdk: ListPromotions200ResponseDataInner): PromotionResponse {
  const timestamps = extractTimestamps(sdk)
  const id = extractId(sdk, `promotion-${Date.now()}`)
  
  return {
    ...sdk,
    id,
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  }
}

/**
 * Map SDK user data to frontend UserResponse
 */
export function mapUser(sdk: ListUsers200ResponseDataInner): UserResponse {
  const timestamps = extractTimestamps(sdk)
  const id = extractId(sdk, `user-${Date.now()}`)
  
  return {
    ...sdk,
    id,
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
    firstName: (sdk as any).firstName ?? undefined,
    lastName: (sdk as any).lastName ?? undefined,
  } as UserResponse
}

/**
 * Map SDK auth data to frontend AuthResponse
 */
export function mapAuth(sdk: SDKAuthResponse): SDKAuthResponse {
  return sdk
}

/**
 * Map SDK payment intent data to frontend PaymentIntentResponse
 */
export function mapPaymentIntent(sdk: SDKPaymentIntentResponse): SDKPaymentIntentResponse {
  return sdk
}

/**
 * Map SDK tip data to frontend TipResponse
 */
export function mapTip(sdk: SDKTipResponse): SDKTipResponse {
  return sdk
}

/**
 * Map SDK user public data to frontend UserPublicResponse
 */
export function mapUserPublic(sdk: SDKUserPublicResponse): SDKUserPublicResponse {
  return sdk
}
