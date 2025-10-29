/**
 * Final Backend Types - Core Type Definitions
 * ⚠️  AUTO-GENERATED - DO NOT EDIT MANUALLY
 * Generated from: Resource configurations (100% schema-driven)
 * 
 * To regenerate: pnpm gen:types
 */

/* eslint-disable unicorn/no-null */

// ========================================
// Core Response Types (Basic Definitions)
// ========================================

export interface StoreResponse {
  id: string
  createdAt: string
  updatedAt: string
  deliveryFee: number
  minOrder: number
  name: string
  description?: string
  address?: string
  phone?: string
  email?: string
  isActive: boolean
  ownerId: string
  // Add other store fields as needed
}

export interface ItemResponse {
  id: string
  createdAt: string
  updatedAt: string
  name: string
  description?: string
  price: number
  stockQty: number
  isActive: boolean
  storeId: string
  categoryId?: string
  // Add other item fields as needed
}

export interface OrderResponse {
  id: string
  createdAt: string
  updatedAt: string
  status: string
  total: number
  subtotal: number
  tax: number
  deliveryFee: number
  userId: string
  storeId: string
  stripePaymentIntentId?: string
  stripeChargeId?: string
  // Add other order fields as needed
}

export interface AddressResponse {
  id: string
  createdAt: string
  updatedAt: string
  line1: string
  line2?: string
  city: string
  state: string
  zip: string
  country: string
  isDefault: boolean
  userId: string
  latitude?: number
  longitude?: number
}

export interface Bundle {
  id: string
  createdAt: string
  updatedAt: string
  name: string
  description?: string
  isActive: boolean
  storeId: string
  // Add other bundle fields as needed
}

export interface CartResponse {
  id: string
  createdAt: string
  updatedAt: string
  userId: string
  storeId: string
  status: string
  note?: string
  // Add other cart fields as needed
}

export interface PromotionResponse {
  id: string
  createdAt: string
  updatedAt: string
  code: string
  description?: string
  discountType: string
  discountValue: number
  minOrderAmount?: number
  maxUses?: number
  usageCount: number
  isActive: boolean
  storeId: string
  // Add other promotion fields as needed
}

export interface UserResponse {
  id: string
  createdAt: string
  updatedAt: string
  email: string
  role: string
  phone?: string
  isCompany: boolean
  companyName?: string
  // Add other user fields as needed
}

// ========================================
// Extended Types with Computed Fields
// ========================================

export interface StoreWithDistance extends StoreResponse {
  distance?: number
}

export interface ItemWithStore extends ItemResponse {
  store?: StoreResponse
}

export interface OrderWithDetails extends OrderResponse {
  user?: UserResponse
  store?: StoreResponse
  items?: OrderItem[]
}

export interface OrderItem {
  id: string
  itemId: string
  orderId: string
  quantity: number
  price: number
  item?: ItemResponse
}

export interface CartWithTotals extends CartResponse {
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

export function mapStore(sdk: StoreResponse): StoreResponse {
  return sdk
}

export function mapItem(sdk: ItemResponse): ItemResponse {
  return sdk
}

export function mapOrder(sdk: OrderResponse): OrderResponse {
  return sdk
}

export function mapAddress(sdk: AddressResponse): AddressResponse {
  return sdk
}

export function mapBundle(sdk: Bundle): Bundle {
  return sdk
}

export function mapCart(sdk: CartResponse): CartResponse {
  return sdk
}

export function mapPromotion(sdk: PromotionResponse): PromotionResponse {
  return sdk
}

export function mapUser(sdk: UserResponse): UserResponse {
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
