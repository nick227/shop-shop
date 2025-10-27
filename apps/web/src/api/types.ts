/**
 * Centralized Type Library - SDK-First Architecture
 * All type imports should go through this file
 * 
 * Organization:
 * 1. Core SDK Types (primary source of truth)
 * 2. Frontend Extensions (computed fields)
 * 3. Input Types (create/update DTOs)
 * 4. Sorting & Filtering
 * 5. Event Handlers
 * 6. Safe Utility Types (auto-generated)
 */

// ============================================
// Safe Utility Types (Auto-Generated)
// ============================================
// Re-export safe utility types that don't conflict with existing types
export * from './safe-types'

// ============================================
// Core SDK Types (Primary Source of Truth)
// ============================================
// Import and re-export SDK types with clean names
import type {
  StoreResponse as SDKStoreResponse,
  UserResponse as SDKUserResponse, 
  OrderResponse as SDKOrderResponse,
  ListItems200ResponseDataInner as SDKItemResponse,
  ListAddresss200ResponseDataInner as SDKAddressResponse,
  ListCarts200ResponseDataInner as SDKCartResponse,
  ListPromotions200ResponseDataInner as SDKPromotionResponse,
  // Additional SDK types for missing core types
  AuthResponse as SDKAuthResponse,
  PaymentIntentResponse as SDKPaymentIntentResponse,
  TipResponse as SDKTipResponse,
  UserPublicResponse as SDKUserPublicResponse
} from '@packages/sdk'

// Re-export with clean names and add missing fields that frontend expects
export type StoreResponse = SDKStoreResponse & {
  id: string  // Frontend expects this field
  createdAt?: string  // Frontend expects this field
  updatedAt?: string  // Frontend expects this field
  city?: string
  state?: string
  zipCode?: string
  media?: MediaItem[]
}

export type UserResponse = SDKUserResponse & {
  id: string  // Frontend expects this field
  createdAt?: string  // Frontend expects this field
  updatedAt?: string  // Frontend expects this field
}

export type OrderResponse = SDKOrderResponse & {
  id: string  // Frontend expects this field
  createdAt?: string  // Frontend expects this field
  updatedAt?: string  // Frontend expects this field
  user?: {
    name?: string
    phone?: string
    email?: string
  }
  items?: {
    id: string
    itemId: string
    quantity: number
    unitPrice: number
    titleSnapshot: string
    optionsSnapshot?: Record<string, unknown>
  }[]
  totalAmount?: number
}
export type ItemResponse = SDKItemResponse & {
  id: string  // Frontend expects this field
  createdAt?: string  // Frontend expects this field
  updatedAt?: string  // Frontend expects this field
}

export type AddressResponse = SDKAddressResponse & {
  id: string  // Frontend expects this field
  createdAt?: string  // Frontend expects this field
  updatedAt?: string  // Frontend expects this field
  street?: string
  zip?: string
}
// Custom types for missing SDK types
export interface PostResponse {
  id: string
  content: string
  authorId: string
  storeId: string
  createdAt: string
  updatedAt: string
  isLiked?: boolean
  media?: MediaItem[]
  storeName?: string
  storeImage?: string
  likesCount?: number
  commentsCount?: number
  sharesCount?: number
}

export type CartResponse = SDKCartResponse & {
  id: string  // Frontend expects this field
  createdAt?: string  // Frontend expects this field
  updatedAt?: string  // Frontend expects this field
}

export interface MediaResponse {
  id: string
  url: string
  type: string
  kind?: string  // Frontend expects this field
  altText?: string  // Frontend expects this field
  createdAt: string
  updatedAt: string
}

export type PromotionResponse = SDKPromotionResponse & {
  id: string  // Frontend expects this field
  createdAt?: string  // Frontend expects this field
  updatedAt?: string  // Frontend expects this field
}

// ============================================
// Authentication & User Types
// ============================================
export type AuthResponse = SDKAuthResponse & {
  id: string  // Frontend expects this field
  createdAt?: string  // Frontend expects this field
  updatedAt?: string  // Frontend expects this field
}

export type UserPublicResponse = SDKUserPublicResponse & {
  id: string  // Frontend expects this field
  createdAt?: string  // Frontend expects this field
  updatedAt?: string  // Frontend expects this field
}

// ============================================
// Payment & Transaction Types
// ============================================
export type PaymentIntentResponse = SDKPaymentIntentResponse & {
  id: string  // Frontend expects this field
  createdAt?: string  // Frontend expects this field
  updatedAt?: string  // Frontend expects this field
}

export type TipResponse = SDKTipResponse & {
  id: string  // Frontend expects this field
  createdAt?: string  // Frontend expects this field
  updatedAt?: string  // Frontend expects this field
}

// ============================================
// Media & File Upload Types
// ============================================
export interface MediaUploadResponse {
  id: string
  url: string
  kind: 'image' | 'video' | 'document' | 'audio'
  filename: string
  size: number
  mimeType: string
  createdAt: string
  updatedAt: string
  // Additional frontend fields
  thumbnail?: string
  altText?: string
  width?: number
  height?: number
}

// ============================================
// Supporting Types (Manual - Complex Logic)
// ============================================
export interface MediaItem {
  type: 'youtube' | 'image' | 'video' | 'link'
  url: string
  thumbnail?: string
  title?: string
  provider?: string
  width?: number
  height?: number
}

// Payment status and types
export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'cancelled'
export type PaymentMethod = 'card' | 'bank_transfer' | 'cash' | 'digital_wallet'

// User roles and permissions
export type UserRole = 'customer' | 'vendor' | 'admin' | 'super_admin'
export type Permission = 'read' | 'write' | 'delete' | 'admin'

// Media upload types
export type MediaType = 'image' | 'video' | 'document' | 'audio'
export type MediaStatus = 'uploading' | 'processing' | 'ready' | 'failed'

// Authentication states
export type AuthState = 'loading' | 'authenticated' | 'unauthenticated' | 'error'
export type LoginMethod = 'email' | 'phone' | 'social' | 'magic_link'

// ============================================
// Frontend Extensions (Computed Fields)
// ============================================
export type {
  StoreWithDistance,
  StoreWithLocation,
  StoreWithFees,
  UserWithName,
  OrderWithDetails,
  ItemWithStore,
  AddressWithCoordinates,
  OrderItem,
  AddressSnapshot
} from '@/types/extensions'

// ============================================
// Component-Specific Types
// ============================================
// Cart types are now defined in helpers.ts and extend SDK types

// Order Types - Using SDK types in extensions.ts

// Note: MediaItem and RiverPost are defined above in the main type definitions

export interface RiverComment {
  id: string
  content: string
  postId: string
  userId: string
  userName: string
  createdAt: string
  updatedAt: string
  // Additional properties for compatibility
  userImage?: string
}

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

// Product Types
export interface Product {
  id: string
  title: string
  description: string
  price: string
  category: string
  isActive: boolean
  storeId: string
  image?: string
  createdAt: string
  updatedAt: string
}

// ============================================
// Input Types (Create/Update DTOs)
// ============================================
// Re-export input types from SDK
export type {
  CreateStoreInput,
  CreateItemInput,
  CreateOrderInput,
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
  // Additional input types for missing core types
  CreatePaymentIntentRequest,
  UploadMediaRequest
} from '@packages/sdk'

// Custom input types for missing SDK types
export interface CreatePostInput {
  storeId: string
  content: string
  mediaUrls?: string[]
}

export interface UpdatePostInput {
  content?: string
  mediaUrls?: string[]
}

// Custom form types for missing SDK types
export interface PostFormData {
  storeId: string
  content: string
  mediaUrls?: string[]
}

export interface PostFormProps {
  initialData?: Partial<PostFormData>
  onSubmit: (data: PostFormData) => void | Promise<void>
  onCancel?: () => void
  isLoading?: boolean
  error?: string
}

export interface PostFormFieldProps {
  field: keyof PostFormData
  value: unknown
  onChange: (field: keyof PostFormData, value: unknown) => void
  error?: string
  disabled?: boolean
}

export interface PostFormSectionProps {
  title: string
  children: React.ReactNode
  collapsible?: boolean
  defaultExpanded?: boolean
}

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
export type PostListItem = PostResponse
export type MediaListItem = MediaResponse
// Note: PaymentListItem, TipListItem, AuthListItem removed to avoid redundancy

// ============================================
// Type Aliases (Backward Compatibility)
// ============================================
export type RiverPost = PostResponse

// ============================================
// Event Handlers
// ============================================
export type StoreClickHandler = (store: StoreResponse) => void
export type ProductClickHandler = (item: ItemResponse) => void
export type OrderClickHandler = (order: OrderResponse) => void
export type EntityClickHandler<T> = (entity: T) => void

// ============================================
// Helper Functions & Extended Types
// ============================================
export { calculateCartTotals, parseStore } from './types/helpers'
export type { StoreFees, CartWithTotals, CartItemData } from './types/helpers'

// ============================================
// Bundle Types (temporary local definitions)
// ============================================
export type BundlePricingType = 'FIXED_PRICE' | 'DISCOUNT_PERCENT' | 'DISCOUNT_AMOUNT' | 'BEST_DEAL'
export interface Bundle {
  id: string
  storeId: string
  name: string
  description?: string
  imageUrl?: string
  isActive: boolean
  sortIndex: number
  createdAt: string
  updatedAt: string
  items?: BundleItem[]
  pricing?: BundlePricing
  totalItems?: number
}

export interface BundleItem {
  id: string
  bundleId: string
  itemId: string
  quantity: number
  sortIndex: number
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
  pricingType: BundlePricingType
  fixedPrice?: number
  discountPercent?: number
  discountAmount?: number
  minSavings?: number
  showSavings: boolean
  savingsLabel?: string
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
    sortIndex: number
  }[]
  pricing: {
    pricingType: BundlePricingType
    fixedPrice?: number
    discountPercent?: number
    discountAmount?: number
    minSavings?: number
    showSavings: boolean
    savingsLabel?: string
  }
}

export interface UpdateBundleInput {
  name?: string
  description?: string
  imageUrl?: string
  isActive?: boolean
  sortIndex?: number
  items?: {
    itemId: string
    quantity: number
    sortIndex: number
  }[]
  pricing?: {
    pricingType: BundlePricingType
    fixedPrice?: number
    discountPercent?: number
    discountAmount?: number
    minSavings?: number
    showSavings: boolean
    savingsLabel?: string
  }
}

// ============================================
// Type Transformers (Utilities)
// ============================================
export {
  addDistanceToStore,
  flattenStoreAddress,
  addFeesToStore,
  addNameToUser,
  addDetailsToOrder,
  addStoreToItem,
  addCoordinatesToAddress,
  parsePrice,
  formatPrice,
  calculateDistance
} from '@/utils/type-transformers'

// ============================================
// Convenience Aliases
// ============================================
// Note: Type aliases removed to avoid redundancy - use full type names

// ========================================
// Generic Types (Code Reduction)
// ========================================

// Re-export generic component props
export type {
  BaseProps,
  ClickableProps,
  InteractiveProps,
  EntityCardProps,
  EntityListProps,
  EntityModalProps,
  FormProps,
  FormFieldProps,
  PageProps,
  SectionProps,
  LoadingProps,
  ErrorProps,
  EmptyProps,
  DataStateProps,
  StoreCardProps,
  StoreListProps,
  StoreModalProps,
  ItemCardProps,
  ItemListProps,
  ItemModalProps,
  OrderCardProps,
  OrderListProps,
  OrderModalProps,
  AddressCardProps,
  AddressListProps,
  AddressModalProps,
  MapProps,
  MapMarkerProps,
  SearchProps,
  SearchResultsProps,
  PaginationProps,
  BreadcrumbProps,
  StatusBadgeProps,
  StatCardProps,
  ConfirmDialogProps,
  DrawerProps
} from '@/types/component-props'

// Re-export generic form types
export type {
  BaseFormData,
  FormState,
  FormActions,
  StoreFormData,
  ItemFormData,
  AddressFormData,
  OrderFormData,
  FormValidation,
  FormValidationRule,
  UseFormReturn,
  UseFormOptions,
  FormSection,
  FormPageProps,
  FormInitializer,
  FormTransformer,
  StoreFormProps,
  StoreFormFieldProps,
  StoreFormSectionProps,
  ItemFormProps,
  ItemFormFieldProps,
  ItemFormSectionProps,
  AddressFormProps,
  AddressFormFieldProps,
  AddressFormSectionProps,
  OrderFormProps,
  OrderFormFieldProps,
  OrderFormSectionProps
} from '@/types/form-types'

// PostFormData and related types are defined above in this file

// Re-export generic API types
export type {
  BaseApiResponse,
  PaginatedApiResponse,
  ApiError,
  ApiErrorResponse,
  ApiClientConfig,
  ApiRequestConfig,
  ApiResponse,
  StoreApiResponse,
  StoreListApiResponse,
  StoreCreateApiResponse,
  StoreUpdateApiResponse,
  StoreDeleteApiResponse,
  ItemApiResponse,
  ItemListApiResponse,
  ItemCreateApiResponse,
  ItemUpdateApiResponse,
  ItemDeleteApiResponse,
  OrderApiResponse,
  OrderListApiResponse,
  OrderCreateApiResponse,
  OrderUpdateApiResponse,
  OrderDeleteApiResponse,
  AddressApiResponse,
  AddressListApiResponse,
  AddressCreateApiResponse,
  AddressUpdateApiResponse,
  AddressDeleteApiResponse,
  // Post API types removed from api-types.ts - Posts API not available in SDK
  CartApiResponse,
  CartListApiResponse,
  CartCreateApiResponse,
  CartUpdateApiResponse,
  CartDeleteApiResponse,
  MediaApiResponse,
  MediaListApiResponse,
  MediaCreateApiResponse,
  MediaUpdateApiResponse,
  MediaDeleteApiResponse,
  PromotionApiResponse,
  PromotionListApiResponse,
  PromotionCreateApiResponse,
  PromotionUpdateApiResponse,
  PromotionDeleteApiResponse,
  UseApiQueryOptions,
  UseApiMutationOptions,
  UseApiQueryReturn,
  UseApiMutationReturn,
  ApiService,
  ApiServiceConfig,
  ApiCacheConfig,
  ApiCacheEntry,
  ApiCacheManager,
  ApiErrorHandler,
  ApiRetryConfig,
  ApiValidator,
  ApiValidationError,
  ApiMetrics,
  ApiMonitor,
  ApiMiddleware,
  ApiMiddlewareChain
} from '@/types/api-types'

