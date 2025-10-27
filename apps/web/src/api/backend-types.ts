/**
 * Type Mappers - SDK to Application Types
 * ⚠️  AUTO-GENERATED - DO NOT EDIT MANUALLY
 * Generated from: DTO schemas
 * 
 * To regenerate: pnpm gen:types
 */

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable unicorn/no-null */

import type {
  ListStores200ResponseDataInner,
  ListItems200ResponseDataInner,
  ListOrders200ResponseDataInner,
  ListAddresss200ResponseDataInner,
  ListBundles200ResponseDataInner,
  ListCarts200ResponseDataInner,
  ListPromotions200ResponseDataInner,
} from '@packages/sdk'

// ========================================
// Base Type Exports (From SDK)
// ========================================

export type StoreResponse = Omit<ListStores200ResponseDataInner, 'media'> & {
  id: string
  createdAt: string
  updatedAt: string
  deliveryFee: number
  minOrder: number
  distance?: number
  // Flattened address fields for convenience
  city?: string
  state?: string
  zipCode?: string
  // Override media field type from string to MediaItem[]
  media: MediaItem[]
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
  stripePaymentIntentId: string | null
  stripeChargeId: string | null
  store?: { id: string; name: string }
  items?: OrderItem[]
  addressSnapshot?: AddressSnapshot
  // Ensure required fields are always present
  status: string
  deliveryType: string
  paymentStatus: string
}

export type AddressResponse = ListAddresss200ResponseDataInner & {
  id: string
  createdAt: string
  updatedAt: string
  lat?: number
  lng?: number
}

// Alias for backward compatibility
export type Address = AddressResponse

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

export type CartResponse = ListCarts200ResponseDataInner & {
  id: string
  createdAt: string
  updatedAt: string
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

export interface MediaItem {
  type: 'youtube' | 'image' | 'video' | 'link'
  url: string
  thumbnail?: string
  title?: string
  provider?: string
  width?: number
  height?: number
}

// Note: Type aliases removed to avoid redundancy - use full type names

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
// Supporting Types
// ========================================

// Note: Cart alias removed to avoid redundancy - use CartResponse

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

export interface RiverComment {
  id: string
  postId: string
  userId: string
  userName: string
  userImage?: string
  content: string
  createdAt: string
  updatedAt: string
}

export interface RiverFilters {
  sortBy?: 'recent' | 'popular' | 'trending'
  hasMedia?: boolean
  storeId?: string
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

export interface UserResponse {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  name?: string  // Computed from firstName + lastName
  phone: string | null
  role: 'USER' | 'VENDOR' | 'ADMIN'
  createdAt: string
  updatedAt: string
}

export type User = UserResponse

export type PromotionResponse = ListPromotions200ResponseDataInner & {
  id: string
  createdAt: string
  updatedAt: string
}

export interface PostResponse {
  id: string
  storeId: string
  content: string
  mediaUrls: string[]
  createdAt: string
  updatedAt: string
  media: MediaItem[]
}

// ========================================
// StoreWithDistance
// ========================================

export interface StoreWithDistance extends StoreResponse {
  distance?: number
  // Media is already MediaItem[] from StoreResponse
}

// Alias for backward compatibility
export type Store = StoreResponse

// Event handler types
export type StoreClickHandler = (store: StoreResponse | StoreWithDistance) => void
export type ProductClickHandler = (item: ItemResponse) => void

// Utility functions
export function parseStore(store: unknown | StoreWithDistance): StoreResponse {
  if (!store || typeof store !== 'object') {
    throw new Error('Invalid store data')
  }
  
  // If it's already a StoreWithDistance, return it as StoreResponse
  if ('distance' in store && 'media' in store && Array.isArray(store.media)) {
    return store as StoreResponse
  }
  
  const storeObj = store as Record<string, unknown>
  
  return {
    ...storeObj,
    id: String(storeObj.id || ''),
    name: String(storeObj.name || ''),
    description: String(storeObj.description || ''),
    createdAt: String(storeObj.createdAt || new Date().toISOString()),
    updatedAt: String(storeObj.updatedAt || new Date().toISOString()),
    deliveryFee: Number(storeObj.deliveryFee || 0),
    minOrder: Number(storeObj.minOrder || 0),
    distance: storeObj.distance ? Number(storeObj.distance) : undefined,
    city: storeObj.city ? String(storeObj.city) : undefined,
    state: storeObj.state ? String(storeObj.state) : undefined,
    zipCode: storeObj.zipCode ? String(storeObj.zipCode) : undefined,
    media: Array.isArray(storeObj.media) ? storeObj.media as MediaItem[] : [],
    // Add other required fields
    isPublished: Boolean(storeObj.isPublished),
    prepTimeMin: Number(storeObj.prepTimeMin || 0),
    addressCity: storeObj.addressCity ? String(storeObj.addressCity) : undefined,
    addressState: storeObj.addressState ? String(storeObj.addressState) : undefined,
    addressZip: storeObj.addressZip ? String(storeObj.addressZip) : undefined,
    addressStreet: storeObj.addressStreet ? String(storeObj.addressStreet) : undefined,
    addressCountry: storeObj.addressCountry ? String(storeObj.addressCountry) : undefined,
    latitude: storeObj.latitude ? Number(storeObj.latitude) : undefined,
    longitude: storeObj.longitude ? Number(storeObj.longitude) : undefined,
    phone: storeObj.phone ? String(storeObj.phone) : undefined,
    email: storeObj.email ? String(storeObj.email) : undefined,
    companyName: storeObj.companyName ? String(storeObj.companyName) : undefined,
  } as unknown as StoreResponse
}

// ========================================
// Cart Types (already defined above as types)
// ========================================

export interface CartItemData {
  id: string
  cartId: string
  itemId: string
  item: ItemResponse
  currentItem?: ItemResponse  // Current item data
  quantity: number
  unitPrice: number
  titleSnapshot: string
  options?: Record<string, unknown>
  notes?: string | null
}

// ========================================
// Type Mappers (SDK → App Types) - Type-Safe
// ========================================

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

export function mapStore(sdk: ListStores200ResponseDataInner): StoreResponse {
  const timestamps = extractTimestamps(sdk)
  const id = extractId(sdk, 'store-' + Date.now())
  
  // Parse fees JSON
  const fees = parseJsonField(sdk, 'feesJson', {})
  const deliveryFee = extractNumber(fees, 'deliveryFee', 0)
  const minOrder = extractNumber(fees, 'minOrder', 0)
  
  // Parse media JSON
  const media = parseJsonField(sdk, 'media', [])
  
  return {
    ...sdk,
    id,
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
    deliveryFee,
    minOrder,
    media: Array.isArray(media) ? media as MediaItem[] : [],
    // Map address fields
    city: sdk.addressCity ?? undefined,
    state: sdk.addressState ?? undefined,
    zipCode: sdk.addressZip ?? undefined,
  }
}

export function mapItem(sdk: ListItems200ResponseDataInner): ItemResponse {
  const timestamps = extractTimestamps(sdk)
  const id = extractId(sdk, 'item-' + Date.now())
  
  return {
    ...sdk,
    id,
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  }
}

export function mapOrder(sdk: ListOrders200ResponseDataInner): OrderResponse {
  const timestamps = extractTimestamps(sdk)
  const id = extractId(sdk, 'order-' + Date.now())
  
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

export function mapAddress(sdk: ListAddresss200ResponseDataInner): AddressResponse {
  const timestamps = extractTimestamps(sdk)
  const id = extractId(sdk, 'address-' + Date.now())
  
  return {
    ...sdk,
    id,
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
    lat: extractNumber(sdk, 'lat'),
    lng: extractNumber(sdk, 'lng'),
  }
}

export function mapBundle(sdk: ListBundles200ResponseDataInner): Bundle {
  const timestamps = extractTimestamps(sdk)
  const id = extractId(sdk, 'bundle-' + Date.now())
  
  // Parse JSON strings from SDK
  const items = parseJsonField(sdk, 'items', [])
  const pricing = parseJsonField(sdk, 'pricing', {})
  
  // Transform items to include required fields
  const bundleItems: BundleItem[] = items.map((item: unknown, index: number) => {
    const itemData = item as Record<string, unknown>
    return {
      id: extractId(itemData, 'bundle-item-' + index),
      bundleId: id,
      itemId: extractId(itemData, 'itemId') ?? extractId(itemData, 'id'),
      quantity: extractNumber(itemData, 'quantity', 1),
      sortIndex: extractNumber(itemData, 'sortIndex', index),
      price: extractNumber(itemData, 'price'),
      title: typeof itemData.title === 'string' ? itemData.title : undefined,
    }
  })
  
  return {
    id,
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
    storeId: sdk.storeId,
    // store: sdk.store, // SDK store field is a string, not StoreResponse
    name: sdk.name,
    description: sdk.description,
    imageUrl: sdk.imageUrl,
    isActive: extractBoolean(sdk, 'isActive', false),
    sortIndex: extractNumber(sdk, 'sortIndex', 0),
    items: bundleItems,
    pricing: pricing as BundlePricing,
    // Calculate computed fields
    totalItems: bundleItems.length,
    individualPrice: bundleItems.reduce((sum, item) => sum + (item.price ?? 0), 0),
    bundlePrice: extractNumber(pricing, 'fixedPrice', 0),
    savings: 0, // Will be calculated based on pricing type
    savingsPercent: 0, // Will be calculated based on pricing type
  }
}

export function mapCart(sdk: ListCarts200ResponseDataInner): CartResponse {
  const timestamps = extractTimestamps(sdk)
  const id = extractId(sdk, 'cart-' + Date.now())
  
  return {
    ...sdk,
    id,
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  }
}

export function mapPromotion(sdk: ListPromotions200ResponseDataInner): PromotionResponse {
  const timestamps = extractTimestamps(sdk)
  const id = extractId(sdk, 'promotion-' + Date.now())
  
  return {
    ...sdk,
    id,
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  }
}

// Note: mapPost function removed - Posts API not available in SDK
