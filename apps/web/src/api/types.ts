// @ts-nocheck
/**
 * Centralized Type Library - SDK-First Architecture
 * All type imports should go through this file
 * 
 * This file now uses the centralized type management system for:
 * 1. Single point of change for SDK updates
 * 2. Automatic conflict resolution
 * 3. Type safety and validation
 * 4. Developer velocity improvements
 */

// ============================================
// Centralized Type Management
// ============================================
// All SDK types are managed through the centralized system
export * from './types/centralized'

// ============================================
// Safe Utility Types (Consolidated from backend-types)
// ============================================
export type {
  ApiSuccessResponse,
  ApiErrorResponse,
  LoadingState,
  AsyncState,
  PaginationMeta,
  PaginatedResponse,
  FormState,
  ValidationState,
  FormFieldState,
  SearchParams,
  SearchResult,
  ModalState,
  ConfirmDialogState,
  Theme,
  ColorScheme,
  Size,
  Variant,
  Optional,
  RequiredFields,
  DeepPartial
} from './backend-types'

export * from '@shared/types/types/extensions'

// ============================================
// SDK-Based Form Types
// ============================================

// Store Form Types
export interface StoreFormData {
  name: string
  slug: string
  description: string
  companyName: string
  taxId: string
  phone: string
  email: string
  website: string
  isPublished: boolean
  deliveryEnabled: boolean
  pickupEnabled: boolean
  prepTimeMin: number
  deliveryDistance: string
  deliveryCharge: string
  latitude: string
  longitude: string
  addressStreet: string
  addressCity: string
  addressState: string
  addressZip: string
  addressCountry: string
  commissionRate?: string
}

export interface StoreUpdateFormData {
  name: string
  slug: string
  description: string
  companyName: string
  taxId: string
  phone: string
  email: string
  website: string
  isPublished: boolean
  deliveryEnabled: boolean
  pickupEnabled: boolean
  prepTimeMin: number
  deliveryDistance: string
  deliveryCharge: string
  latitude: string
  longitude: string
  addressStreet: string
  addressCity: string
  addressState: string
  addressZip: string
  addressCountry: string
  commissionRate?: string
}

// Item Form Types
export interface ItemFormData {
  name: string
  description: string
  price: string
  category: string
  isAvailable: boolean
  isFeatured: boolean
  prepTimeMin: number
  imageUrl?: string
  tags: string[]
  allergens: string[]
  nutritionInfo?: string
  ingredients?: string
  storeId: string
}

export interface ItemUpdateFormData {
  name: string
  description: string
  price: string
  category: string
  isAvailable: boolean
  isFeatured: boolean
  prepTimeMin: number
  imageUrl?: string
  tags: string[]
  allergens: string[]
  nutritionInfo?: string
  ingredients?: string
}

// Address Form Types
export interface AddressFormData {
  street: string
  city: string
  state: string
  zip: string
  country: string
  isDefault: boolean
  label?: string
  instructions?: string
}

export interface AddressUpdateFormData {
  street: string
  city: string
  state: string
  zip: string
  country: string
  isDefault: boolean
  label?: string
  instructions?: string
}

// Order Form Types
export interface OrderFormData {
  storeId: string
  items: {
    itemId: string
    quantity: number
    specialInstructions?: string
  }[]
  deliveryAddressId?: string
  deliveryType: 'delivery' | 'pickup'
  paymentMethod: string
  tipAmount?: string
  specialInstructions?: string
}

// Bundle Form Types
export interface BundleFormData {
  name: string
  description: string
  items: {
    itemId: string
    quantity: number
  }[]
  price: string
  discountPercentage?: string
  isActive: boolean
  storeId: string
}

export interface BundleUpdateFormData {
  name: string
  description: string
  items: {
    itemId: string
    quantity: number
  }[]
  price: string
  discountPercentage?: string
  isActive: boolean
}

// ============================================
// Component Props (Generic)
// ============================================
export * from '@shared/types'

// ============================================
// API Types (Generic)
// ============================================
// API types are now managed through the centralized system

// ============================================
// Core SDK Types (Schema-Derived)
// ============================================
export type {
  StoreResponse,
  UserResponse,
  OrderResponse,
  ItemResponse,
  AddressResponse,
  CartResponse,
  PromotionResponse,
  MediaItem,
  StoreWithDistance,
  OrderItem,
  AddressSnapshot,
  CartItemData,
  CartWithTotals,
  OrderStatus,
  PaymentStatus,
  DeliveryType
} from './backend-types'

export type UpdateOrderRequestStatusEnum = import('./backend-types').OrderStatus

export interface RiverPost {
  id: string
  storeId: string
  content?: string
  mediaUrls?: import('./backend-types').MediaItem[]
  media?: import('./backend-types').MediaItem[]
  createdAt?: string
  updatedAt?: string
  likesCount?: number
  commentsCount?: number
  sharesCount?: number
  isLiked?: boolean
  store?: import('./backend-types').StoreResponse
  storeName?: string
  storeImage?: string
}

export interface RiverComment {
  id: string
  postId: string
  content: string
  authorId: string
  authorName?: string
  userName?: string
  userImage?: string
  createdAt?: string
  updatedAt?: string
}

// ============================================
// Generated Types (Schema-Derived)
// ============================================
import type {
  PostResponse as GeneratedPostResponse,
  CommentResponse as GeneratedCommentResponse,
  MediaResponse as GeneratedMediaResponse,
  CreatePostInput as GeneratedCreatePostInput,
  CreateCommentInput as GeneratedCreateCommentInput,
  LikePostInput as GeneratedLikePostInput,
  UnlikePostInput as GeneratedUnlikePostInput,
  UploadMediaInput as GeneratedUploadMediaInput,
  PostQuery as GeneratedPostQuery,
  CommentQuery as GeneratedCommentQuery,
  PostListResponse as GeneratedPostListResponse,
  CommentListResponse as GeneratedCommentListResponse,
  MediaListResponse as GeneratedMediaListResponse
} from './backend-types'

export type PostResponse = GeneratedPostResponse
export type CommentResponse = GeneratedCommentResponse
export type MediaResponse = GeneratedMediaResponse
export type CreatePostInput = GeneratedCreatePostInput
export type CreateCommentInput = GeneratedCreateCommentInput
export type LikePostInput = GeneratedLikePostInput
export type UnlikePostInput = GeneratedUnlikePostInput
export type UploadMediaInput = GeneratedUploadMediaInput
export type PostQuery = GeneratedPostQuery
export type CommentQuery = GeneratedCommentQuery
export type PostListResponse = GeneratedPostListResponse
export type CommentListResponse = GeneratedCommentListResponse
export type MediaListResponse = GeneratedMediaListResponse

// Schema-driven types - using local definitions until module resolution is fixed
export type BundlePricingType = 'FIXED_PRICE' | 'DISCOUNT_PERCENT' | 'DISCOUNT_AMOUNT' | 'BEST_DEAL'
export interface UpdatePostInput {
  content?: string | null
  mediaUrls?: Record<string, unknown>
}

// ============================================
// Authentication & User Types
// ============================================

// ============================================
// Frontend Extensions (Computed Fields)
// ============================================
export type {
  StoreWithLocation,
  StoreWithFees,
  StoreWithRating,
  UserWithName,
  UserWithRole,
  OrderWithDetails,
  OrderWithDelivery,
  ItemWithStore,
  ItemWithPricing,
  AddressWithCoordinates,
  PostWithEngagement,
  PostWithMedia,
  CommentWithUser,
  EntityWithComputed,
  PaginatedWithComputed,
  SearchResultWithRelevance
} from '@shared/types/types/extensions'

// ============================================
// Component-Specific Types
// ============================================

export interface RiverFilters {
  storeId?: string
  dateRange?: {
    start: string
    end: string
  }
  mediaOnly?: boolean
  // Additional properties for compatibility
  sortBy?: string
  hasMedia?: boolean
}

// ============================================
// Product Types
// ============================================

// ============================================
// Input Types (Schema-Derived)
// ============================================
export type {
  CreateStoreInput,
  CreateItemInput,
  CreateAddressInput,
  CreatePromotionInput,
  CreateTipInput,
  UpdateStoreInput,
  UpdateItemInput,
  UpdateOrderInput,
  UpdateAddressInput,
  UpdatePromotionInput,
  UpdateUserInput,
  LoginInput,
  SignupInput,
  AddToCartInput,
  UpdateCartInput,
  CreatePaymentIntentInput,
  CreateUserInput,
  UpdateTipInput,
  ProcessTipInput,
  TipStatusUpdate,
  CreateConnectAccountInput
} from './backend-types'


// ============================================
// Supporting Types
// ============================================
/** Store with address details */
export interface StoreAddress {
  street: string
  city: string
  state: string
  zip: string
  country?: string
}

// ============================================
// Sorting & Filtering
// ============================================
export type StoreSortOption = 'distance' | 'name' | 'rating'
export type OrderSortOption = 'date' | 'status' | 'total'
export type ItemSortOption = 'name' | 'price' | 'category'

// ============================================
// List Item Types (Clean Names)
// ============================================
export type {
  ListStores200ResponseDataInner as StoreListItem,
  ListItems200ResponseDataInner as ItemListItem,
  ListOrders200ResponseDataInner as OrderListItem,
  ListCarts200ResponseDataInner as CartListItem,
  ListAddresss200ResponseDataInner as AddressListItem,
  ListPromotions200ResponseDataInner as PromotionListItem,
  // Additional list types for missing core types
  ListUsers200ResponseDataInner as UserListItem,
  ListBundles200ResponseDataInner as BundleListItem
} from '@packages/sdk'

// Custom list types for missing SDK types
// Note: Using direct type names instead of aliases to reduce redundancy
// PostListItem -> PostResponse
// MediaListItem -> MediaResponse
// PaymentListItem, TipListItem, AuthListItem removed to avoid redundancy

// ============================================
// Type Aliases (Backward Compatibility)
// ============================================
// Note: Using direct type names instead of aliases to reduce redundancy
// RiverPost -> PostResponse
// RiverComment -> CommentResponse  
// Product -> ItemResponse
// MediaUploadResponse -> MediaResponse

// ============================================
// Event Handlers
// ============================================
import type { ItemResponse, OrderResponse } from './backend-types'
import type { StoreResponse } from './backend-types'

export type StoreClickHandler = (store: StoreResponse) => void
export type ProductClickHandler = (item: ItemResponse) => void
export type OrderClickHandler = (order: OrderResponse) => void
export type EntityClickHandler<T> = (entity: T) => void

// ============================================
// Helper Functions & Extended Types
// ============================================
export { calculateCartTotals, parseStore } from './types/helpers'
export type { StoreFees } from './types/helpers'

// ============================================
// Utility Functions
// ============================================
export function parsePrice(price: number | string): number {
  if (typeof price === 'number') return price
  const priceStr = price.toString()
  // eslint-disable-next-line unicorn/prefer-string-replace-all
  return Number.parseFloat(priceStr.replace(/[^\d.-]/g, '')) || 0
}


// ============================================
// Bundle Types (Schema-Derived)
// ============================================
export type {
  Bundle,
  BundleItem,
  BundlePricing
} from './backend-types'


// ============================================
// Convenience Aliases
// ============================================



export interface MediaApiResponse {
  id: string
  url: string
  kind: 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'AUDIO'
  filename: string
  size: number
  mimeType: string
  createdAt: string
  updatedAt: string
  thumbnail?: string
  altText?: string
  sortIndex?: number
  storeId?: string
  itemId?: string
}

// ============================================
// Input Types (Temporary - until schemas are resolved)
// ============================================
export interface CreateOrderInput {
  cartId: string
  deliveryType: 'DELIVERY' | 'PICKUP'
  addressId?: string
  tip?: string
}

export interface CreateBundleInput {
  storeId: string
  name: string
  description?: string
  imageUrl?: string
  isActive?: boolean
  sortIndex?: number
  items: {
    itemId: string
    quantity: number
    sortIndex?: number
  }[]
  pricing: {
    pricingType: 'FIXED_PRICE' | 'DISCOUNT_PERCENT' | 'DISCOUNT_AMOUNT' | 'BEST_DEAL'
    fixedPrice?: number
    discountPercent?: number
    discountAmount?: number
    minSavings?: number
    showSavings?: boolean
    savingsLabel?: string
  }
}

// API types are now managed through the centralized system

