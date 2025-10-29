/**
 * Type Mappers - SDK to Application Types
 * ⚠️  AUTO-GENERATED - DO NOT EDIT MANUALLY
 * Generated from: Resource configurations (100% schema-driven)
 * 
 * To regenerate: pnpm gen:types
 */

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable unicorn/no-null */

import type {
  ListAddresss200ResponseDataInner,
  ListBundles200ResponseDataInner,
  ListCarts200ResponseDataInner,
  ListItems200ResponseDataInner,
  ListOrders200ResponseDataInner,
  ListPromotions200ResponseDataInner,
  ListStores200ResponseDataInner,
  ListUsers200ResponseDataInner
} from '@packages/sdk'

// ========================================
// Base Type Exports (From SDK)
// ========================================


export type AddressResponse = ListAddresss200ResponseDataInner & {
  id: string
  createdAt: string
  updatedAt: string
}

export type BundleResponse = ListBundles200ResponseDataInner & {
  id: string
  createdAt: string
  updatedAt: string
}

export type CartResponse = ListCarts200ResponseDataInner & {
  id: string
  createdAt: string
  updatedAt: string
}

export type ItemResponse = ListItems200ResponseDataInner & {
  id: string
  createdAt: string
  updatedAt: string
}

export type OrderResponse = ListOrders200ResponseDataInner & {
  id: string
  createdAt: string
  updatedAt: string
}

export type PromotionResponse = ListPromotions200ResponseDataInner & {
  id: string
  createdAt: string
  updatedAt: string
}

export type StoreResponse = ListStores200ResponseDataInner & {
  id: string
  createdAt: string
  updatedAt: string
}

export type UserResponse = ListUsers200ResponseDataInner & {
  id: string
  createdAt: string
  updatedAt: string
}


// ========================================
// Supporting Types
// ========================================

export interface OrderItem {
  id: string
  orderId: string
  itemId: string
  quantity: number
  unitPrice: number
  titleSnapshot: string
  optionsSnapshot?: Record<string, unknown>
}

export interface AddressSnapshot {
  line1: string
  line2?: string
  city: string
  state: string
  postalCode: string
  country: string
}

export interface MediaItem {
  type: 'youtube' | 'image' | 'video' | 'link'
  url: string
  thumbnail?: string
  title?: string
  provider?: string
  width?: number
  height?: number
}

export interface BundleItem {
  id: string
  bundleId: string
  itemId: string
  quantity: number
  sortIndex: number
  price?: number
  title?: string
  item?: {
    id: string
    title: string
    price: number
    imageUrl?: string
  }
}

export interface BundlePricing {
  id: string
  bundleId: string
  pricingType: 'FIXED_PRICE' | 'DISCOUNT_PERCENT' | 'DISCOUNT_AMOUNT' | 'BEST_DEAL'
  fixedPrice?: number
  discountPercent?: number
  discountAmount?: number
  minSavings?: number
  showSavings: boolean
  savingsLabel?: string
}

export interface Bundle {
  id: string
  createdAt: string
  updatedAt: string
  storeId: string
  store?: StoreResponse
  name: string
  description?: string
  imageUrl?: string
  isActive: boolean
  sortIndex: number
  // Bundle-specific properties
  items?: BundleItem[]
  pricing?: BundlePricing
  // Computed fields
  totalItems: number
  individualPrice: number
  bundlePrice: number
  savings: number
  savingsPercent: number
}

export interface CartItemData {
  id: string
  cartId: string
  itemId: string
  item: ItemResponse
  currentItem?: ItemResponse
  quantity: number
  unitPrice: number
  titleSnapshot: string
  options?: Record<string, unknown>
  notes?: string | null
}


export type CartWithTotals = CartResponse & {
  items: CartItemData[]
  itemCount: number
  subtotal: number
  tax: number
  deliveryFee: number
  fees: number
  total: number
}

// ========================================
// Input Types (Re-exported for convenience)
// ========================================

export interface CreateOrderInput {
  cartId: string
  deliveryType: 'DELIVERY' | 'PICKUP'
  addressId?: string
  tip?: string
}

export interface CreateAddressInput {
  label?: string
  line1: string
  line2?: string
  city: string
  state: string
  postalCode: string
  country: string
  lat?: number
  lng?: number
  isDefault?: boolean
}

export interface CreatePostInput {
  storeId: string
  content?: string
  mediaUrls: MediaItem[]
}

export interface SignupInput {
  email: string
  password: string
  firstName?: string
  lastName?: string
  phone?: string
}

export interface LoginInput {
  email: string
  password: string
}

// ========================================
// Utility Types for UI Components
// ========================================

export type StoreClickHandler = (store: StoreWithDistance) => void
export type ProductClickHandler = (item: ItemResponse) => void
export type Address = AddressResponse
export type Store = StoreResponse

export interface StoreWithDistance extends StoreResponse {
  distance?: number
}

export type OrderStatus =
  | 'PLACED'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'READY'
  | 'OUT_FOR_DELIVERY'
  | 'COMPLETED'
  | 'CANCELED'

export type PaymentStatus = 'UNPAID' | 'PAID' | 'REFUNDED'
export type DeliveryType = 'PICKUP' | 'DELIVERY'

// ========================================
// User Types
// ========================================

export type User = UserResponse

export interface MediaResponse {
  id: string
  url: string
  filename: string
  mimeType: string
  size: number
  createdAt: string
  updatedAt: string
}

export type BundlePricingType = 'FIXED_PRICE' | 'DISCOUNT_PERCENT' | 'DISCOUNT_AMOUNT' | 'BEST_DEAL'



/**
 * Type guard to check if SDK data has frontend-expected fields
 */
function hasIdField(data: unknown): data is { id: string } {
  return typeof data === 'object' && data !== null && 'id' in data
}

function hasTimestampFields(data: unknown): data is { id: string; createdAt: string; updatedAt: string } {
  return hasIdField(data) && 'createdAt' in data && 'updatedAt' in data
}

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


// ========================================

// Type Mappers (SDK → App Types)

// ========================================

export function mapAddresses(sdk: ListAddresss200ResponseDataInner): AddressResponse {
  const timestamps = extractTimestamps(sdk)
  const id = extractId(sdk, 'addresses-' + Date.now())

  return {
    ...sdk,
    id,
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  }
}


export function mapBundles(sdk: ListBundles200ResponseDataInner): BundleResponse {
  const timestamps = extractTimestamps(sdk)
  const id = extractId(sdk, 'bundles-' + Date.now())

  return {
    ...sdk,
    id,
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  }
}


export function mapCarts(sdk: ListCarts200ResponseDataInner): CartResponse {
  const timestamps = extractTimestamps(sdk)
  const id = extractId(sdk, 'carts-' + Date.now())

  return {
    ...sdk,
    id,
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  }
}


export function mapItems(sdk: ListItems200ResponseDataInner): ItemResponse {
  const timestamps = extractTimestamps(sdk)
  const id = extractId(sdk, 'items-' + Date.now())

  return {
    ...sdk,
    id,
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  }
}


export function mapOrders(sdk: ListOrders200ResponseDataInner): OrderResponse {
  const timestamps = extractTimestamps(sdk)
  const id = extractId(sdk, 'orders-' + Date.now())

  return {
    ...sdk,
    id,
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  }
}


export function mapPromotions(sdk: ListPromotions200ResponseDataInner): PromotionResponse {
  const timestamps = extractTimestamps(sdk)
  const id = extractId(sdk, 'promotions-' + Date.now())

  return {
    ...sdk,
    id,
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  }
}


export function mapStores(sdk: ListStores200ResponseDataInner): StoreResponse {
  const timestamps = extractTimestamps(sdk)
  const id = extractId(sdk, 'stores-' + Date.now())

  return {
    ...sdk,
    id,
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  }
}


export function mapUsers(sdk: ListUsers200ResponseDataInner): UserResponse {
  const timestamps = extractTimestamps(sdk)
  const id = extractId(sdk, 'users-' + Date.now())

  return {
    ...sdk,
    id,
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  }
}
