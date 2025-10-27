/**
 * Runtime Validation with Zod
 * ⚠️  AUTO-GENERATED - DO NOT EDIT MANUALLY
 * Generated from: Zod schemas
 * 
 * To regenerate: pnpm gen:validators
 */

import { z } from 'zod'
import { schemas } from './schemas'
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
 * Type-safe validator with proper error handling
 */
function createValidator<T>(schema: z.ZodSchema<T>, fieldName: string) {
  return (data: unknown): T => {
    try {
      const result = schema.parse(data)
      return result
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
  forgotPassword: createValidator(schemas.forgotPassword, 'forgotPassword'),
  resetPassword: createValidator(schemas.resetPassword, 'resetPassword'),
  
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
  createUser: createValidator(schemas.createUser, 'createUser'),
  updateUser: createValidator(schemas.updateUser, 'updateUser'),
}

/**
 * Validation utilities
 */
export const validationUtils = {
  /**
   * Check if error is a validation error
   */
  isValidationError: (error: unknown): error is ValidationError => {
    return error instanceof ValidationError
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
  formatValidationError: (error: ValidationError): string => {
    const details = validationUtils.getValidationDetails(error)
    const errorMessages = details.errors.map(err => 
      `${err.path}: ${err.message}`
    ).join(', ')
    
    return `${details.field} validation failed: ${errorMessages}`
  },
  
  /**
   * Validate data with error handling
   */
  validateData: <T>(validator: (data: unknown) => T, data: unknown): { success: true; data: T } | { success: false; error: ValidationError } => {
    try {
      const result = validator(data)
      return { success: true, data: result }
    } catch (error) {
      if (error instanceof ValidationError) {
        return { success: false, error }
      }
      return { 
        success: false, 
        error: new ValidationError('Unknown validation error', 'unknown', [])
      }
    }
  },
  
  /**
   * Validate multiple data items
   */
  validateMultiple: <T>(validator: (data: unknown) => T, dataArray: unknown[]): { success: true; data: T[] } | { success: false; errors: ValidationError[] } => {
    const results: T[] = []
    const errors: ValidationError[] = []
    
    for (let i = 0; i < dataArray.length; i++) {
      const result = validationUtils.validateData(validator, dataArray[i])
      if (result.success) {
        results.push(result.data)
      } else {
        errors.push(result.error)
      }
    }
    
    if (errors.length > 0) {
      return { success: false, errors }
    }
    
    return { success: true, data: results }
  },
  
  /**
   * Create a safe validator that returns a result instead of throwing
   */
  createSafeValidator: <T>(validator: (data: unknown) => T) => {
    return (data: unknown): { success: true; data: T } | { success: false; error: ValidationError } => {
      return validationUtils.validateData(validator, data)
    }
  },
}

export default validators
