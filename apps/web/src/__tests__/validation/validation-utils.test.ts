/**
 * Comprehensive Validation Utilities Test Coverage
 * Tests validation utility functions and error handling
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { validationUtils, ValidationError } from './mocks/validators'
import { z } from 'zod'

describe('Validation Utilities', () => {
  describe('isValidationError', () => {
    it('should identify ValidationError instances', () => {
      const validationError = new ValidationError('Test error', 'testField', [])
      expect(validationUtils.isValidationError(validationError)).toBe(true)
    })

    it('should reject regular Error instances', () => {
      const regularError = new Error('Regular error')
      expect(validationUtils.isValidationError(regularError)).toBe(false)
    })

    it('should reject non-Error objects', () => {
      expect(validationUtils.isValidationError('string')).toBe(false)
      expect(validationUtils.isValidationError(123)).toBe(false)
      expect(validationUtils.isValidationError(null)).toBe(false)
      expect(validationUtils.isValidationError()).toBe(false)
      expect(validationUtils.isValidationError({})).toBe(false)
    })

    it('should reject Error subclasses that are not ValidationError', () => {
      class CustomError extends Error {
        constructor(message: string) {
          super(message)
          this.name = 'CustomError'
        }
      }

      const customError = new CustomError('Custom error')
      expect(validationUtils.isValidationError(customError)).toBe(false)
    })
  })

  describe('getValidationDetails', () => {
    it('should extract validation details from ValidationError', () => {
      const errors = [
        { 
          path: ['field1'], 
          message: 'Field 1 is required', 
          code: 'invalid_type' as const 
        },
        { 
          path: ['field2', 'nested'], 
          message: 'Field 2 is too small', 
          code: 'too_small' as const 
        }
      ]
      const validationError = new ValidationError('Validation failed', 'testField', errors as any)
      const details = validationUtils.getValidationDetails(validationError)
      
      expect(details.field).toBe('testField')
      expect(details.errors).toHaveLength(2)
      expect(details.errors[0]).toEqual({
        path: 'field1',
        message: 'Field 1 is required',
        code: 'invalid_type'
      })
      expect(details.errors[1]).toEqual({
        path: 'field2.nested',
        message: 'Field 2 is too small',
        code: 'too_small'
      })
    })

    it('should handle empty errors array', () => {
      const validationError = new ValidationError('Validation failed', 'testField', [])
      const details = validationUtils.getValidationDetails(validationError)
      
      expect(details.field).toBe('testField')
      expect(details.errors).toHaveLength(0)
    })

    it('should handle complex path arrays', () => {
      const errors = [
        { 
          path: ['users', 0, 'email'], 
          message: 'Invalid email', 
          code: 'invalid_string' as const 
        }
      ]
      const validationError = new ValidationError('Validation failed', 'testField', errors as any)
      const details = validationUtils.getValidationDetails(validationError)
      
      expect(details.errors[0].path).toBe('users.0.email')
    })
  })

  describe('formatValidationError', () => {
    it('should format single validation error', () => {
      const errors = [
        { 
          path: ['email'], 
          message: 'Invalid email format', 
          code: 'invalid_string' as const 
        }
      ]
      const validationError = new ValidationError('Validation failed', 'user', errors as any)
      const formatted = validationUtils.formatValidationError(validationError)
      
      expect(formatted).toBe('user validation failed: email: Invalid email format')
    })

    it('should format multiple validation errors', () => {
      const errors = [
        { 
          path: ['email'], 
          message: 'Invalid email format', 
          code: 'invalid_string' as const 
        },
        { 
          path: ['password'], 
          message: 'Password too short', 
          code: 'too_small' as const 
        }
      ]
      const validationError = new ValidationError('Validation failed', 'user', errors as any)
      const formatted = validationUtils.formatValidationError(validationError)
      
      expect(formatted).toBe('user validation failed: email: Invalid email format, password: Password too short')
    })

    it('should handle empty errors array', () => {
      const validationError = new ValidationError('Validation failed', 'user', [])
      const formatted = validationUtils.formatValidationError(validationError)
      
      expect(formatted).toBe('user validation failed: ')
    })

    it('should handle complex nested paths', () => {
      const errors = [
        { 
          path: ['address', 'street'], 
          message: 'Street is required', 
          code: 'invalid_type' as const 
        },
        { 
          path: ['items', 0, 'quantity'], 
          message: 'Quantity must be positive', 
          code: 'too_small' as const 
        }
      ]
      const validationError = new ValidationError('Validation failed', 'order', errors as any)
      const formatted = validationUtils.formatValidationError(validationError)
      
      expect(formatted).toBe('order validation failed: address.street: Street is required, items.0.quantity: Quantity must be positive')
    })
  })

  describe('validateData', () => {
    const testSchema = z.object({
      name: z.string().min(1, 'Name is required'),
      email: z.string().email('Invalid email'),
      age: z.number().min(0, 'Age must be positive')
    })

    const createTestValidator = (schema: z.ZodSchema) => (data: unknown) => {
      return schema.parse(data)
    }

    it('should return success for valid data', () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 25
      }

      const validator = createTestValidator(testSchema)
      const result = validationUtils.validateData(validator, validData)
      
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validData)
      }
    })

    it('should return error for invalid data', () => {
      const invalidData = {
        name: '', // Invalid: empty name
        email: 'invalid-email', // Invalid: bad email format
        age: -5 // Invalid: negative age
      }

      const validator = createTestValidator(testSchema)
      const result = validationUtils.validateData(validator, invalidData)
      
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ValidationError)
        expect(result.error.field).toBe('unknown')
      }
    })

    it('should handle unexpected errors', () => {
      const validator = () => {
        throw new Error('Unexpected error')
      }

      const result = validationUtils.validateData(validator, {})
      
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ValidationError)
        expect(result.error.message).toBe('Unknown validation error')
      }
    })

    it('should handle non-ValidationError exceptions', () => {
      const validator = () => {
        throw new TypeError('Type error')
      }

      const result = validationUtils.validateData(validator, {})
      
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ValidationError)
        expect(result.error.message).toBe('Unknown validation error')
      }
    })
  })

  describe('validateMultiple', () => {
    const testSchema = z.object({
      id: z.string(),
      name: z.string().min(1, 'Name is required'),
      value: z.number().min(0, 'Value must be positive')
    })

    const createTestValidator = (schema: z.ZodSchema) => (data: unknown) => {
      return schema.parse(data)
    }

    it('should validate multiple valid items', () => {
      const validItems = [
        { id: '1', name: 'Item 1', value: 10 },
        { id: '2', name: 'Item 2', value: 20 },
        { id: '3', name: 'Item 3', value: 30 }
      ]

      const validator = createTestValidator(testSchema)
      const result = validationUtils.validateMultiple(validator, validItems)
      
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toHaveLength(3)
        expect(result.data[0]).toEqual(validItems[0])
        expect(result.data[1]).toEqual(validItems[1])
        expect(result.data[2]).toEqual(validItems[2])
      }
    })

    it('should return errors for invalid items', () => {
      const mixedItems = [
        { id: '1', name: 'Valid Item', value: 10 }, // Valid
        { id: '2', name: '', value: 20 }, // Invalid: empty name
        { id: '3', name: 'Another Valid Item', value: 30 }, // Valid
        { id: '4', name: 'Invalid Item', value: -5 } // Invalid: negative value
      ]

      const validator = createTestValidator(testSchema)
      const result = validationUtils.validateMultiple(validator, mixedItems)
      
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors).toHaveLength(2) // Two invalid items
        expect(result.errors[0]).toBeInstanceOf(ValidationError)
        expect(result.errors[1]).toBeInstanceOf(ValidationError)
      }
    })

    it('should handle empty array', () => {
      const validator = createTestValidator(testSchema)
      const result = validationUtils.validateMultiple(validator, [])
      
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toHaveLength(0)
      }
    })

    it('should handle all invalid items', () => {
      const invalidItems = [
        { id: '1', name: '', value: 10 }, // Invalid: empty name
        { id: '2', name: 'Item 2', value: -20 }, // Invalid: negative value
        { id: '3', name: '', value: -30 } // Invalid: both empty name and negative value
      ]

      const validator = createTestValidator(testSchema)
      const result = validationUtils.validateMultiple(validator, invalidItems)
      
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors).toHaveLength(3) // All items invalid
        for (const error of result.errors) {
          expect(error).toBeInstanceOf(ValidationError)
        }
      }
    })
  })

  describe('createSafeValidator', () => {
    const testSchema = z.object({
      name: z.string().min(1, 'Name is required'),
      email: z.string().email('Invalid email')
    })

    const createTestValidator = (schema: z.ZodSchema) => (data: unknown) => {
      return schema.parse(data)
    }

    it('should create a safe validator that returns success for valid data', () => {
      const validator = createTestValidator(testSchema)
      const safeValidator = validationUtils.createSafeValidator(validator)
      
      const validData = {
        name: 'John Doe',
        email: 'john@example.com'
      }

      const result = safeValidator(validData)
      
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validData)
      }
    })

    it('should create a safe validator that returns error for invalid data', () => {
      const validator = createTestValidator(testSchema)
      const safeValidator = validationUtils.createSafeValidator(validator)
      
      const invalidData = {
        name: '', // Invalid: empty name
        email: 'invalid-email' // Invalid: bad email format
      }

      const result = safeValidator(invalidData)
      
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ValidationError)
      }
    })

    it('should handle unexpected errors in safe validator', () => {
      const validator = () => {
        throw new Error('Unexpected error')
      }
      const safeValidator = validationUtils.createSafeValidator(validator)
      
      const result = safeValidator({})
      
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ValidationError)
        expect(result.error.message).toBe('Unknown validation error')
      }
    })

    it('should work with different data types', () => {
      const stringSchema = z.string().min(1, 'String is required')
      const stringValidator = createTestValidator(stringSchema)
      const safeStringValidator = validationUtils.createSafeValidator(stringValidator)
      
      // Test valid string
      const validResult = safeStringValidator('hello')
      expect(validResult.success).toBe(true)
      if (validResult.success) {
        expect(validResult.data).toBe('hello')
      }
      
      // Test invalid string
      const invalidResult = safeStringValidator('')
      expect(invalidResult.success).toBe(false)
      if (!invalidResult.success) {
        expect(invalidResult.error).toBeInstanceOf(ValidationError)
      }
    })
  })

  describe('Error Handling Edge Cases', () => {
    it('should handle null and undefined data gracefully', () => {
      const testSchema = z.object({
        name: z.string()
      })
      const validator = (data: unknown) => testSchema.parse(data)
      
      const nullResult = validationUtils.validateData(validator, null)
      expect(nullResult.success).toBe(false)
      
      const undefinedResult = validationUtils.validateData(validator)
      expect(undefinedResult.success).toBe(false)
    })

    it('should handle non-object data in object schemas', () => {
      const testSchema = z.object({
        name: z.string()
      })
      const validator = (data: unknown) => testSchema.parse(data)
      
      const stringResult = validationUtils.validateData(validator, 'string')
      expect(stringResult.success).toBe(false)
      
      const numberResult = validationUtils.validateData(validator, 123)
      expect(numberResult.success).toBe(false)
      
      const arrayResult = validationUtils.validateData(validator, [])
      expect(arrayResult.success).toBe(false)
    })

    it('should preserve error details in ValidationError', () => {
      const testSchema = z.object({
        name: z.string().min(1, 'Name is required'),
        email: z.string().email('Invalid email')
      })
      
      const validator = (data: unknown) => testSchema.parse(data)
      const result = validationUtils.validateData(validator, { name: '', email: 'invalid' })
      
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ValidationError)
        expect(result.error.field).toBe('unknown')
        expect(result.error.errors).toBeDefined()
      }
    })
  })
})
