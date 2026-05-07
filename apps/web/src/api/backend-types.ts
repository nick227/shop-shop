/**
 * Type Mappers - SDK to Application Types
 * ⚠️  AUTO-GENERATED - DO NOT EDIT MANUALLY
 * Generated from: Resource configurations (100% schema-driven)
 * 
 * To regenerate: pnpm gen:types
 */

 
 
 

import type {
  ListAddresses200ResponseDataInner,
  ListBundles200ResponseDataInner,
  ListCarts200ResponseDataInner,
  ListItems200ResponseDataInner,
  ListOrders200ResponseDataInner,
  ListPromotions200ResponseDataInner,
  ListStores200ResponseDataInner,
  ListUsers200ResponseDataInner
} from './types/centralized'

// ========================================
// Base Type Exports (From SDK)
// ========================================

export type AddressResponse = ListAddresses200ResponseDataInner & {
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

export interface ItemTag {
  slug: string
  label: string
  category: string
}

export type ItemResponse = ListItems200ResponseDataInner & {
  id: string
  createdAt: string
  updatedAt: string
  tags?: ItemTag[]
  mediaAssets?: Array<{ url: string; kind: string; sortIndex?: number | null }>
}

export type OrderResponse = ListOrders200ResponseDataInner & {
  id: string
  createdAt: string
  updatedAt: string
  /** Canonical delivery pin (preferred over snapshot geo when present). */
  deliveryLatitude?: ListOrders200ResponseDataInner['deliveryLatitude']
  deliveryLongitude?: ListOrders200ResponseDataInner['deliveryLongitude']
  /** Delivery execution mode - who handles the delivery */
  deliveryMode?: 'PICKUP' | 'STORE_MANAGED_DELIVERY' | 'PLATFORM_DRIVER' | 'THIRD_PARTY_PROVIDER'
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
  /** Legacy / interim; prefer Order deliveryLatitude/deliveryLongitude when available. */
  geo?: { latitude?: number; longitude?: number; lat?: number; lng?: number } | null
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
  isActive: boolean
  sortIndex: number
  // Bundle-specific properties
  items?: BundleItem[]
  pricing?: BundlePricing
  media?: MediaResponse[]
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
  deliveryLatitude?: number | string
  deliveryLongitude?: number | string
}

export interface UpdateOrderInput {
  status?: string
  riderId?: string
  estimatedDeliveryTime?: string
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

export type {
  CreateStoreInput,
  UpdateStoreInput,
  CreateItemInput,
  UpdateItemInput,
  CreatePromotionInput,
  UpdatePromotionInput,
  AddToCartInput,
  UpdateCartInput,
  UpdateAddressInput,
  CreatePaymentIntentInput,
  CreateConnectAccountInput,
  CreateTipInput,
  UpdateTipInput,
  ProcessTipInput,
  TipStatusUpdate,
  PostResponse,
  PostListResponse,
  PostQuery,
  CreateCommentInput,
  CommentResponse,
  CommentListResponse,
  CommentQuery,
  LikePostInput,
  UnlikePostInput,
  UploadMediaInput,
  MediaListResponse,
} from '@packages/schemas'

export interface CreateUserInput {
  role?: string
  email: string
  name: string
  phone: string
  isCompany?: boolean
  companyName?: string
  affiliate?: string
  vendorVerification?: string
}

export interface UpdateUserInput extends Partial<CreateUserInput> {}

// ========================================
// Utility Types for UI Components
// ========================================

export type StoreClickHandler = (store: StoreWithDistance) => void
export type ProductClickHandler = (item: ItemResponse) => void

export interface StoreWithDistance extends StoreResponse {
  distance?: number
  imageUrl?: string
}

export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PLACED'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'READY'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELED'
  | 'COMPLETED' // legacy

export type PaymentStatus = 'UNPAID' | 'PAID' | 'REFUNDED'
export type DeliveryType = 'PICKUP' | 'DELIVERY'

// ========================================
// User Types
// ========================================

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

// ========================================
// Safe Utility Types (Consolidated from safe-types.ts)
// ========================================

// ============================================
// Status Enums (Safe - No Conflicts)
// ============================================
// OrderStatus and PaymentStatus are already defined above
export type CartStatus = 'ACTIVE' | 'SUBMITTED' | 'EXPIRED'
export type StoreStatus = 'ACTIVE' | 'PAUSED' | 'DISABLED'
export type ItemStatus = 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK' | 'DISCONTINUED'

// ============================================
// Sorting & Filtering Types (Safe)
// ============================================
export type StoreSortOption = 'distance' | 'name' | 'rating' | 'prepTime' | 'deliveryFee'
export type OrderSortOption = 'date' | 'status' | 'total' | 'store'
export type ItemSortOption = 'name' | 'price' | 'category' | 'popularity'
export type UserSortOption = 'name' | 'email' | 'createdAt' | 'lastActive'

// ============================================
// Filter Types (Safe)
// ============================================
export interface StoreFilters {
  search?: string
  category?: string
  rating?: number
  maxDistance?: number
  deliveryEnabled?: boolean
  pickupEnabled?: boolean
  priceRange?: {
    min: number
    max: number
  }
  prepTimeRange?: {
    min: number
    max: number
  }
}

export interface OrderFilters {
  status?: OrderStatus
  dateRange?: {
    start: string
    end: string
  }
  storeId?: string
  minAmount?: number
  maxAmount?: number
}

export interface ItemFilters {
  search?: string
  category?: string
  storeId?: string
  priceRange?: {
    min: number
    max: number
  }
  inStock?: boolean
  isActive?: boolean
}

// ============================================
// Pagination Types (Safe)
// ============================================
export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
}

// ============================================
// Event Handler Types (Safe)
// ============================================
export type GenericClickHandler<T> = (item: T) => void
export type GenericChangeHandler<T> = (value: T) => void
export type GenericSubmitHandler<T> = (data: T) => void | Promise<void>
export type GenericErrorHandler = (error: Error) => void

// ============================================
// Form State Types (Safe)
// ============================================
export type FormState = 'idle' | 'loading' | 'success' | 'error'
export type ValidationState = 'valid' | 'invalid' | 'pending'

export interface FormFieldState {
  value: any
  error?: string
  touched: boolean
  dirty: boolean
  validationState: ValidationState
}

// ============================================
// API Response Types (Safe)
// ============================================
export interface ApiSuccessResponse<T = any> {
  success: true
  data: T
  message?: string
}

export interface ApiErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: any
  }
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse

// ============================================
// Loading States (Safe)
// ============================================
export interface LoadingState {
  isLoading: boolean
  error?: string
  lastUpdated?: string
}

export interface AsyncState<T> extends LoadingState {
  data?: T
}

// ============================================
// Search Types (Safe)
// ============================================
export interface SearchParams {
  query: string
  filters?: Record<string, any>
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export interface SearchResult<T> {
  items: T[]
  total: number
  query: string
  took: number
  suggestions?: string[]
}

// ============================================
// Modal/Dialog Types (Safe)
// ============================================
export interface ModalState {
  isOpen: boolean
  data?: any
  type?: string
}

export interface ConfirmDialogState {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm?: () => void
  onCancel?: () => void
}

// ============================================
// Theme/UI Types (Safe)
// ============================================
export type Theme = 'light' | 'dark' | 'system'
export type ColorScheme = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'
export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
export type Variant = 'solid' | 'outline' | 'ghost' | 'link'

// ============================================
// Utility Types (Safe)
// ============================================
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

// ============================================
// Constants (Safe)
// ============================================
export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 100
export const DEFAULT_SORT_ORDER = 'desc' as const
export const DEFAULT_SORT_BY = 'createdAt' as const

export const ORDER_STATUSES: OrderStatus[] = [
  'PENDING_PAYMENT',
  'PLACED', 
  'ACCEPTED',
  'PREPARING',
  'READY',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELED',
  'COMPLETED'
]

export const PAYMENT_STATUSES: PaymentStatus[] = [
  'UNPAID',
  'PAID',
  'REFUNDED'
]

export const CART_STATUSES: CartStatus[] = [
  'ACTIVE',
  'SUBMITTED',
  'EXPIRED'
]

// ========================================
// Utility Functions
// ========================================



/**
 * Safely extract id field with fallback
 * Handles common id field variations: id, _id, uuid
 */
function extractId(data: unknown, fallback = ''): string {
  if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>
    
    // Try common id field names
    const idFields = ['id', '_id', 'uuid', 'ID', 'Id']
    for (const field of idFields) {
      if (field in obj && typeof obj[field] === 'string') {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        return obj[field] as string
      }
    }
  }
  return fallback
}

/**
 * Safely extract timestamp fields with fallback
 * Handles common timestamp field variations: createdAt/created_at, updatedAt/updated_at
 */
function extractTimestamps(data: unknown): { createdAt: string; updatedAt: string } {
  const now = new Date().toISOString()
  
  if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>
    
    // Try common timestamp field names
    const createdFields = ['createdAt', 'created_at', 'created', 'CreatedAt']
    const updatedFields = ['updatedAt', 'updated_at', 'updated', 'UpdatedAt']
    
    let createdAt = now
    let updatedAt = now
    
    for (const field of createdFields) {
      if (field in obj && typeof obj[field] === 'string') {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        createdAt = obj[field] as string
        break
      }
    }
    
    for (const field of updatedFields) {
      if (field in obj && typeof obj[field] === 'string') {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        updatedAt = obj[field] as string
        break
      }
    }
    
    return { createdAt, updatedAt }
  }
  
  return {
    createdAt: now,
    updatedAt: now
  }
}

// ========================================
// Type Mappers (SDK → App Types)
// ========================================

export function mapAddresses(sdk: ListAddresses200ResponseDataInner): AddressResponse {
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
