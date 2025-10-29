/**
 * Centralized Type Management - SDK-First Architecture
 * 
 * This file serves as the single source of truth for all type management:
 * 1. SDK type imports and re-exports
 * 2. Frontend type extensions and computed fields
 * 3. Type conflict resolution
 * 4. Version management for SDK updates
 * 5. Type validation and consistency checks
 */

// ============================================
// SDK Type Imports - Single Point of Change
// ============================================

// Core SDK types - these are the ONLY direct SDK imports allowed
import type {
  // Auth types
  
  
  UserResponse,
  
  
  // Store types
  StoreResponse as SDKStoreResponse,
  
  
  
  
  // Item types
  ItemResponse as SDKItemResponse,
  
  
  
  
  // Order types
  OrderResponse as SDKOrderResponse,
  
  UpdateOrderInput,
  ListOrders200ResponseDataInner,
  UpdateOrderRequestStatusEnum,
  
  // Address types
  AddressResponse as SDKAddressResponse,
  CreateAddressInput,
  UpdateAddressInput,
  ListAddresss200ResponseDataInner,
  
  // Cart types
  CartResponse as SDKCartResponse,
  AddToCartInput,
  UpdateCartInput,
  ListCarts200ResponseDataInner,
  
  // Bundle types
  BundleResponse as SDKBundleResponse,
  CreateBundleInput,
  UpdateBundleInput,
  ListBundles200ResponseDataInner,
  
  // Payment types
  CreatePaymentIntent200Response,
  InitiateStripeConnect200Response,
  GetStripeConnectStatus200Response,
  CreatePaymentIntentInput,
  
  // Media types
  MediaResponse as SDKMediaResponse,
  CreateMediaInput,
  ListMedia200ResponseDataInner,
  
  // Promotion types
  PromotionResponse as SDKPromotionResponse,
  CreatePromotionInput,
  UpdatePromotionInput,
  ListPromotions200ResponseDataInner,
  
  // Tip types
  TipResponse as SDKTipResponse,
  CreateTipInput,
  UpdateTipInput,
  ProcessTipInput,
  
  // User types
  UserPublicResponse,
  CreateUserInput,
  UpdateUserInput,
  
  // Common types
  BaseApiResponse,
  PaginatedApiResponse,
  ApiError
} from '@packages/sdk'

// ============================================
// Type Conflict Resolution
// ============================================

/**
 * Resolve conflicts between SDK types and frontend expectations
 * This ensures type safety while maintaining SDK compatibility
 */

// Store types with frontend-expected fields
export interface StoreResponse extends Omit<SDKStoreResponse, 'id' | 'createdAt' | 'updatedAt'> {
  id: string
  createdAt: string
  updatedAt: string
  // Additional frontend-specific fields
  isActive?: boolean
  isVerified?: boolean
  rating?: number
  reviewCount?: number
}

// Item types with frontend-expected fields
export interface ItemResponse extends Omit<SDKItemResponse, 'id' | 'createdAt' | 'updatedAt'> {
  id: string
  createdAt: string
  updatedAt: string
  // Additional frontend-specific fields
  isAvailable?: boolean
  isFeatured?: boolean
  discountPercentage?: number
  finalPrice?: number
}

// Order types with frontend-expected fields
export interface OrderResponse extends Omit<SDKOrderResponse, 'id' | 'createdAt' | 'updatedAt'> {
  id: string
  createdAt: string
  updatedAt: string
  // Additional frontend-specific fields
  statusProgress?: number
  estimatedDelivery?: Date
  isOverdue?: boolean
}

// Address types with frontend-expected fields
export interface AddressResponse extends Omit<SDKAddressResponse, 'id' | 'createdAt' | 'updatedAt'> {
  id: string
  createdAt: string
  updatedAt: string
  // Additional frontend-specific fields
  isDefault?: boolean
  coordinates?: { lat: number; lng: number }
  fullAddress?: string
}

// Cart types with frontend-expected fields
export interface CartResponse extends Omit<SDKCartResponse, 'id' | 'createdAt' | 'updatedAt'> {
  id: string
  createdAt: string
  updatedAt: string
  // Additional frontend-specific fields
  totalItems?: number
  totalPrice?: number
  isEmpty?: boolean
}

// Bundle types with frontend-expected fields
export interface BundleResponse extends Omit<SDKBundleResponse, 'id' | 'createdAt' | 'updatedAt'> {
  id: string
  createdAt: string
  updatedAt: string
  // Additional frontend-specific fields
  isActive?: boolean
  savingsAmount?: number
  itemCount?: number
}

// Media types with frontend-expected fields
export interface MediaResponse extends Omit<SDKMediaResponse, 'id' | 'createdAt' | 'updatedAt'> {
  id: string
  createdAt: string
  updatedAt: string
  // Additional frontend-specific fields
  url?: string
  thumbnailUrl?: string
  fileSize?: number
  mimeType?: string
}

// Promotion types with frontend-expected fields
export interface PromotionResponse extends Omit<SDKPromotionResponse, 'id' | 'createdAt' | 'updatedAt'> {
  id: string
  createdAt: string
  updatedAt: string
  // Additional frontend-specific fields
  isActive?: boolean
  usageCount?: number
  remainingUses?: number
}

// Tip types with frontend-expected fields
export interface TipResponse extends Omit<SDKTipResponse, 'id' | 'createdAt' | 'updatedAt'> {
  id: string
  createdAt: string
  updatedAt: string
  // Additional frontend-specific fields
  status?: string
  amount?: number
  percentage?: number
}

// ============================================
// Re-export SDK Types (No Conflicts)
// ============================================

// Input types (no conflicts, direct re-export)
export type {
  
  
  
  
  
  
  
  
  UpdateOrderInput,
  CreateAddressInput,
  UpdateAddressInput,
  AddToCartInput,
  UpdateCartInput,
  CreateBundleInput,
  UpdateBundleInput,
  CreatePaymentIntent200Response,
  InitiateStripeConnect200Response,
  GetStripeConnectStatus200Response,
  CreatePaymentIntentInput,
  CreateMediaInput,
  CreatePromotionInput,
  UpdatePromotionInput,
  CreateTipInput,
  UpdateTipInput,
  ProcessTipInput,
  CreateUserInput,
  UpdateUserInput,
  UserPublicResponse,
  UpdateOrderRequestStatusEnum,
  BaseApiResponse,
  PaginatedApiResponse,
  ApiError
}

// List response types (no conflicts, direct re-export)
export type {
  
  
  ListOrders200ResponseDataInner,
  ListAddresss200ResponseDataInner,
  ListCarts200ResponseDataInner,
  ListBundles200ResponseDataInner,
  ListMedia200ResponseDataInner,
  ListPromotions200ResponseDataInner
}

// ============================================
// Type Validation and Consistency
// ============================================

/**
 * Type validation utilities to ensure consistency
 */
export const typeValidation = {
  /**
   * Validate that a response has the expected frontend fields
   */
  validateResponse: <T extends { id: string; createdAt: string; updatedAt: string }>(
    response: any
  ): response is T => {
    return (
      typeof response === 'object' &&
      response !== null &&
      typeof response.id === 'string' &&
      typeof response.createdAt === 'string' &&
      typeof response.updatedAt === 'string'
    )
  },

  /**
   * Ensure response has frontend-expected fields
   */
  ensureFrontendFields: <T extends Record<string, any>>(response: T): T => {
    if (!response.id) {
      throw new Error('Response missing required id field')
    }
    if (!response.createdAt) {
      throw new Error('Response missing required createdAt field')
    }
    if (!response.updatedAt) {
      throw new Error('Response missing required updatedAt field')
    }
    return response
  }
}

// ============================================
// SDK Version Management
// ============================================

/**
 * SDK version information for update tracking
 */
export const SDK_VERSION = {
  current: '1.0.0', // Update this when SDK changes
  lastUpdated: '2024-01-15',
  breakingChanges: [] as string[],
  newFeatures: [] as string[]
}

/**
 * Check if SDK version has breaking changes
 */
export function hasBreakingChanges(newVersion: string): boolean {
  // Implementation for checking breaking changes
  return false // Placeholder
}

/**
 * Get migration guide for SDK updates
 */
export function getMigrationGuide(fromVersion: string, toVersion: string): string[] {
  // Implementation for generating migration guides
  return [] // Placeholder
}

// ============================================
// Type Safety Utilities
// ============================================

/**
 * Type-safe API response wrapper
 */
export interface ApiResponse<T> {
  data: T
  success: boolean
  error?: string
  timestamp: string
}

/**
 * Create type-safe API response
 */
export function createApiResponse<T>(data: T, error?: string): ApiResponse<T> {
  return {
    data,
    success: !error,
    error,
    timestamp: new Date().toISOString()
  }
}

/**
 * Type guard for API responses
 */
export function isApiResponse<T>(response: any): response is ApiResponse<T> {
  return (
    typeof response === 'object' &&
    response !== null &&
    'data' in response &&
    'success' in response &&
    'timestamp' in response
  )
}

export {type LoginInput, type SignupInput, type AuthResponse, type CreateStoreInput, type UpdateStoreInput, type ListStores200ResponseDataInner, type CreateItemInput, type UpdateItemInput, type ListItems200ResponseDataInner, type CreateOrderInput} from '@packages/sdk'