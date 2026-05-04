/**
 * Consolidated Type Library - Single Source of Truth
 * 
 * This file consolidates all type exports to eliminate conflicts and duplication.
 * Replaces: types.ts, safe-types.ts, backend-types.ts
 * 
 * Usage: Import from this file instead of the three separate files
 */

// ============================================
// Centralized SDK Types (Primary Source)
// ============================================
export * from './types/centralized'

// ============================================
// SDK-Based Core Types (from backend-types.ts)
// ============================================
export type {
  AddressResponse,
  BundleResponse,
  CartResponse,
  ItemResponse,
  OrderResponse,
  StoreResponse,
  UserResponse,
  PromotionResponse
} from './backend-types'

// ============================================
// Safe Utility Types (from safe-types.ts)
// ============================================
export type {
  OrderStatus,
  PaymentStatus,
  CartStatus,
  StoreStatus,
  ItemStatus,
  StoreSortOption,
  OrderSortOption,
  ItemSortOption,
  UserSortOption,
  StoreFilters,
  OrderFilters,
  ItemFilters
} from './backend-types'

// ============================================
// API Response Types (from types.ts)
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
} from './types'

// ============================================
// Shared Types (from @shared/types)
// ============================================
export * from '@shared/types/types/extensions'

// ============================================
// Location Types (from @shared/types)
// ============================================
export type {
  LocationData,
  LocationPreferences,
  LocationInput,
  LocationCoordinates
} from '@shared/types'

// ============================================
// Store Types (from @shared/types)
// ============================================
export type {
  StoreWithDistance,
  StoreSearchResult
} from '@shared/types'

// ============================================
// Cart Types (from @shared/types)
// ============================================
export type {
  CartWithTotals
} from '@shared/types'

// ============================================
// Order Types (from @shared/types)
// ============================================
export type {
  OrderWithDetails
} from '@shared/types'
