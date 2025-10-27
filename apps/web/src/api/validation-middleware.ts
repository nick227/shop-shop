/**
 * Validation Middleware for API Wrapper
 * 
 * Provides runtime validation for API responses and requests
 * with proper error handling and logging
 */

/* eslint-disable sonarjs/cognitive-complexity */
/* eslint-disable unicorn/no-for-loop */

import { validators, ValidationError } from './validators'
import { logger } from '../utils/logger'

/**
 * Validation configuration
 */
export interface ValidationConfig {
  enableResponseValidation: boolean
  enableRequestValidation: boolean
  logValidationErrors: boolean
  throwOnValidationError: boolean
}

/**
 * Default validation configuration
 */
export const defaultValidationConfig: ValidationConfig = {
  enableResponseValidation: true,
  enableRequestValidation: false, // Disabled by default for performance
  logValidationErrors: true,
  throwOnValidationError: false, // Return validation errors instead of throwing
}

/**
 * Validation middleware class
 */
export class ValidationMiddleware {
  private config: ValidationConfig

  constructor(config: Partial<ValidationConfig> = {}) {
    this.config = { ...defaultValidationConfig, ...config }
  }

  /**
   * Validate API response data
   */
  validateResponse<T>(
    data: unknown,
    validator: (data: unknown) => T,
    fieldName: string
  ): { success: true; data: T } | { success: false; error: ValidationError } {
    if (!this.config.enableResponseValidation) {
      return { success: true, data: data as T }
    }

    try {
      const result = validator(data)
      
      if (this.config.logValidationErrors) {
        logger.debug(`✅ Response validation passed for ${fieldName}`)
      }
      
      return { success: true, data: result }
    } catch (error) {
      if (error instanceof ValidationError) {
        if (this.config.logValidationErrors) {
          logger.warn(`❌ Response validation failed for ${fieldName}:`, {
            field: error.field,
            errors: error.errors.map(err => ({
              path: err.path,
              message: err.message,
              code: err.code,
            })),
          })
        }

        if (this.config.throwOnValidationError) {
          throw error
        }

        return { success: false, error }
      }

      // Unexpected error
      const validationError = new ValidationError(
        `Unexpected validation error for ${fieldName}`,
        fieldName,
        []
      )

      if (this.config.logValidationErrors) {
        logger.error(`💥 Unexpected validation error for ${fieldName}:`, error)
      }

      if (this.config.throwOnValidationError) {
        throw validationError
      }

      return { success: false, error: validationError }
    }
  }

  /**
   * Validate API request data
   */
  validateRequest<T>(
    data: unknown,
    validator: (data: unknown) => T,
    fieldName: string
  ): { success: true; data: T } | { success: false; error: ValidationError } {
    if (!this.config.enableRequestValidation) {
      return { success: true, data: data as T }
    }

    return this.validateResponse(data, validator, fieldName)
  }

  /**
   * Validate list response data
   */
  validateListResponse<T>(
    data: unknown,
    validator: (data: unknown) => T,
    fieldName: string
  ): { success: true; data: T[] } | { success: false; error: ValidationError } {
    if (!this.config.enableResponseValidation) {
      return { success: true, data: data as T[] }
    }

    if (!Array.isArray(data)) {
      const error = new ValidationError(
        `Expected array for ${fieldName} list`,
        fieldName,
        []
      )

      if (this.config.logValidationErrors) {
        logger.warn(`❌ List validation failed for ${fieldName}: Expected array`)
      }

      if (this.config.throwOnValidationError) {
        throw error
      }

      return { success: false, error }
    }

    const results: T[] = []
    const errors: ValidationError[] = []

    for (let i = 0; i < data.length; i++) {
      const result = this.validateResponse(data[i], validator, `${fieldName}[${i}]`)
      if (result.success) {
        results.push(result.data)
      } else {
        errors.push(result.error)
      }
    }

    if (errors.length > 0) {
      const combinedError = new ValidationError(
        `List validation failed for ${fieldName}`,
        fieldName,
        errors.flatMap(err => err.errors)
      )

      if (this.config.logValidationErrors) {
        logger.warn(`❌ List validation failed for ${fieldName}:`, {
          totalItems: data.length,
          failedItems: errors.length,
          errors: errors.map(err => ({
            field: err.field,
            errorCount: err.errors.length,
          })),
        })
      }

      if (this.config.throwOnValidationError) {
        throw combinedError
      }

      return { success: false, error: combinedError }
    }

    if (this.config.logValidationErrors) {
      logger.debug(`✅ List validation passed for ${fieldName} (${results.length} items)`)
    }

    return { success: true, data: results }
  }

  /**
   * Update validation configuration
   */
  updateConfig(newConfig: Partial<ValidationConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  /**
   * Get current validation configuration
   */
  getConfig(): ValidationConfig {
    return { ...this.config }
  }
}

/**
 * Default validation middleware instance
 */
export const validationMiddleware = new ValidationMiddleware()

/**
 * Convenience functions for common validation patterns
 */
export const validateApiResponse = {
  store: (data: unknown) => validationMiddleware.validateResponse(data, validators.store, 'store'),
  storeList: (data: unknown) => validationMiddleware.validateListResponse(data, validators.store, 'storeList'),
  
  item: (data: unknown) => validationMiddleware.validateResponse(data, validators.item, 'item'),
  itemList: (data: unknown) => validationMiddleware.validateListResponse(data, validators.item, 'itemList'),
  
  order: (data: unknown) => validationMiddleware.validateResponse(data, validators.order, 'order'),
  orderList: (data: unknown) => validationMiddleware.validateListResponse(data, validators.order, 'orderList'),
  
  address: (data: unknown) => validationMiddleware.validateResponse(data, validators.address, 'address'),
  addressList: (data: unknown) => validationMiddleware.validateListResponse(data, validators.address, 'addressList'),
  
  cart: (data: unknown) => validationMiddleware.validateResponse(data, validators.cart, 'cart'),
  cartList: (data: unknown) => validationMiddleware.validateListResponse(data, validators.cart, 'cartList'),
  
  bundle: (data: unknown) => validationMiddleware.validateResponse(data, validators.bundle, 'bundle'),
  bundleList: (data: unknown) => validationMiddleware.validateListResponse(data, validators.bundle, 'bundleList'),
  
  promotion: (data: unknown) => validationMiddleware.validateResponse(data, validators.promotion, 'promotion'),
  promotionList: (data: unknown) => validationMiddleware.validateListResponse(data, validators.promotion, 'promotionList'),
  
  user: (data: unknown) => validationMiddleware.validateResponse(data, validators.user, 'user'),
  userList: (data: unknown) => validationMiddleware.validateListResponse(data, validators.user, 'userList'),
  
  // Note: Post validators removed - Posts API not available in SDK
}

export default validationMiddleware
