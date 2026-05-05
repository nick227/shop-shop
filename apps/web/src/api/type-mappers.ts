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

// ESLint disables are scoped to specific functions below

import type {
  ListStores200ResponseDataInner,
  ListItems200ResponseDataInner,
  ListOrders200ResponseDataInner,
  ListAddresses200ResponseDataInner,
  ListBundles200ResponseDataInner,
  ListCarts200ResponseDataInner,
  ListPromotions200ResponseDataInner,
  ListUsers200ResponseDataInner,
  // Note: AuthResponse, PaymentIntentResponse, TipResponse, UserPublicResponse 
  // are SDK-only types that need to be imported directly from SDK when needed
} from '../../../../packages/sdk/generated/sdk/models'

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
} from './types/centralized'

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

/**
 * Type guard to check if SDK data has an id field
 */
function hasSdkId(data: unknown): data is { id?: string } {
  return typeof data === 'object' && data !== null && 'id' in data
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
  return typeof data === 'object' && data !== null && 'createdAt' in data && 'updatedAt' in data
}

// ============================================
// Safe Field Extractors
// ============================================

/**
 * Safely extract id field with stable fallback
 */
function extractId(data: unknown, fallback = ''): string {
  if (hasIdField(data) && typeof data.id === 'string') {
    return data.id
  }
  // Use stable fallback based on data content, not timestamp
  if (typeof data === 'object' && data !== null) {
    const dataStr = JSON.stringify(data)
    let hash = 0
    for (let i = 0; i < dataStr.length; i++) {
      const char = dataStr.codePointAt(i) ?? 0
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return `generated-${Math.abs(hash)}`
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
      const trimmed = value.trim()
      if (trimmed === '') return fallback
      const parsed = Number.parseFloat(trimmed)
      if (!Number.isNaN(parsed) && Number.isFinite(parsed)) return parsed
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
    if (typeof value === 'string') {
      const lower = value.toLowerCase()
      return lower === 'true' || lower === '1' || lower === 'yes'
    }
    if (typeof value === 'number') return value !== 0
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
 * Safely parse JSON field - handles both strings and objects
 */
function parseJsonField<T>(data: unknown, field: string, fallback: T): T {
  if (typeof data === 'object' && data !== null && field in data) {
    const value = (data as Record<string, unknown>)[field]
    
    // If it's already an object/array, return it directly
    if (typeof value === 'object' && value !== null) {
      return value as T
    }
    
    // If it's a string, try to parse it
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
  const id = extractId(sdk, `store-${hasSdkId(sdk) ? sdk.id ?? 'unknown' : 'unknown'}`)
  
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
  const id = extractId(sdk, `item-${hasSdkId(sdk) ? sdk.id ?? 'unknown' : 'unknown'}`)
  
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
  const id = extractId(sdk, `order-${hasSdkId(sdk) ? sdk.id ?? 'unknown' : 'unknown'}`)
  
  return {
    ...sdk,
    id,
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
    // Only set defaults if fields are missing, don't override server truth
    stripePaymentIntentId: extractString(sdk, 'stripePaymentIntentId') || undefined,
    stripeChargeId: extractString(sdk, 'stripeChargeId') || undefined,
    status: extractString(sdk, 'status') || 'PENDING',
    deliveryType: extractString(sdk, 'deliveryType') || 'DELIVERY',
    paymentStatus: extractString(sdk, 'paymentStatus') || 'PENDING',
    // Convert null to undefined for type compatibility
    addressSnapshot: sdk.addressSnapshot ?? undefined,
  } as OrderResponse
}

/**
 * Map SDK address data to frontend AddressResponse
 */
export function mapAddress(sdk: ListAddresses200ResponseDataInner): AddressResponse {
  const timestamps = extractTimestamps(sdk)
  const id = extractId(sdk, `address-${hasSdkId(sdk) ? sdk.id ?? 'unknown' : 'unknown'}`)
  
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
  const id = extractId(sdk, `bundle-${hasSdkId(sdk) ? sdk.id ?? 'unknown' : 'unknown'}`)
  
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
    storeId: extractString(sdk, 'storeId', ''),
    name: extractString(sdk, 'name', ''),
    description: extractString(sdk, 'description', ''),
    imageUrl: extractString(sdk, 'imageUrl', ''),
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
  const id = extractId(sdk, `cart-${hasSdkId(sdk) ? sdk.id ?? 'unknown' : 'unknown'}`)
  
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
  const id = extractId(sdk, `promotion-${hasSdkId(sdk) ? sdk.id ?? 'unknown' : 'unknown'}`)
  
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
  const id = extractId(sdk, `user-${hasSdkId(sdk) ? sdk.id ?? 'unknown' : 'unknown'}`)
  
  return {
    ...sdk,
    id,
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
    firstName: extractString(sdk, 'firstName') || undefined,
    lastName: extractString(sdk, 'lastName') || undefined,
  } as UserResponse
}

/**
 * Map SDK auth data to frontend AuthResponse
 * Note: AuthResponse is SDK-only type
 */
export function mapAuth(sdk: unknown): unknown {
  return sdk
}

/**
 * Map SDK payment intent data to frontend PaymentIntentResponse
 * Note: PaymentIntentResponse is SDK-only type
 */
export function mapPaymentIntent(sdk: unknown): unknown {
  return sdk
}

/**
 * Map SDK tip data to frontend TipResponse
 * Note: TipResponse is SDK-only type
 */
export function mapTip(sdk: unknown): unknown {
  return sdk
}

/**
 * Map SDK user public data to frontend UserPublicResponse
 * Note: UserPublicResponse is SDK-only type
 */
export function mapUserPublic(sdk: unknown): unknown {
  return sdk
}
