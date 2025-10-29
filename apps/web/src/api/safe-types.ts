/**
 * Auto-Generated Safe Frontend Types
 * ⚠️  AUTO-GENERATED - DO NOT EDIT MANUALLY
 * Generated from: @packages/sdk + common patterns
 * 
 * To regenerate: pnpm gen:frontend-types
 * 
 * This file contains only safe, non-conflicting utility types
 * that complement the main types.ts without causing conflicts
 */

// ============================================
// Status Enums (Safe - No Conflicts)
// ============================================
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED'
export type PaymentStatus = 'UNPAID' | 'PAID' | 'REFUNDED'
export type CartStatus = 'ACTIVE' | 'SUBMITTED' | 'EXPIRED'
export type StoreStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'SUSPENDED'
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
  'PENDING',
  'CONFIRMED', 
  'PREPARING',
  'READY',
  'COMPLETED',
  'CANCELLED'
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
