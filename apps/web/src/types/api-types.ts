/**
 * Generic API Response Types
 * Reduces API type duplication with reusable generic patterns
 */

import type { 
  StoreResponse, 
  ItemResponse, 
  OrderResponse, 
  AddressResponse, 
  PostResponse,
  CartResponse,
  MediaResponse,
  PromotionResponse
} from '@api/types'

// Import actual SDK response types
import type {
  AddressListResponse,
  AddressResponse as SDKAddressResponse,
  AuthResponse,
  CartListResponse,
  CartResponse as SDKCartResponse,
  ErrorResponse,
  ItemListResponse,
  ItemResponse as SDKItemResponse,
  OrderListResponse,
  OrderResponse as SDKOrderResponse,
  PostListResponse,
  PostResponse as SDKPostResponse,
  StoreListResponse,
  StoreResponse as SDKStoreResponse
} from '@packages/sdk'

// ============================================
// Common Types Derived from SDK
// ============================================
// Extract common ID type from SDK entities
export type EntityId = Pick<SDKStoreResponse, 'id'>['id']

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
  params?: Record<string, any>
  data?: any
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

// Use actual SDK response types directly
export type StoreApiResponse = SDKStoreResponse
export type StoreListApiResponse = StoreListResponse
export type StoreCreateApiResponse = SDKStoreResponse
export type StoreUpdateApiResponse = SDKStoreResponse
export interface StoreDeleteApiResponse { id: EntityId }

export type ItemApiResponse = SDKItemResponse
export type ItemListApiResponse = ItemListResponse
export type ItemCreateApiResponse = SDKItemResponse
export type ItemUpdateApiResponse = SDKItemResponse
export interface ItemDeleteApiResponse { id: EntityId }

export type OrderApiResponse = SDKOrderResponse
export type OrderListApiResponse = OrderListResponse
export type OrderCreateApiResponse = SDKOrderResponse
export type OrderUpdateApiResponse = SDKOrderResponse
export interface OrderDeleteApiResponse { id: EntityId }

export type AddressApiResponse = SDKAddressResponse
export type AddressListApiResponse = AddressListResponse
export type AddressCreateApiResponse = SDKAddressResponse
export type AddressUpdateApiResponse = SDKAddressResponse
export interface AddressDeleteApiResponse { id: EntityId }

export type PostApiResponse = SDKPostResponse
export type PostListApiResponse = PostListResponse
export type PostCreateApiResponse = SDKPostResponse
export type PostUpdateApiResponse = SDKPostResponse
export interface PostDeleteApiResponse { id: EntityId }

export type CartApiResponse = SDKCartResponse
export type CartListApiResponse = CartListResponse
export type CartCreateApiResponse = SDKCartResponse
export type CartUpdateApiResponse = SDKCartResponse
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
  onSettled?: (data: TData | undefined, error: Error | null, variables: TVariables) => void
}

export interface UseApiQueryReturn<T> {
  data: T | undefined
  isLoading: boolean
  isError: boolean
  error: Error | null
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
  error: Error | null
  isSuccess: boolean
  reset: () => void
}

// ========================================
// Generic API Service Types
// ========================================

export interface ApiService<T> {
  get: (id: string) => Promise<BaseApiResponse<T>>
  list: (params?: Record<string, any>) => Promise<PaginatedApiResponse<T>>
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
  get: (key: string) => T | null
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
  value: any
}

// ========================================
// Generic API Monitoring Types
// ========================================

export interface ApiMetrics {
  requestCount: number
  successCount: number
  errorCount: number
  averageResponseTime: number
  lastRequestTime: Date | null
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
