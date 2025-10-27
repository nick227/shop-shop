/**
 * Generic API Response Types
 * Reduces API type duplication with reusable generic patterns
 */

import type { 
  MediaResponse,
  PromotionResponse
} from '@api/types'

// Import actual SDK response types
import type {
  AddressListResponse,
  CartListResponse,
  ErrorResponse,
  ItemListResponse,
  OrderListResponse,
  StoreListResponse
} from '@packages/sdk'

// Import augmented types with missing fields (only used ones)
import type {
  StoreResponse as AugmentedStoreResponse,
  OrderResponse as AugmentedOrderResponse,
  ItemResponse as AugmentedItemResponse,
  AddressResponse as AugmentedAddressResponse,
  CartResponse as AugmentedCartResponse
} from './sdk-augmentations'

// ============================================
// Common Types Derived from SDK
// ============================================
// Extract common ID type from augmented entities
export type EntityId = Pick<AugmentedStoreResponse, 'id'>['id']

// ========================================
// Base API Response Types (Using SDK Types)
// ========================================

// Use SDK ErrorResponse directly
export type ApiError = ErrorResponse & {
  code?: string
  details?: Record<string, unknown>
}

// Use SDK list response structure
export interface PaginatedApiResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

// Generic success response wrapper
export interface BaseApiResponse<T> {
  data: T
  success: boolean
  message?: string
  timestamp: string
}

// SDK-based error response
export interface ApiErrorResponse {
  error: ApiError
  success: false
  timestamp: string
}

// ========================================
// Generic API Client Types
// ========================================

export interface ApiClientConfig {
  baseUrl: string
  timeout: number
  retries: number
  headers: Record<string, string>
  retryDelay?: number
}

export interface ApiRequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  url: string
  params?: Record<string, unknown>
  data?: unknown
  headers?: Record<string, string>
  timeout?: number
  retries?: number
}

export interface ApiResponse<T> {
  data: T
  status: number
  statusText: string
  headers: Record<string, string>
  error?: string
}

// ========================================
// Entity-Specific API Types (Using SDK Types)
// ========================================

// Use augmented SDK response types with missing fields
export type StoreApiResponse = AugmentedStoreResponse
export type StoreListApiResponse = StoreListResponse
export type StoreCreateApiResponse = AugmentedStoreResponse
export type StoreUpdateApiResponse = AugmentedStoreResponse
export interface StoreDeleteApiResponse { id: EntityId }

export type ItemApiResponse = AugmentedItemResponse
export type ItemListApiResponse = ItemListResponse
export type ItemCreateApiResponse = AugmentedItemResponse
export type ItemUpdateApiResponse = AugmentedItemResponse
export interface ItemDeleteApiResponse { id: EntityId }

export type OrderApiResponse = AugmentedOrderResponse
export type OrderListApiResponse = OrderListResponse
export type OrderCreateApiResponse = AugmentedOrderResponse
export type OrderUpdateApiResponse = AugmentedOrderResponse
export interface OrderDeleteApiResponse { id: EntityId }

export type AddressApiResponse = AugmentedAddressResponse
export type AddressListApiResponse = AddressListResponse
export type AddressCreateApiResponse = AugmentedAddressResponse
export type AddressUpdateApiResponse = AugmentedAddressResponse
export interface AddressDeleteApiResponse { id: EntityId }

// Posts API types removed - Posts API not available in SDK

export type CartApiResponse = AugmentedCartResponse
export type CartListApiResponse = CartListResponse
export type CartCreateApiResponse = AugmentedCartResponse
export type CartUpdateApiResponse = AugmentedCartResponse
export interface CartDeleteApiResponse { id: EntityId }

// Media and Promotion responses (if they exist in SDK)
export type MediaApiResponse = MediaResponse
export type MediaListApiResponse = PaginatedApiResponse<MediaResponse>
export type MediaCreateApiResponse = MediaResponse
export type MediaUpdateApiResponse = MediaResponse
export interface MediaDeleteApiResponse { id: EntityId }

export type PromotionApiResponse = PromotionResponse
export type PromotionListApiResponse = PaginatedApiResponse<PromotionResponse>
export type PromotionCreateApiResponse = PromotionResponse
export type PromotionUpdateApiResponse = PromotionResponse
export interface PromotionDeleteApiResponse { id: EntityId }

// ========================================
// Generic API Hook Types
// ========================================

export interface UseApiQueryOptions<T> {
  queryKey: string[]
  queryFn: () => Promise<T>
  enabled?: boolean
  staleTime?: number
  cacheTime?: number
  refetchOnWindowFocus?: boolean
  retry?: boolean | number
}

export interface UseApiMutationOptions<TData, TVariables> {
  mutationFn: (variables: TVariables) => Promise<TData>
  onSuccess?: (data: TData, variables: TVariables) => void
  onError?: (error: Error, variables: TVariables) => void
  onSettled?: (data: TData | undefined, error: Error | undefined, variables: TVariables) => void
}

export interface UseApiQueryReturn<T> {
  data: T | undefined
  isLoading: boolean
  isError: boolean
  error: Error | undefined
  refetch: () => void
  isFetching: boolean
  isStale: boolean
}

export interface UseApiMutationReturn<TData, TVariables> {
  mutate: (variables: TVariables) => void
  mutateAsync: (variables: TVariables) => Promise<TData>
  data: TData | undefined
  isLoading: boolean
  isError: boolean
  error: Error | undefined
  isSuccess: boolean
  reset: () => void
}

// ========================================
// Generic API Service Types
// ========================================

export interface ApiService<T> {
  get: (id: string) => Promise<BaseApiResponse<T>>
  list: (params?: Record<string, unknown>) => Promise<PaginatedApiResponse<T>>
  create: (data: Partial<T>) => Promise<BaseApiResponse<T>>
  update: (id: string, data: Partial<T>) => Promise<BaseApiResponse<T>>
  delete: (id: string) => Promise<BaseApiResponse<{ id: string }>>
}

export interface ApiServiceConfig {
  baseUrl: string
  timeout: number
  retries: number
  headers: Record<string, string>
}

// ========================================
// Generic API Cache Types
// ========================================

export interface ApiCacheConfig {
  ttl: number
  maxSize: number
  strategy: 'lru' | 'fifo' | 'lfu'
}

export interface ApiCacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
  key: string
}

export interface ApiCacheManager<T> {
  get: (key: string) => T | undefined
  set: (key: string, data: T, ttl?: number) => void
  delete: (key: string) => void
  clear: () => void
  has: (key: string) => boolean
  size: () => number
}

// ========================================
// Generic API Error Types
// ========================================

export interface ApiErrorHandler {
  handle: (error: Error) => void
  retry: (error: Error) => boolean
  transform: (error: Error) => ApiError
}

export interface ApiRetryConfig {
  maxRetries: number
  retryDelay: number
  retryCondition: (error: Error) => boolean
}

// ========================================
// Generic API Validation Types
// ========================================

export interface ApiValidator<T> {
  validate: (data: unknown) => T
  validateList: (data: unknown) => T[]
  validateResponse: (response: unknown) => BaseApiResponse<T>
  validatePaginatedResponse: (response: unknown) => PaginatedApiResponse<T>
}

export interface ApiValidationError {
  field: string
  message: string
  code: string
  value: unknown
}

// ========================================
// Generic API Monitoring Types
// ========================================

export interface ApiMetrics {
  requestCount: number
  successCount: number
  errorCount: number
  averageResponseTime: number
  lastRequestTime: Date | undefined
}

export interface ApiMonitor {
  start: (requestId: string) => void
  end: (requestId: string, success: boolean) => void
  getMetrics: () => ApiMetrics
  reset: () => void
}

// ========================================
// Generic API Middleware Types
// ========================================

export interface ApiMiddleware {
  request: (config: ApiRequestConfig) => ApiRequestConfig
  response: <T>(response: ApiResponse<T>) => ApiResponse<T>
  error: (error: Error) => Error
}

export interface ApiMiddlewareChain {
  add: (middleware: ApiMiddleware) => void
  remove: (middleware: ApiMiddleware) => void
  execute: <T>(config: ApiRequestConfig) => Promise<ApiResponse<T>>
}
