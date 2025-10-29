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
  ListUsers200ResponseDataInner,
  ListStores200ResponseDataInner,
  ListGeocodingCaches200ResponseDataInner,
  ListItems200ResponseDataInner,
  ListMediaAssets200ResponseDataInner,
  ListCarts200ResponseDataInner,
  ListCartItems200ResponseDataInner,
  ListOrders200ResponseDataInner,
  ListOrderItems200ResponseDataInner,
  ListOrderEvents200ResponseDataInner,
  ListTips200ResponseDataInner,
  ListAddresss200ResponseDataInner,
  ListSystemSettings200ResponseDataInner,
  ListPaymentWebhooks200ResponseDataInner,
  ListPaymentMethods200ResponseDataInner,
  ListPromotions200ResponseDataInner,
  ListPromotionRedemptions200ResponseDataInner,
  ListPosts200ResponseDataInner,
  ListPostLikes200ResponseDataInner,
  ListComments200ResponseDataInner,
  ListAffiliates200ResponseDataInner,
  ListCommissions200ResponseDataInner,
  ListAffiliatePayouts200ResponseDataInner,
  ListDeliveryZones200ResponseDataInner,
  ListVendorVerifications200ResponseDataInner,
  ListTeamMembers200ResponseDataInner,
  ListInvitations200ResponseDataInner,
  ListFavoriteStores200ResponseDataInner,
  ListFavoriteItems200ResponseDataInner,
  ListBundles200ResponseDataInner,
  ListBundleItems200ResponseDataInner,
  ListBundlePricings200ResponseDataInner
} from './types'

// ========================================
// Base Type Exports (From SDK)
// ========================================


export type UserResponse = ListUsers200ResponseDataInner & {
  id: string
  createdAt: string
  updatedAt: string
}

export type StoreResponse = ListStores200ResponseDataInner & {
  id: string
  createdAt: string
  updatedAt: string
  deliveryFee: number
  minOrder: number
  distance: number | undefined
}

export type GeocodingCacheResponse = ListGeocodingCaches200ResponseDataInner & {
  id: string
  createdAt: string
  updatedAt: string
}

export type ItemResponse = ListItems200ResponseDataInner & {
  id: string
  createdAt: string
  updatedAt: string
}

export type MediaAssetResponse = ListMediaAssets200ResponseDataInner & {
  id: string
  createdAt: string
  updatedAt: string
}

export type CartResponse = ListCarts200ResponseDataInner & {
  id: string
  createdAt: string
  updatedAt: string
}

export type CartItemResponse = ListCartItems200ResponseDataInner & {
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
  store: { id: string; name: string } | undefined
  items: OrderItem[] | undefined
  addressSnapshot: AddressSnapshot | undefined
}

export type OrderItemResponse = ListOrderItems200ResponseDataInner & {
  id: string
  createdAt: string
  updatedAt: string
}

export type OrderEventResponse = ListOrderEvents200ResponseDataInner & {
  id: string
  createdAt: string
  updatedAt: string
}

export type TipResponse = ListTips200ResponseDataInner & {
  id: string
  createdAt: string
  updatedAt: string
}

export type AddressResponse = ListAddresss200ResponseDataInner & {
  id: string
  createdAt: string
  updatedAt: string
}

export type SystemSettingResponse = ListSystemSettings200ResponseDataInner & {
  id: string
  createdAt: string
  updatedAt: string
}

export type PaymentWebhookResponse = ListPaymentWebhooks200ResponseDataInner & {
  id: string
  createdAt: string
  updatedAt: string
}

export type PaymentMethodResponse = ListPaymentMethods200ResponseDataInner & {
  id: string
  createdAt: string
  updatedAt: string
}

export type PromotionResponse = ListPromotions200ResponseDataInner & {
  id: string
  createdAt: string
  updatedAt: string
}

export type PromotionRedemptionResponse = ListPromotionRedemptions200ResponseDataInner & {
  id: string
  createdAt: string
  updatedAt: string
}

export type PostResponse = ListPosts200ResponseDataInner & {
  id: string
  createdAt: string
  updatedAt: string
}

export type PostLikeResponse = ListPostLikes200ResponseDataInner & {
  id: string
  createdAt: string
  updatedAt: string
}

export type CommentResponse = ListComments200ResponseDataInner & {
  id: string
  createdAt: string
  updatedAt: string
}

export type AffiliateResponse = ListAffiliates200ResponseDataInner & {
  id: string
  createdAt: string
  updatedAt: string
}

export type CommissionResponse = ListCommissions200ResponseDataInner & {
  id: string
  createdAt: string
  updatedAt: string
}

export type AffiliatePayoutResponse = ListAffiliatePayouts200ResponseDataInner & {
  id: string
  createdAt: string
  updatedAt: string
}

export type DeliveryZoneResponse = ListDeliveryZones200ResponseDataInner & {
  id: string
  createdAt: string
  updatedAt: string
}

export type VendorVerificationResponse = ListVendorVerifications200ResponseDataInner & {
  id: string
  createdAt: string
  updatedAt: string
}

export type TeamMemberResponse = ListTeamMembers200ResponseDataInner & {
  id: string
  createdAt: string
  updatedAt: string
}

export type InvitationResponse = ListInvitations200ResponseDataInner & {
  id: string
  createdAt: string
  updatedAt: string
}

export type FavoriteStoreResponse = ListFavoriteStores200ResponseDataInner & {
  id: string
  createdAt: string
  updatedAt: string
}

export type FavoriteItemResponse = ListFavoriteItems200ResponseDataInner & {
  id: string
  createdAt: string
  updatedAt: string
}

export type BundleResponse = ListBundles200ResponseDataInner & {
  id: string
  createdAt: string
  updatedAt: string
  totalItems: number
  individualPrice: number
  bundlePrice: number
  savings: number
  savingsPercent: number
}

export type BundleItemResponse = ListBundleItems200ResponseDataInner & {
  id: string
  createdAt: string
  updatedAt: string
}

export type BundlePricingResponse = ListBundlePricings200ResponseDataInner & {
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

export function mapUser(sdk: ListUsers200ResponseDataInner): UserResponse {
  const timestamps = extractTimestamps(sdk)
  const id = extractId(sdk, 'user-' + Date.now())

  return {
    ...sdk,
    id,
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  }
}


export function mapStore(sdk: ListStores200ResponseDataInner): StoreResponse {
  const timestamps = extractTimestamps(sdk)
  const id = extractId(sdk, 'store-' + Date.now())

  return {
    ...sdk,
    id,
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
    deliveryFee: extractNumber(sdk, 'deliveryFee'),
    minOrder: extractNumber(sdk, 'minOrder'),
    distance: extractNumber(sdk, 'distance'),
  }
}


export function mapGeocodingCache(sdk: ListGeocodingCaches200ResponseDataInner): GeocodingCacheResponse {
  const timestamps = extractTimestamps(sdk)
  const id = extractId(sdk, 'geocodingcache-' + Date.now())

  return {
    ...sdk,
    id,
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
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


export function mapMediaAsset(sdk: ListMediaAssets200ResponseDataInner): MediaAssetResponse {
  const timestamps = extractTimestamps(sdk)
  const id = extractId(sdk, 'mediaasset-' + Date.now())

  return {
    ...sdk,
    id,
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
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


export function mapCartItem(sdk: ListCartItems200ResponseDataInner): CartItemResponse {
  const timestamps = extractTimestamps(sdk)
  const id = extractId(sdk, 'cartitem-' + Date.now())

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
    stripePaymentIntentId: sdk.stripePaymentIntentId ?? '',
    stripeChargeId: sdk.stripeChargeId ?? '',
    store: sdk.store ?? '',
    items: sdk.items,
    addressSnapshot: sdk.addressSnapshot,
  }
}


export function mapOrderItem(sdk: ListOrderItems200ResponseDataInner): OrderItemResponse {
  const timestamps = extractTimestamps(sdk)
  const id = extractId(sdk, 'orderitem-' + Date.now())

  return {
    ...sdk,
    id,
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  }
}


export function mapOrderEvent(sdk: ListOrderEvents200ResponseDataInner): OrderEventResponse {
  const timestamps = extractTimestamps(sdk)
  const id = extractId(sdk, 'orderevent-' + Date.now())

  return {
    ...sdk,
    id,
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  }
}


export function mapTip(sdk: ListTips200ResponseDataInner): TipResponse {
  const timestamps = extractTimestamps(sdk)
  const id = extractId(sdk, 'tip-' + Date.now())

  return {
    ...sdk,
    id,
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  }
}


export function mapAddress(sdk: ListAddresss200ResponseDataInner): AddressResponse {
  const timestamps = extractTimestamps(sdk)
  const id = extractId(sdk, 'address-' + Date.now())

  return {
    ...sdk,
    id,
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  }
}


export function mapSystemSetting(sdk: ListSystemSettings200ResponseDataInner): SystemSettingResponse {
  const timestamps = extractTimestamps(sdk)
  const id = extractId(sdk, 'systemsetting-' + Date.now())

  return {
    ...sdk,
    id,
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  }
}


export function mapPaymentWebhook(sdk: ListPaymentWebhooks200ResponseDataInner): PaymentWebhookResponse {
  const timestamps = extractTimestamps(sdk)
  const id = extractId(sdk, 'paymentwebhook-' + Date.now())

  return {
    ...sdk,
    id,
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  }
}


export function mapPaymentMethod(sdk: ListPaymentMethods200ResponseDataInner): PaymentMethodResponse {
  const timestamps = extractTimestamps(sdk)
  const id = extractId(sdk, 'paymentmethod-' + Date.now())

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


export function mapPromotionRedemption(sdk: ListPromotionRedemptions200ResponseDataInner): PromotionRedemptionResponse {
  const timestamps = extractTimestamps(sdk)
  const id = extractId(sdk, 'promotionredemption-' + Date.now())

  return {
    ...sdk,
    id,
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  }
}


export function mapPost(sdk: ListPosts200ResponseDataInner): PostResponse {
  const timestamps = extractTimestamps(sdk)
  const id = extractId(sdk, 'post-' + Date.now())

  return {
    ...sdk,
    id,
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  }
}


export function mapPostLike(sdk: ListPostLikes200ResponseDataInner): PostLikeResponse {
  const timestamps = extractTimestamps(sdk)
  const id = extractId(sdk, 'postlike-' + Date.now())

  return {
    ...sdk,
    id,
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  }
}


export function mapComment(sdk: ListComments200ResponseDataInner): CommentResponse {
  const timestamps = extractTimestamps(sdk)
  const id = extractId(sdk, 'comment-' + Date.now())

  return {
    ...sdk,
    id,
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  }
}


export function mapAffiliate(sdk: ListAffiliates200ResponseDataInner): AffiliateResponse {
  const timestamps = extractTimestamps(sdk)
  const id = extractId(sdk, 'affiliate-' + Date.now())

  return {
    ...sdk,
    id,
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  }
}


export function mapCommission(sdk: ListCommissions200ResponseDataInner): CommissionResponse {
  const timestamps = extractTimestamps(sdk)
  const id = extractId(sdk, 'commission-' + Date.now())

  return {
    ...sdk,
    id,
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  }
}


export function mapAffiliatePayout(sdk: ListAffiliatePayouts200ResponseDataInner): AffiliatePayoutResponse {
  const timestamps = extractTimestamps(sdk)
  const id = extractId(sdk, 'affiliatepayout-' + Date.now())

  return {
    ...sdk,
    id,
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  }
}


export function mapDeliveryZone(sdk: ListDeliveryZones200ResponseDataInner): DeliveryZoneResponse {
  const timestamps = extractTimestamps(sdk)
  const id = extractId(sdk, 'deliveryzone-' + Date.now())

  return {
    ...sdk,
    id,
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  }
}


export function mapVendorVerification(sdk: ListVendorVerifications200ResponseDataInner): VendorVerificationResponse {
  const timestamps = extractTimestamps(sdk)
  const id = extractId(sdk, 'vendorverification-' + Date.now())

  return {
    ...sdk,
    id,
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  }
}


export function mapTeamMember(sdk: ListTeamMembers200ResponseDataInner): TeamMemberResponse {
  const timestamps = extractTimestamps(sdk)
  const id = extractId(sdk, 'teammember-' + Date.now())

  return {
    ...sdk,
    id,
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  }
}


export function mapInvitation(sdk: ListInvitations200ResponseDataInner): InvitationResponse {
  const timestamps = extractTimestamps(sdk)
  const id = extractId(sdk, 'invitation-' + Date.now())

  return {
    ...sdk,
    id,
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  }
}


export function mapFavoriteStore(sdk: ListFavoriteStores200ResponseDataInner): FavoriteStoreResponse {
  const timestamps = extractTimestamps(sdk)
  const id = extractId(sdk, 'favoritestore-' + Date.now())

  return {
    ...sdk,
    id,
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  }
}


export function mapFavoriteItem(sdk: ListFavoriteItems200ResponseDataInner): FavoriteItemResponse {
  const timestamps = extractTimestamps(sdk)
  const id = extractId(sdk, 'favoriteitem-' + Date.now())

  return {
    ...sdk,
    id,
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  }
}


export function mapBundle(sdk: ListBundles200ResponseDataInner): BundleResponse {
  const timestamps = extractTimestamps(sdk)
  const id = extractId(sdk, 'bundle-' + Date.now())

  return {
    ...sdk,
    id,
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
    totalItems: extractNumber(sdk, 'totalItems'),
    individualPrice: extractNumber(sdk, 'individualPrice'),
    bundlePrice: extractNumber(sdk, 'bundlePrice'),
    savings: extractNumber(sdk, 'savings'),
    savingsPercent: extractNumber(sdk, 'savingsPercent'),
  }
}


export function mapBundleItem(sdk: ListBundleItems200ResponseDataInner): BundleItemResponse {
  const timestamps = extractTimestamps(sdk)
  const id = extractId(sdk, 'bundleitem-' + Date.now())

  return {
    ...sdk,
    id,
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  }
}


export function mapBundlePricing(sdk: ListBundlePricings200ResponseDataInner): BundlePricingResponse {
  const timestamps = extractTimestamps(sdk)
  const id = extractId(sdk, 'bundlepricing-' + Date.now())

  return {
    ...sdk,
    id,
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  }
}
