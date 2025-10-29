/**
 * Simplified Centralized Type Management
 * 
 * This file serves as the single source of truth for all type management:
 * 1. SDK type imports and re-exports
 * 2. Frontend type extensions and computed fields
 * 3. Type conflict resolution
 */

// ============================================
// Core SDK Type Imports
// ============================================

import type {
  // Store types
  StoreResponse as SDKStoreResponse,
  
  // Item types
  ItemResponse as SDKItemResponse,
  
  // Order types
  OrderResponse as SDKOrderResponse,
  UpdateOrderInput,
  UpdateOrderRequestStatusEnum,
  
  // Address types
  AddressResponse as SDKAddressResponse,
  CreateAddressInput,
  UpdateAddressInput,
  
  // Cart types
  CartResponse as SDKCartResponse,
  AddToCartInput,
  UpdateCartInput,
  
  // Bundle types
  BundleResponse as SDKBundleResponse,
  CreateBundleInput,
  UpdateBundleInput,
  
  // Payment types
  CreatePaymentIntent200Response,
  InitiateStripeConnect200Response,
  GetStripeConnectStatus200Response,
  CreatePaymentIntentInput,
  
  // Media types
  MediaResponse as SDKMediaResponse,
  CreateMediaInput,
  
  // Promotion types
  PromotionResponse as SDKPromotionResponse,
  CreatePromotionInput,
  UpdatePromotionInput,
  
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
} from '../types'

// ============================================
// Frontend Type Extensions
// ============================================

export interface StoreResponse extends SDKStoreResponse {
  // Add any frontend-specific computed fields here
}

export interface ItemResponse extends SDKItemResponse {
  // Add any frontend-specific computed fields here
}

export interface OrderResponse extends SDKOrderResponse {
  // Add any frontend-specific computed fields here
  statusProgress?: number
  estimatedDelivery?: Date
  isOverdue?: boolean
}

export interface AddressResponse extends SDKAddressResponse {
  // Add any frontend-specific computed fields here
}

export interface CartResponse extends SDKCartResponse {
  // Add any frontend-specific computed fields here
}

export interface BundleResponse extends SDKBundleResponse {
  // Add any frontend-specific computed fields here
}

export interface PromotionResponse extends SDKPromotionResponse {
  // Add any frontend-specific computed fields here
}

export interface TipResponse extends SDKTipResponse {
  // Add any frontend-specific computed fields here
}

export interface MediaResponse extends SDKMediaResponse {
  // Add any frontend-specific computed fields here
}

// ============================================
// Re-exports for backward compatibility
// ============================================

export type {
  // Input types
  CreateAddressInput,
  UpdateAddressInput,
  AddToCartInput,
  UpdateCartInput,
  CreateBundleInput,
  UpdateBundleInput,
  CreatePaymentIntentInput,
  CreateMediaInput,
  CreatePromotionInput,
  UpdatePromotionInput,
  CreateTipInput,
  UpdateTipInput,
  ProcessTipInput,
  CreateUserInput,
  UpdateUserInput,
  UpdateOrderInput,
  
  // Response types
  UserPublicResponse,
  UpdateOrderRequestStatusEnum,
  CreatePaymentIntent200Response,
  InitiateStripeConnect200Response,
  GetStripeConnectStatus200Response,
  
  // Common types
  BaseApiResponse,
  PaginatedApiResponse,
  ApiError
}

// ============================================
// Type Validation Utilities
// ============================================

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
   * Validate that an input has required fields
   */
  validateInput: <T extends Record<string, any>>(
    input: any,
    requiredFields: (keyof T)[]
  ): input is T => {
    return (
      typeof input === 'object' &&
      input !== null &&
      requiredFields.every(field => field in input)
    )
  }
}
