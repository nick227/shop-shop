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
 */

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
  ListPosts200ResponseDataInner as SDKPostResponse,
  ListCarts200ResponseDataInner as SDKCartResponse,
  ListMedias200ResponseDataInner as SDKMediaResponse,
  ListPromotions200ResponseDataInner as SDKPromotionResponse
} from '@packages/sdk'

// Re-export with clean names
export type StoreResponse = SDKStoreResponse & {
  city?: string
  state?: string
  zipCode?: string
  media?: MediaItem[]
}
export type UserResponse = SDKUserResponse
export type OrderResponse = SDKOrderResponse & {
  user?: {
    name?: string
    phone?: string
    email?: string
  }
  items?: any[]
  totalAmount?: number
}
export type ItemResponse = SDKItemResponse
export type AddressResponse = SDKAddressResponse & {
  street?: string
  zip?: string
}
export type PostResponse = SDKPostResponse
export type CartResponse = SDKCartResponse
export type MediaResponse = SDKMediaResponse
export type PromotionResponse = SDKPromotionResponse

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

// Media Types - Use SDK type as base
import type { ListMedias200ResponseDataInner } from '@packages/sdk'
export interface MediaItem extends ListMedias200ResponseDataInner {
  // Additional properties for compatibility
  type?: string
  thumbnail?: string
}

// River/Social Types - Use SDK type as base
import type { ListPosts200ResponseDataInner } from '@packages/sdk'
export interface RiverPost extends ListPosts200ResponseDataInner {
  // Additional properties for compatibility
  isLiked?: boolean
  media?: MediaItem[]
}

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
  CreatePostInput,
  CreatePromotionInput,
  CreateTipInput,
  UpdateStoreInput,
  UpdateItemInput,
  UpdateOrderInput,
  UpdateAddressInput,
  UpdatePostInput,
  UpdatePromotionInput,
  UpdateUserInput,
  LoginInput,
  SignupInput
} from '@packages/sdk'

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
// Event Handlers
// ============================================
export type StoreClickHandler = (store: StoreResponse | import('@/types/extensions').StoreWithDistance) => void
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
  pricingType: 'FIXED_PRICE' | 'DISCOUNT_PERCENT' | 'DISCOUNT_AMOUNT' | 'BEST_DEAL'
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
    pricingType: 'FIXED_PRICE' | 'DISCOUNT_PERCENT' | 'DISCOUNT_AMOUNT' | 'BEST_DEAL'
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
    pricingType: 'FIXED_PRICE' | 'DISCOUNT_PERCENT' | 'DISCOUNT_AMOUNT' | 'BEST_DEAL'
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
export type Store = StoreResponse
export type Item = ItemResponse
export type Order = OrderResponse
export type User = UserResponse
export type Address = AddressResponse
export type Post = PostResponse
export type Cart = CartResponse
export type Media = MediaResponse
export type Promotion = PromotionResponse

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
  PostFormData,
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
  OrderFormSectionProps,
  PostFormProps,
  PostFormFieldProps,
  PostFormSectionProps
} from '@/types/form-types'

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
  PostApiResponse,
  PostListApiResponse,
  PostCreateApiResponse,
  PostUpdateApiResponse,
  PostDeleteApiResponse,
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

