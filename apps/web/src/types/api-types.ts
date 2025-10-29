/**
 * API Types - Generic API response and configuration types
 * 
 * These types provide consistent interfaces for API interactions
 * across the application.
 */

import type { ReactNode } from 'react'
import type { CartItemData } from '@api/generated-types'

// ============================================
// Base API Response Types
// ============================================

/** Base API response structure */
export interface BaseApiResponse<T = any> {
  data: T
  success: boolean
  message?: string
  timestamp: string
  requestId?: string
}

/** Paginated API response */
export interface PaginatedApiResponse<T = any> extends BaseApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

/** API error response */
export interface ApiError {
  code: string
  message: string
  details?: Record<string, unknown>
  field?: string
  timestamp: string
  requestId?: string
}

/** API error response structure */
export interface ApiErrorResponse {
  success: false
  error: ApiError
  timestamp: string
  requestId?: string
}

// ============================================
// API Client Configuration
// ============================================

/** API client configuration */
export interface ApiClientConfig {
  baseUrl: string
  timeout?: number
  retries?: number
  retryDelay?: number
  headers?: Record<string, string>
  interceptors?: {
    request?: (config: ApiRequestConfig) => ApiRequestConfig
    response?: <T>(response: ApiResponse<T>) => ApiResponse<T>
    error?: (error: ApiError) => ApiError
  }
}

/** API request configuration */
export interface ApiRequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  url: string
  params?: Record<string, unknown>
  data?: unknown
  headers?: Record<string, string>
  timeout?: number
  retries?: number
  retryDelay?: number
  cache?: boolean
  cacheKey?: string
  cacheTTL?: number
}

/** API response structure */
export interface ApiResponse<T = unknown> {
  data: T
  status: number
  statusText: string
  headers: Record<string, string>
  config: ApiRequestConfig
  request?: unknown
}

// ============================================
// Store API Types
// ============================================

/** Store API response */
export type StoreApiResponse = BaseApiResponse<{
  id: string
  name: string
  slug: string
  description: string
  // ... other store fields
}>

/** Store list API response */
export type StoreListApiResponse = PaginatedApiResponse<{
  id: string
  name: string
  slug: string
  description: string
  // ... other store fields
}>

/** Store create API response */
export type StoreCreateApiResponse = BaseApiResponse<{
  id: string
  name: string
  slug: string
  // ... other store fields
}>

/** Store update API response */
export type StoreUpdateApiResponse = BaseApiResponse<{
  id: string
  name: string
  slug: string
  // ... other store fields
}>

/** Store delete API response */
export type StoreDeleteApiResponse = BaseApiResponse<{
  id: string
  deleted: boolean
}>

// ============================================
// Item API Types
// ============================================

/** Item API response */
export type ItemApiResponse = BaseApiResponse<{
  id: string
  title: string
  description: string
  price: number
  // ... other item fields
}>

/** Item list API response */
export type ItemListApiResponse = PaginatedApiResponse<{
  id: string
  title: string
  description: string
  price: number
  // ... other item fields
}>

/** Item create API response */
export type ItemCreateApiResponse = BaseApiResponse<{
  id: string
  title: string
  description: string
  price: number
  // ... other item fields
}>

/** Item update API response */
export type ItemUpdateApiResponse = BaseApiResponse<{
  id: string
  title: string
  description: string
  price: number
  // ... other item fields
}>

/** Item delete API response */
export type ItemDeleteApiResponse = BaseApiResponse<{
  id: string
  deleted: boolean
}>

// ============================================
// Order API Types
// ============================================

/** Order API response */
export type OrderApiResponse = BaseApiResponse<{
  id: string
  status: string
  total: number
  // ... other order fields
}>

/** Order list API response */
export type OrderListApiResponse = PaginatedApiResponse<{
  id: string
  status: string
  total: number
  // ... other order fields
}>

/** Order create API response */
export type OrderCreateApiResponse = BaseApiResponse<{
  id: string
  status: string
  total: number
  // ... other order fields
}>

/** Order update API response */
export type OrderUpdateApiResponse = BaseApiResponse<{
  id: string
  status: string
  total: number
  // ... other order fields
}>

/** Order delete API response */
export type OrderDeleteApiResponse = BaseApiResponse<{
  id: string
  deleted: boolean
}>

// ============================================
// Address API Types
// ============================================

/** Address API response */
export type AddressApiResponse = BaseApiResponse<{
  id: string
  street: string
  city: string
  state: string
  zip: string
  // ... other address fields
}>

/** Address list API response */
export type AddressListApiResponse = PaginatedApiResponse<{
  id: string
  street: string
  city: string
  state: string
  zip: string
  // ... other address fields
}>

/** Address create API response */
export type AddressCreateApiResponse = BaseApiResponse<{
  id: string
  street: string
  city: string
  state: string
  zip: string
  // ... other address fields
}>

/** Address update API response */
export type AddressUpdateApiResponse = BaseApiResponse<{
  id: string
  street: string
  city: string
  state: string
  zip: string
  // ... other address fields
}>

/** Address delete API response */
export type AddressDeleteApiResponse = BaseApiResponse<{
  id: string
  deleted: boolean
}>

// ============================================
// Cart API Types
// ============================================

/** Cart API response */
export type CartApiResponse = BaseApiResponse<{
  id: string
  items: CartItemData[]
  total: number
  // ... other cart fields
}>

/** Cart list API response */
export type CartListApiResponse = PaginatedApiResponse<{
  id: string
  items: CartItemData[]
  total: number
  // ... other cart fields
}>

/** Cart create API response */
export type CartCreateApiResponse = BaseApiResponse<{
  id: string
  items: CartItemData[]
  total: number
  // ... other cart fields
}>

/** Cart update API response */
export type CartUpdateApiResponse = BaseApiResponse<{
  id: string
  items: CartItemData[]
  total: number
  // ... other cart fields
}>

/** Cart delete API response */
export type CartDeleteApiResponse = BaseApiResponse<{
  id: string
  deleted: boolean
}>

// ============================================
// Media API Types
// ============================================

/** Media API response */
export type MediaApiResponse = BaseApiResponse<{
  id: string
  url: string
  filename: string
  mimeType: string
  size: number
  // ... other media fields
}>

/** Media list API response */
export type MediaListApiResponse = PaginatedApiResponse<{
  id: string
  url: string
  filename: string
  mimeType: string
  size: number
  // ... other media fields
}>

/** Media create API response */
export type MediaCreateApiResponse = BaseApiResponse<{
  id: string
  url: string
  filename: string
  mimeType: string
  size: number
  // ... other media fields
}>

/** Media update API response */
export type MediaUpdateApiResponse = BaseApiResponse<{
  id: string
  url: string
  filename: string
  mimeType: string
  size: number
  // ... other media fields
}>

/** Media delete API response */
export type MediaDeleteApiResponse = BaseApiResponse<{
  id: string
  deleted: boolean
}>

// ============================================
// Promotion API Types
// ============================================

/** Promotion API response */
export type PromotionApiResponse = BaseApiResponse<{
  id: string
  name: string
  description: string
  discount: number
  // ... other promotion fields
}>

/** Promotion list API response */
export type PromotionListApiResponse = PaginatedApiResponse<{
  id: string
  name: string
  description: string
  discount: number
  // ... other promotion fields
}>

/** Promotion create API response */
export type PromotionCreateApiResponse = BaseApiResponse<{
  id: string
  name: string
  description: string
  discount: number
  // ... other promotion fields
}>

/** Promotion update API response */
export type PromotionUpdateApiResponse = BaseApiResponse<{
  id: string
  name: string
  description: string
  discount: number
  // ... other promotion fields
}>

/** Promotion delete API response */
export type PromotionDeleteApiResponse = BaseApiResponse<{
  id: string
  deleted: boolean
}>

// ============================================
// React Query Hook Types
// ============================================

/** Use API query options */
export interface UseApiQueryOptions<T = any> {
  enabled?: boolean
  staleTime?: number
  cacheTime?: number
  refetchOnWindowFocus?: boolean
  refetchOnMount?: boolean
  refetchOnReconnect?: boolean
  retry?: boolean | number
  retryDelay?: number
  onSuccess?: (data: T) => void
  onError?: (error: ApiError) => void
}

/** Use API mutation options */
export interface UseApiMutationOptions<T = any, V = any> {
  onSuccess?: (data: T, variables: V) => void
  onError?: (error: ApiError, variables: V) => void
  onSettled?: (data: T | undefined, error: ApiError | null, variables: V) => void
}

/** Use API query return type */
export interface UseApiQueryReturn<T = any> {
  data: T | undefined
  error: ApiError | null
  isLoading: boolean
  isError: boolean
  isSuccess: boolean
  isFetching: boolean
  refetch: () => void
  invalidate: () => void
}

/** Use API mutation return type */
export interface UseApiMutationReturn<T = any, V = any> {
  mutate: (variables: V) => void
  mutateAsync: (variables: V) => Promise<T>
  data: T | undefined
  error: ApiError | null
  isLoading: boolean
  isError: boolean
  isSuccess: boolean
  reset: () => void
}

// ============================================
// API Service Types
// ============================================

/** API service interface */
export interface ApiService {
  get: <T = unknown>(url: string, config?: Partial<ApiRequestConfig>) => Promise<ApiResponse<T>>
  post: <T = unknown>(url: string, data?: unknown, config?: Partial<ApiRequestConfig>) => Promise<ApiResponse<T>>
  put: <T = unknown>(url: string, data?: unknown, config?: Partial<ApiRequestConfig>) => Promise<ApiResponse<T>>
  patch: <T = unknown>(url: string, data?: unknown, config?: Partial<ApiRequestConfig>) => Promise<ApiResponse<T>>
  delete: <T = unknown>(url: string, config?: Partial<ApiRequestConfig>) => Promise<ApiResponse<T>>
}

/** API service configuration */
export interface ApiServiceConfig extends ApiClientConfig {
  endpoints: Record<string, string>
  defaultHeaders: Record<string, string>
  auth?: {
    type: 'bearer' | 'basic' | 'api-key'
    token?: string
    username?: string
    password?: string
    apiKey?: string
  }
}

// ============================================
// API Cache Types
// ============================================

/** API cache configuration */
export interface ApiCacheConfig {
  enabled: boolean
  defaultTTL: number
  maxSize: number
  storage: 'memory' | 'localStorage' | 'sessionStorage'
}

/** API cache entry */
export interface ApiCacheEntry<T = any> {
  key: string
  data: T
  timestamp: number
  ttl: number
  hits: number
}

/** API cache manager - removed */

// ============================================
// API Error Handling Types
// ============================================

/** API error handler */
export interface ApiErrorHandler {
  handle: (error: ApiError) => void
  retry: (error: ApiError) => boolean
  transform: (error: ApiError) => ApiError
}

/** API retry configuration */
export interface ApiRetryConfig {
  enabled: boolean
  maxRetries: number
  retryDelay: number
  retryCondition: (error: ApiError) => boolean
  backoffStrategy: 'linear' | 'exponential' | 'fixed'
}

// ============================================
// API Validation Types
// ============================================

/** API validator */
export interface ApiValidator<T = unknown> {
  validate: (data: T) => ApiValidationError[]
  isValid: (data: T) => boolean
  schema: unknown
}

/** API validation error */
export interface ApiValidationError {
  field: string
  message: string
  code: string
  value?: unknown
}

// ============================================
// API Metrics Types
// ============================================

/** API metrics */
export interface ApiMetrics {
  requestCount: number
  successCount: number
  errorCount: number
  averageResponseTime: number
  lastRequestTime: number
  lastErrorTime: number
}

/** API monitor */
export interface ApiMonitor {
  start: () => void
  stop: () => void
  getMetrics: () => ApiMetrics
  reset: () => void
  onRequest: (config: ApiRequestConfig) => void
  onResponse: (response: ApiResponse) => void
  onError: (error: ApiError) => void
}

// ============================================
// API Middleware Types
// ============================================

/** API middleware */
export interface ApiMiddleware {
  name: string
  order: number
  beforeRequest?: (config: ApiRequestConfig) => ApiRequestConfig | Promise<ApiRequestConfig>
  afterResponse?: (response: ApiResponse) => ApiResponse | Promise<ApiResponse>
  onError?: (error: ApiError) => ApiError | Promise<ApiError>
}

/** API middleware chain */
export interface ApiMiddlewareChain {
  add: (middleware: ApiMiddleware) => void
  remove: (name: string) => void
  clear: () => void
  execute: (config: ApiRequestConfig) => Promise<ApiResponse>
}