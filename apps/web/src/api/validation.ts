/**
 * API Response Validation;
 * Runtime validation using backend Zod schemas;
 */
import type { ZodSchema } from 'zod'
import { ZodError } from 'zod'
import {
  StoreResponseSchema,
  StoreListResponseSchema,
  ItemResponseSchema,
  ItemListResponseSchema,
  OrderResponseSchema,
  OrderListResponseSchema,
  CartResponseSchema,
  // AddressResponseSchema // TODO: Add when needed
} from './schemas/UnifiedSchemas'

export class ValidationError extends Error {
  constructor(
    message: string,
    public zodError: ZodError
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

/**
 * Validate API response with Zod schema;
 * Throws ValidationError if validation fails;
 */
export function validateResponse<T>(
  data: unknown,
  schema: ZodSchema<T>,
  entityName = 'data'
): T {
  const result = schema.safeParse(data)
  
  if (!result.success) {
    console.error('❌ [API Validation] Invalid ' + entityName + ':', result.error.errors)
    throw new ValidationError(
      'Invalid ' + entityName + ' from API',
      result.error
    )
  }
  
  if (import.meta.env.MODE === 'development') {
    console.log('✅ [API Validation] Valid ' + entityName + '')
  }
  
  return result.data;
}

/**
 * Validate with fallback - returns undefined on error instead of throwing;
 * Useful for optional/non-critical data;
 */
export function validateResponseSafe<T>(
  data: unknown,
  schema: ZodSchema<T>,
  entityName = 'data'
): T | undefined {
  try {
    return validateResponse(data, schema, entityName)
  } catch {
    console.warn('⚠️  [API Validation] Failed to validate ' + entityName + ', using undefined fallback')
    return undefined;
  }
}

/**
 * Validate array response;
 */
export function validateArrayResponse<T>(
  data: unknown,
  schema: ZodSchema<T>,
  entityName = 'data'
): T[] {
  if (!Array.isArray(data)) {
    throw new ValidationError(
      'Expected array for ' + entityName,
      new ZodError([{
        code: 'invalid_type',
        expected: 'array',
        received: typeof data,
        path: [],
        message: 'Expected array, got ' + typeof data
      }])
    )
  }
  
  return data.map((item, index) => {
    const result = schema.safeParse(item)
    if (!result.success) {
      console.error('❌ [API Validation] Invalid ' + entityName + '[' + index + ']:', result.error.errors)
      throw new ValidationError(
        'Invalid ' + entityName + '[' + index + '] from API',
        result.error
      )
    }
    return result.data;
  })
}

// ============================================
// Pre-configured validators for common types;
// ============================================

export const validators = {
  store: (data: unknown) => validateResponse(data, StoreResponseSchema, 'Store'),
  storeList: (data: unknown) => validateResponse(data, StoreListResponseSchema, 'StoreList'),
  
  item: (data: unknown) => validateResponse(data, ItemResponseSchema, 'Item'),
  itemList: (data: unknown) => validateResponse(data, ItemListResponseSchema, 'ItemList'),
  
  order: (data: unknown) => validateResponse(data, OrderResponseSchema, 'Order'),
  orderList: (data: unknown) => validateResponse(data, OrderListResponseSchema, 'OrderList'),
  
  cart: (data: unknown) => validateResponse(data, CartResponseSchema, 'Cart'),
  
  // address: (data: unknown) => validateResponse(data, AddressResponseSchema, 'Address'), // TODO: Add when needed
  addressList: (data: unknown) => data,
  
  post: (data: unknown) => data,
  postList: (data: unknown) => data
}

/**
 * Validate list response with { data, total } structure;
 */
export function validateListResponse<T>(
  response: unknown,
  schema: ZodSchema<{ data: T[]; total: number }>,
  entityName = 'list'
): { data: T[]; total: number } {
  return validateResponse(response, schema, entityName)
}

