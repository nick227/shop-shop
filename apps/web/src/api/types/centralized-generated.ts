/**
 * Simple Centralized Type Management
 * 
 * This file serves as the single source of truth for all type management:
 * 1. Core type re-exports
 * 2. Frontend type extensions and computed fields
 * 3. Type validation utilities
 */

// ============================================
// Core Type Re-exports
// ============================================

export type {
  // Core response types
  StoreResponse,
  ItemResponse,
  OrderResponse,
  AddressResponse,
  Bundle,
  CartResponse,
  PromotionResponse,
  UserResponse,
  
  // Extended types from backend-types
  OrderItem,
  AddressSnapshot,
  MediaItem,
  BundleItem,
  BundlePricing,
  CartItemData,
  CartWithTotals,
  CreateOrderInput,
  CreateAddressInput,
  CreatePostInput
} from '../backend-types'

// ============================================
// SDK Response Types (re-exported for mappers)
// ============================================
export type {
  AuthResponse,
  PaymentIntentResponse,
  TipResponse,
  UserPublicResponse
} from '@packages/sdk'

// ============================================
// SDK List Item Types (re-exported for generators)
// ============================================
// Expose all List*200ResponseDataInner types so generated mappers can import from './types'
export type {
  ListUsers200ResponseDataInner,
  ListStores200ResponseDataInner,
  ListItems200ResponseDataInner,
  ListCarts200ResponseDataInner,
  ListOrders200ResponseDataInner,
  ListBundles200ResponseDataInner
} from '@packages/sdk'

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