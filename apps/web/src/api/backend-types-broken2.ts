/**
 * Clean Backend Types - Core Type Definitions
 * ⚠️  AUTO-GENERATED - DO NOT EDIT MANUALLY
 * Generated from: Resource configurations (100% schema-driven)
 * 
 * To regenerate: pnpm gen:types
 */

/* eslint-disable unicorn/no-null */

import type {
  StoreResponse as ListStores200ResponseDataInner,
  ItemResponse as ListItems200ResponseDataInner,
  OrderResponse as ListOrders200ResponseDataInner,
  AddressResponse as ListAddresss200ResponseDataInner,
  BundleResponse as ListBundles200ResponseDataInner,
  CartResponse as ListCarts200ResponseDataInner,
  PromotionResponse as ListPromotions200ResponseDataInner,
  UserResponse as ListUsers200ResponseDataInner
} from './generated/generated-types'

// ========================================
// Core Response Types (Direct Aliases)
// ========================================

export type StoreResponse = ListStores200ResponseDataInner
export type ItemResponse = ListItems200ResponseDataInner
export type OrderResponse = ListOrders200ResponseDataInner
export type AddressResponse = ListAddresss200ResponseDataInner
export type Bundle = ListBundles200ResponseDataInner
export type CartResponse = ListCarts200ResponseDataInner
export type PromotionResponse = ListPromotions200ResponseDataInner
export type UserResponse = ListUsers200ResponseDataInner

// ========================================
// Extended Types with Computed Fields
// ========================================

export interface StoreWithDistance {
  id: string
  createdAt: string
  updatedAt: string
  deliveryFee: number
  minOrder: number
  distance?: number
  // Add other store fields as needed
}

export interface ItemWithStore {
  id: string
  createdAt: string
  updatedAt: string
  name: string
  price: number
  storeId: string
  store?: StoreResponse
  // Add other item fields as needed
}

export interface OrderWithDetails {
  id: string
  createdAt: string
  updatedAt: string
  status: string
  total: number
  user?: UserResponse
  store?: StoreResponse
  items?: OrderItem[]
  // Add other order fields as needed
}

export interface OrderItem {
  id: string
  itemId: string
  orderId: string
  quantity: number
  price: number
  item?: ItemResponse
}

export interface CartWithTotals {
  id: string
  createdAt: string
  updatedAt: string
  userId: string
  storeId: string
  total: number
  subtotal: number
  tax: number
  deliveryFee: number
  items: CartItem[]
  user?: UserResponse
  store?: StoreResponse
  status?: string
  note?: string
  order?: OrderResponse
}

export interface CartItem {
  id: string
  cartId: string
  itemId: string
  quantity: number
  price: number
  item?: ItemResponse
}

export interface BundleItem {
  id: string
  bundleId: string
  itemId: string
  sortIndex?: number
  item?: ItemResponse
}

export interface BundlePricing {
  id: string
  bundleId: string
  type: 'FIXED_PRICE' | 'DISCOUNT_PERCENT' | 'DISCOUNT_AMOUNT' | 'BEST_DEAL'
  value: number
}

// ========================================
// Address Types
// ========================================

export interface AddressSnapshot {
  id: string
  line1: string
  line2?: string | null
  city: string
  state: string
  zip: string
  country: string
  latitude?: number | null
  longitude?: number | null
}

// ========================================
// Media Types
// ========================================

export interface MediaResponse {
  id: string
  url: string
  type: string
  size: number
  createdAt: string
  updatedAt: string
}

export interface MediaItem {
  id: string
  url: string
  type: string
  size: number
  createdAt: string
  updatedAt: string
}

// ========================================
// Post Types
// ========================================

export interface PostResponse {
  id: string
  content: string
  mediaUrls: string[]
  likesCount: number | null
  commentsCount: number | null
  sharesCount: number | null
  createdAt: string
  updatedAt: string
  author?: UserResponse
}

export interface CommentResponse {
  id: string
  content: string
  postId: string
  authorId: string
  createdAt: string
  updatedAt: string
  author?: UserResponse
  post?: PostResponse
}

// ========================================
// Bundle Pricing Type
// ========================================

export type BundlePricingType = 'FIXED_PRICE' | 'DISCOUNT_PERCENT' | 'DISCOUNT_AMOUNT' | 'BEST_DEAL'

// ========================================
// Update Input Types
// ========================================

export interface UpdatePostInput {
  content?: string | null
  mediaUrls?: Record<string, unknown>
}

// ========================================
// Cart Item Data (for backward compatibility)
// ========================================

export interface CartItemData {
  id: string
  cartId: string
  itemId: string
  quantity: number
  price: number
  item?: ItemResponse
}

// ========================================
// Type Mappers (Simplified)
// ========================================

export function mapStore(sdk: ListStores200ResponseDataInner): StoreResponse {
  return sdk
}

export function mapItem(sdk: ListItems200ResponseDataInner): ItemResponse {
  return sdk
}

export function mapOrder(sdk: ListOrders200ResponseDataInner): OrderResponse {
  return sdk
}

export function mapAddress(sdk: ListAddresss200ResponseDataInner): AddressResponse {
  return sdk
}

export function mapBundle(sdk: ListBundles200ResponseDataInner): Bundle {
  return sdk
}

export function mapCart(sdk: ListCarts200ResponseDataInner): CartResponse {
  return sdk
}

export function mapPromotion(sdk: ListPromotions200ResponseDataInner): PromotionResponse {
  return sdk
}

export function mapUser(sdk: ListUsers200ResponseDataInner): UserResponse {
  return sdk
}

// ========================================
// Utility Functions
// ========================================

export function calculateCartTotals(cart: CartResponse): {
  subtotal: number
  tax: number
  deliveryFee: number
  total: number
} {
  const subtotal = 0 // Calculate from cart items
  const tax = subtotal * 0.08 // 8% tax
  const deliveryFee = 0 // Default delivery fee
  const total = subtotal + tax + deliveryFee

  return { subtotal, tax, deliveryFee, total }
}

export function parseStore(store: any): StoreResponse {
  return {
    ...store,
    // Parse any JSON fields if needed
  }
}
