/**
 * Request Validation Schemas
 * Maps API endpoints to their corresponding Zod validation schemas
 */

import { z } from 'zod'
import {
  SignupInputSchema,
  LoginInputSchema,
  CreateStoreInputSchema,
  UpdateStoreInputSchema,
  CreateItemInputSchema,
  UpdateItemInputSchema,
  CreateOrderInputSchema,
  // TODO: Add these schemas when needed
  // CreateAddressInputSchema,
  // UpdateAddressInputSchema,
  // CreateBundleInputSchema,
  // UpdateBundleInputSchema,
  // CreatePromotionInputSchema,
  // UpdatePromotionInputSchema,
  // CreatePaymentIntentInputSchema,
  // CreateTipInputSchema,
  // UpdateTipInputSchema,
} from './UnifiedSchemas'

// Import cart schemas directly from packages
import {
  AddToCartInputSchema,
  UpdateCartItemInputSchema,
} from '@packages/schemas'

/**
 * Request validation schemas mapped by endpoint and method
 */
export const REQUEST_VALIDATION_SCHEMAS: Record<string, z.ZodSchema> = {
  // Auth endpoints
  'POST_auth_signup': SignupInputSchema,
  'POST_auth_login': LoginInputSchema,
  
  // Store endpoints
  'POST_stores': CreateStoreInputSchema,
  'PUT_stores': UpdateStoreInputSchema,
  'PATCH_stores': UpdateStoreInputSchema,
  
  // Item endpoints
  'POST_items': CreateItemInputSchema,
  'PUT_items': UpdateItemInputSchema,
  'PATCH_items': UpdateItemInputSchema,
  
  // Order endpoints
  'POST_orders': CreateOrderInputSchema,
  
  // Address endpoints - TODO: Add schemas when needed
  'POST_addresses': z.object({}), // Placeholder
  'PUT_addresses': z.object({}), // Placeholder
  'PATCH_addresses': z.object({}), // Placeholder
  
  // Bundle endpoints - TODO: Add schemas when needed
  'POST_bundles': z.object({}), // Placeholder
  'PUT_bundles': z.object({}), // Placeholder
  'PATCH_bundles': z.object({}), // Placeholder
  
  // Cart endpoints
  'POST_carts_items': AddToCartInputSchema,
  'PUT_carts_items': UpdateCartItemInputSchema,
  'PATCH_carts_items': UpdateCartItemInputSchema,
  
  // Promotion endpoints - TODO: Add schemas when needed
  'POST_promotions': z.object({}), // Placeholder
  'PUT_promotions': z.object({}), // Placeholder
  'PATCH_promotions': z.object({}), // Placeholder
  
  // Payment endpoints - TODO: Add schemas when needed
  'POST_payments_create-intent': z.object({}), // Placeholder
  
  // Tip endpoints - TODO: Add schemas when needed
  'POST_tips': z.object({}), // Placeholder
  'PUT_tips': z.object({}), // Placeholder
  'PATCH_tips': z.object({}), // Placeholder
}

/**
 * Get validation schema for a specific endpoint and method
 */
export function getRequestValidationSchema(
  endpoint: string,
  method: string
): z.ZodSchema | null {
  const key = `${method.toUpperCase()}_${endpoint}`
  return REQUEST_VALIDATION_SCHEMAS[key] || null
}

/**
 * Add a new validation schema for an endpoint
 */
export function addRequestValidationSchema(
  endpoint: string,
  method: string,
  schema: z.ZodSchema
): void {
  const key = `${method.toUpperCase()}_${endpoint}`
  REQUEST_VALIDATION_SCHEMAS[key] = schema
}

/**
 * Remove validation schema for an endpoint
 */
export function removeRequestValidationSchema(
  endpoint: string,
  method: string
): void {
  const key = `${method.toUpperCase()}_${endpoint}`
  delete REQUEST_VALIDATION_SCHEMAS[key]
}

/**
 * Get all registered schemas
 */
export function getAllRequestValidationSchemas(): Record<string, z.ZodSchema> {
  return { ...REQUEST_VALIDATION_SCHEMAS }
}
