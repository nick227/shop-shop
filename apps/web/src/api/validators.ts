/**
 * Runtime Validation with Zod
 * ⚠️  AUTO-GENERATED - DO NOT EDIT MANUALLY
 * Generated from: Zod schemas
 * 
 * To regenerate: pnpm gen:validators
 */

import { z } from 'zod'
import { schemas } from './schemas/UnifiedSchemas'
import type { Bundle } from './backend-types'

/**
 * Custom validation error class
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public errors: z.ZodIssue[]
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

/**
 * Type-safe validator with proper error handling and strict validation
 */
function createValidator<T>(schema: z.ZodSchema<T>, fieldName: string) {
  return (data: unknown): T => {
    try {
      // Enable strict validation - no additional properties allowed
      return schema.parse(data)
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(
          `Validation failed for ${fieldName}`,
          fieldName,
          error.issues
        )
      }
      throw new ValidationError(
        `Unexpected validation error for ${fieldName}`,
        fieldName,
        []
      )
    }
  }
}

/**
 * Strict validator that rejects additional properties and provides detailed errors
 */
function createStrictValidator<T>(schema: z.ZodSchema<T>, fieldName: string) {
  return (data: unknown): T => {
    try {
      // Enable strict mode - no additional properties allowed
      return schema.parse(data)
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Enhanced error messages for strict validation
        const enhancedIssues = error.issues.map(issue => {
          if (issue.code === 'unrecognized_keys') {
            return {
              ...issue,
              message: `Unexpected property '${issue.keys?.[0]}' found. Only defined properties are allowed.`
            }
          }
          return issue
        })
        
        throw new ValidationError(
          `Strict validation failed for ${fieldName}`,
          fieldName,
          enhancedIssues
        )
      }
      throw new ValidationError(
        `Unexpected validation error for ${fieldName}`,
        fieldName,
        []
      )
    }
  }
}

/**
 * Runtime validators for API responses using comprehensive Zod schemas
 */
export const validators = {
  // Store validators
  store: createValidator(schemas.store, 'store'),
  storeList: createValidator(z.array(schemas.store), 'storeList'),
  
  // Item validators
  item: createValidator(schemas.item, 'item'),
  itemList: createValidator(z.array(schemas.item), 'itemList'),
  
  // Cart validators
  cart: createValidator(schemas.cart, 'cart'),
  cartList: createValidator(z.array(schemas.cart), 'cartList'),
  
  // Order validators
  order: createValidator(schemas.order, 'order'),
  orderList: createValidator(z.array(schemas.order), 'orderList'),
  
  // Address validators
  address: createValidator(schemas.address, 'address'),
  addressList: createValidator(z.array(schemas.address), 'addressList'),
  
  // Bundle validators
  bundle: createValidator(schemas.bundle, 'bundle'),
  bundleList: createValidator(z.array(schemas.bundle), 'bundleList'),
  
  // User validators
  user: createValidator(schemas.user, 'user'),
  userList: createValidator(z.array(schemas.user), 'userList'),
  
  // Promotion validators
  promotion: createValidator(schemas.promotion, 'promotion'),
  promotionList: createValidator(z.array(schemas.promotion), 'promotionList'),
  
  // Auth validators
  auth: createValidator(schemas.authResponse, 'auth'),
  login: createValidator(schemas.login, 'login'),
  signup: createValidator(schemas.signup, 'signup'),
  
  // Payment validators
  paymentIntent: createValidator(schemas.paymentIntent, 'paymentIntent'),
  createPaymentIntent: createValidator(schemas.createPaymentIntent, 'createPaymentIntent'),
  
  // Tip validators
  tip: createValidator(schemas.tip, 'tip'),
  tipList: createValidator(z.array(schemas.tip), 'tipList'),
  createTip: createValidator(schemas.createTip, 'createTip'),
  updateTip: createValidator(schemas.updateTip, 'updateTip'),
  
  // Media validators
  mediaUpload: createValidator(schemas.mediaUpload, 'mediaUpload'),
  mediaUploadMetadata: createValidator(schemas.mediaUploadMetadata, 'mediaUploadMetadata'),
  
  // Post & Comment validators (River features)
  post: createValidator(schemas.post, 'post'),
  postList: createValidator(z.array(schemas.post), 'postList'),
  comment: createValidator(schemas.comment, 'comment'),
  commentList: createValidator(z.array(schemas.comment), 'commentList'),
  media: createValidator(schemas.media, 'media'),
  mediaList: createValidator(z.array(schemas.media), 'mediaList'),

  // Input validators
  createStore: createValidator(schemas.createStore, 'createStore'),
  updateStore: createValidator(schemas.updateStore, 'updateStore'),
  createItem: createValidator(schemas.createItem, 'createItem'),
  updateItem: createValidator(schemas.updateItem, 'updateItem'),
  createOrder: createValidator(schemas.createOrder, 'createOrder'),
  createAddress: createValidator(schemas.createAddress, 'createAddress'),
  updateAddress: createValidator(schemas.updateAddress, 'updateAddress'),
  createBundle: createValidator(schemas.createBundle, 'createBundle'),
  updateBundle: createValidator(schemas.updateBundle, 'updateBundle'),
  addCartItem: createValidator(schemas.addCartItem, 'addCartItem'),
  updateCartItem: createValidator(schemas.updateCartItem, 'updateCartItem'),
  createPromotion: createValidator(schemas.createPromotion, 'createPromotion'),
  updatePromotion: createValidator(schemas.updatePromotion, 'updatePromotion'),
  
  // User validators
  createUser: createValidator(schemas.createUser, 'createUser'),
  updateUser: createValidator(schemas.updateUser, 'updateUser'),
  
  // Auth validators (additional)
  forgotPassword: createValidator(schemas.forgotPassword, 'forgotPassword'),
  resetPassword: createValidator(schemas.resetPassword, 'resetPassword'),
}

/**
 * Strict validators for critical data validation
 * These validators reject any additional properties and provide enhanced error messages
 */
export const strictValidators = {
  // Critical entity validators with strict validation
  store: createStrictValidator(schemas.store, 'store'),
  item: createStrictValidator(schemas.item, 'item'),
  order: createStrictValidator(schemas.order, 'order'),
  user: createStrictValidator(schemas.user, 'user'),
  
  // Input validators with strict validation
  createStore: createStrictValidator(schemas.createStore, 'createStore'),
  updateStore: createStrictValidator(schemas.updateStore, 'updateStore'),
  createItem: createStrictValidator(schemas.createItem, 'createItem'),
  updateItem: createStrictValidator(schemas.updateItem, 'updateItem'),
  createOrder: createStrictValidator(schemas.createOrder, 'createOrder'),
  
  // Auth validators with strict validation
  login: createStrictValidator(schemas.login, 'login'),
  signup: createStrictValidator(schemas.signup, 'signup'),
  auth: createStrictValidator(schemas.authResponse, 'auth'),
}

/**
 * Validation utilities with enhanced strict validation support
 */
export const validationUtils = {
  /**
   * Check if error is a validation error
   */
  isValidationError: (error: unknown): error is ValidationError => {
    return error instanceof ValidationError
  },

  /**
   * Validate with strict mode enabled
   */
  validateStrict: <T>(schema: z.ZodSchema<T>, data: unknown, fieldName: string): T => {
    return createStrictValidator(schema, fieldName)(data)
  },

  /**
   * Validate with detailed error reporting
   */
  validateWithDetails: <T>(schema: z.ZodSchema<T>, data: unknown, fieldName: string) => {
    try {
      const result = schema.parse(data)
      return { success: true, data: result, errors: [] }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const enhancedIssues = error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message,
          code: issue.code
        }))
        return { success: false, data: null, errors: enhancedIssues }
      }
      return { 
        success: false, 
        data: null, 
        errors: [{ field: fieldName, message: 'Unknown validation error', code: 'unknown' }]
      }
    }
  },

  /**
   * Batch validation with strict mode
   */
  validateBatchStrict: <T>(schema: z.ZodSchema<T>, items: unknown[], fieldName: string) => {
    const results: T[] = []
    const errors: ValidationError[] = []

    for (const [i, item] of items.entries()) {
      try {
        const result = createStrictValidator(schema, `${fieldName}[${i}]`)(item)
        results.push(result)
      } catch (error) {
        if (error instanceof ValidationError) {
          errors.push(error)
        }
      }
    }

    return { results, errors, success: errors.length === 0 }
  },

  /**
   * Check if data has unexpected properties
   */
  hasUnexpectedProperties: <T>(schema: z.ZodSchema<T>, data: unknown): string[] => {
    try {
      schema.parse(data)
      return []
    } catch (error) {
      if (error instanceof z.ZodError) {
        return error.issues
          .filter(issue => issue.code === 'unrecognized_keys')
          .map(issue => issue.keys?.[0])
          .filter(Boolean)
      }
      return []
    }
  },
  
  /**
   * Get validation error details
   */
  getValidationDetails: (error: ValidationError) => {
    return {
      field: error.field,
      errors: error.errors.map(err => ({
        path: Array.isArray(err.path) ? err.path.join('.') : String(err.path),
        message: err.message,
        code: err.code,
      })),
    }
  },
  
  /**
   * Format validation error for display
   */
  formatError: (error: ValidationError): string => {
    const details = validationUtils.getValidationDetails(error)
    if (details.errors.length === 0) return error.message
    
    const firstError = details.errors[0]
    return `${details.field}: ${firstError.message}`
  },

  /**
   * Validate and transform data with strict mode
   */
  validateAndTransform: <T, R>(
    schema: z.ZodSchema<T>, 
    data: unknown, 
    transformer: (validated: T) => R,
    fieldName: string
  ): R => {
    const validated = createStrictValidator(schema, fieldName)(data)
    return transformer(validated)
  },

  /**
   * Create a validator with custom error messages
   */
  createCustomValidator: <T>(
    schema: z.ZodSchema<T>, 
    fieldName: string,
    customMessages: Record<string, string> = {}
  ) => {
    return (data: unknown): T => {
      try {
        return schema.parse(data)
      } catch (error) {
        if (error instanceof z.ZodError) {
          const enhancedIssues = error.issues.map(issue => ({
            ...issue,
            message: customMessages[issue.code] || issue.message
          }))
          
          throw new ValidationError(
            `Validation failed for ${fieldName}`,
            fieldName,
            enhancedIssues
          )
        }
        throw new ValidationError(
          `Unexpected validation error for ${fieldName}`,
          fieldName,
          []
        )
      }
    }
  }
}

export default validators
