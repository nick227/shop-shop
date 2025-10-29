/**
 * Integration Tests for Validation System
 * Tests the complete validation flow from schemas to validators to utilities
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { validators, validationUtils, ValidationError } from './mocks/validators'
import { schemas } from './mocks/UnifiedSchemas'
import { z } from 'zod'

describe('Validation System Integration', () => {
  describe('Schema to Validator Integration', () => {
    it('should validate store data through complete flow', () => {
      const validStoreData = {
        id: 'store-123',
        name: 'Test Store',
        description: 'A test store',
        address: '123 Test St',
        city: 'Test City',
        state: 'TS',
        postalCode: '12345',
        phone: '555-1234',
        email: 'test@store.com',
        isActive: true,
        deliveryFee: 5.99,
        minimumOrder: 10,
        commissionRate: 0.05,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        ownerId: 'user-123'
      }

      // Test schema validation
      const schemaResult = schemas.store.safeParse(validStoreData)
      expect(schemaResult.success).toBe(true)

      // Test validator
      expect(() => validators.store(validStoreData)).not.toThrow()
      const validatorResult = validators.store(validStoreData)
      expect(validatorResult).toEqual(validStoreData)

      // Test validation utilities
      const utilityResult = validationUtils.validateData(validators.store, validStoreData)
      expect(utilityResult.success).toBe(true)
      if (utilityResult.success) {
        expect(utilityResult.data).toEqual(validStoreData)
      }
    })

    it('should handle validation errors consistently across all layers', () => {
      const invalidStoreData = {
        id: 'store-123',
        name: '', // Invalid: empty name
        email: 'invalid-email', // Invalid: bad email format
        // Missing required fields
      }

      // Test schema validation
      const schemaResult = schemas.store.safeParse(invalidStoreData)
      expect(schemaResult.success).toBe(false)

      // Test validator throws
      expect(() => validators.store(invalidStoreData)).toThrow(ValidationError)

      // Test validation utilities return error
      const utilityResult = validationUtils.validateData(validators.store, invalidStoreData)
      expect(utilityResult.success).toBe(false)
      if (!utilityResult.success) {
        expect(utilityResult.error).toBeInstanceOf(ValidationError)
      }
    })
  })

  describe('Array Validation Integration', () => {
    it('should validate store lists through complete flow', () => {
      const validStoreList = [
        {
          id: 'store-1',
          name: 'Store 1',
          description: 'Store 1 description',
          address: '123 St',
          city: 'City',
          state: 'ST',
          postalCode: '12345',
          phone: '555-0001',
          email: 'store1@test.com',
          isActive: true,
          deliveryFee: 5.99,
          minimumOrder: 10,
          commissionRate: 0.05,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          ownerId: 'user-1'
        },
        {
          id: 'store-2',
          name: 'Store 2',
          description: 'Store 2 description',
          address: '456 St',
          city: 'City',
          state: 'ST',
          postalCode: '54321',
          phone: '555-0002',
          email: 'store2@test.com',
          isActive: true,
          deliveryFee: 3.99,
          minimumOrder: 15,
          commissionRate: 0.03,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          ownerId: 'user-2'
        }
      ]

      // Test validator
      expect(() => validators.storeList(validStoreList)).not.toThrow()
      const validatorResult = validators.storeList(validStoreList)
      expect(validatorResult).toHaveLength(2)

      // Test validation utilities
      const utilityResult = validationUtils.validateMultiple(validators.store, validStoreList)
      expect(utilityResult.success).toBe(true)
      if (utilityResult.success) {
        expect(utilityResult.data).toHaveLength(2)
      }
    })

    it('should handle mixed valid/invalid arrays', () => {
      const mixedStoreList = [
        {
          id: 'store-1',
          name: 'Valid Store',
          description: 'Valid description',
          address: '123 St',
          city: 'City',
          state: 'ST',
          postalCode: '12345',
          phone: '555-0001',
          email: 'store1@test.com',
          isActive: true,
          deliveryFee: 5.99,
          minimumOrder: 10,
          commissionRate: 0.05,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          ownerId: 'user-1'
        },
        {
          id: 'store-2',
          name: '', // Invalid: empty name
          description: 'Invalid description',
          address: '456 St',
          city: 'City',
          state: 'ST',
          postalCode: '54321',
          phone: '555-0002',
          email: 'store2@test.com',
          isActive: true,
          deliveryFee: 3.99,
          minimumOrder: 15,
          commissionRate: 0.03,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          ownerId: 'user-2'
        }
      ]

      // Test validator should throw for invalid array
      expect(() => validators.storeList(mixedStoreList)).toThrow(ValidationError)

      // Test validation utilities should return errors
      const utilityResult = validationUtils.validateMultiple(validators.store, mixedStoreList)
      expect(utilityResult.success).toBe(false)
      if (!utilityResult.success) {
        expect(utilityResult.errors).toHaveLength(1) // One invalid item
      }
    })
  })

  describe('Form Validation Integration', () => {
    it('should validate form data through complete flow', () => {
      const validFormData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        confirmPassword: 'password123'
      }

      // Create a form schema
      const formSchema = z.object({
        name: z.string().min(1, 'Name is required'),
        email: z.string().email('Invalid email'),
        password: z.string().min(8, 'Password must be at least 8 characters'),
        confirmPassword: z.string()
      }).refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ["confirmPassword"]
      })

      const formValidator = (data: unknown) => formSchema.parse(data)

      // Test validation utilities
      const result = validationUtils.validateData(formValidator, validFormData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validFormData)
      }
    })

    it('should handle form validation errors', () => {
      const invalidFormData = {
        name: '', // Invalid: empty name
        email: 'invalid-email', // Invalid: bad email format
        password: '123', // Invalid: too short
        confirmPassword: 'different' // Invalid: doesn't match
      }

      const formSchema = z.object({
        name: z.string().min(1, 'Name is required'),
        email: z.string().email('Invalid email'),
        password: z.string().min(8, 'Password must be at least 8 characters'),
        confirmPassword: z.string()
      }).refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ["confirmPassword"]
      })

      const formValidator = (data: unknown) => formSchema.parse(data)

      // Test validation utilities
      const result = validationUtils.validateData(formValidator, invalidFormData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ValidationError)
        // The error should have validation issues
        expect(result.error.errors).toBeDefined()
      }
    })
  })

  describe('API Response Validation Integration', () => {
    it('should validate API responses through complete flow', () => {
      const mockApiResponse = {
        data: [
          {
            id: 'item-1',
            name: 'Item 1',
            description: 'Description 1',
            price: 9.99,
            stockQty: 100,
            isActive: true,
            storeId: 'store-1',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          },
          {
            id: 'item-2',
            name: 'Item 2',
            description: 'Description 2',
            price: 19.99,
            stockQty: 50,
            isActive: true,
            storeId: 'store-1',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          }
        ],
        total: 2,
        page: 1,
        limit: 10
      }

      // Test individual item validation
      const itemResults = validationUtils.validateMultiple(validators.item, mockApiResponse.data)
      expect(itemResults.success).toBe(true)
      if (itemResults.success) {
        expect(itemResults.data).toHaveLength(2)
      }

      // Test list validation
      expect(() => validators.itemList(mockApiResponse.data)).not.toThrow()
      const listResult = validators.itemList(mockApiResponse.data)
      expect(listResult).toHaveLength(2)
    })

    it('should handle API response validation errors', () => {
      const invalidApiResponse = {
        data: [
          {
            id: 'item-1',
            name: 'Valid Item',
            description: 'Valid description',
            price: 9.99,
            stockQty: 100,
            isActive: true,
            storeId: 'store-1',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          },
          {
            id: 'item-2',
            name: '', // Invalid: empty name
            description: 'Invalid description',
            price: -19.99, // Invalid: negative price
            stockQty: 50,
            isActive: true,
            storeId: 'store-1',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          }
        ],
        total: 2,
        page: 1,
        limit: 10
      }

      // Test individual item validation
      const itemResults = validationUtils.validateMultiple(validators.item, invalidApiResponse.data)
      expect(itemResults.success).toBe(false)
      if (!itemResults.success) {
        expect(itemResults.errors).toHaveLength(1) // One invalid item
      }

      // Test list validation should throw
      expect(() => validators.itemList(invalidApiResponse.data)).toThrow(ValidationError)
    })
  })

  describe('Error Propagation Integration', () => {
    it('should propagate validation errors consistently', () => {
      const invalidData = {
        name: '', // Invalid: empty name
        email: 'invalid-email', // Invalid: bad email format
        age: -5 // Invalid: negative age
      }

      const testSchema = z.object({
        name: z.string().min(1, 'Name is required'),
        email: z.string().email('Invalid email'),
        age: z.number().min(0, 'Age must be positive')
      })

      const validator = (data: unknown) => testSchema.parse(data)

      // Test direct schema validation
      const schemaResult = testSchema.safeParse(invalidData)
      expect(schemaResult.success).toBe(false)
      if (!schemaResult.success) {
        expect(schemaResult.error.issues).toHaveLength(3) // Three validation errors
      }

      // Test validator throws
      expect(() => validator(invalidData)).toThrow()

      // Test validation utilities
      const utilityResult = validationUtils.validateData(validator, invalidData)
      expect(utilityResult.success).toBe(false)
      if (!utilityResult.success) {
        expect(utilityResult.error).toBeInstanceOf(ValidationError)
      }
    })

    it('should handle nested validation errors', () => {
      const invalidNestedData = {
        user: {
          name: '', // Invalid: empty name
          email: 'invalid-email' // Invalid: bad email format
        },
        address: {
          street: '', // Invalid: empty street
          city: 'Valid City',
          state: 'VS',
          postalCode: 'invalid' // Invalid: bad postal code
        }
      }

      const nestedSchema = z.object({
        user: z.object({
          name: z.string().min(1, 'Name is required'),
          email: z.string().email('Invalid email')
        }),
        address: z.object({
          street: z.string().min(1, 'Street is required'),
          city: z.string().min(1, 'City is required'),
          state: z.string().length(2, 'State must be 2 characters'),
          postalCode: z.string().regex(/^\d{5}$/, 'Postal code must be 5 digits')
        })
      })

      const validator = (data: unknown) => nestedSchema.parse(data)

      // Test validation utilities
      const result = validationUtils.validateData(validator, invalidNestedData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ValidationError)
        // Should have validation errors
        expect(result.error.errors).toBeDefined()
      }
    })
  })

  describe('Performance Integration', () => {
    it('should handle large datasets efficiently', () => {
      // Create a large dataset
      const largeDataset = Array.from({ length: 1000 }, (_, index) => ({
        id: `item-${index}`,
        name: `Item ${index}`,
        description: `Description for item ${index}`,
        price: 9.99 + index,
        stockQty: 100,
        isActive: true,
        storeId: 'store-1',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      }))

      // Test validation utilities with large dataset
      const startTime = performance.now()
      const result = validationUtils.validateMultiple(validators.item, largeDataset)
      const endTime = performance.now()

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toHaveLength(1000)
      }

      // Should complete within reasonable time (adjust threshold as needed)
      expect(endTime - startTime).toBeLessThan(1000) // 1 second
    })

    it('should handle mixed valid/invalid large datasets', () => {
      // Create a large dataset with some invalid items
      const mixedDataset = Array.from({ length: 100 }, (_, index) => ({
        id: `item-${index}`,
        name: index % 10 === 0 ? '' : `Item ${index}`, // Every 10th item has empty name
        description: `Description for item ${index}`,
        price: index % 20 === 0 ? -9.99 : 9.99 + index, // Every 20th item has negative price
        stockQty: 100,
        isActive: true,
        storeId: 'store-1',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      }))

      // Test validation utilities
      const result = validationUtils.validateMultiple(validators.item, mixedDataset)
      expect(result.success).toBe(false)
      if (!result.success) {
        // Should have errors for invalid items (approximately 15% of items)
        expect(result.errors.length).toBeGreaterThan(0)
        expect(result.errors.length).toBeLessThan(50) // Should be less than half
      }
    })
  })

  describe('Type Safety Integration', () => {
    it('should maintain type safety through validation chain', () => {
      const validStoreData = {
        id: 'store-123',
        name: 'Test Store',
        description: 'A test store',
        address: '123 Test St',
        city: 'Test City',
        state: 'TS',
        postalCode: '12345',
        phone: '555-1234',
        email: 'test@store.com',
        isActive: true,
        deliveryFee: 5.99,
        minimumOrder: 10,
        commissionRate: 0.05,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        ownerId: 'user-123'
      }

      // Test that validated data maintains correct types
      const validatorResult = validators.store(validStoreData)
      expect(typeof validatorResult.id).toBe('string')
      expect(typeof validatorResult.name).toBe('string')
      expect(typeof validatorResult.deliveryFee).toBe('number')
      expect(typeof validatorResult.isActive).toBe('boolean')
      expect(validatorResult.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/)

      // Test validation utilities maintain types
      const utilityResult = validationUtils.validateData(validators.store, validStoreData)
      expect(utilityResult.success).toBe(true)
      if (utilityResult.success) {
        expect(typeof utilityResult.data.id).toBe('string')
        expect(typeof utilityResult.data.name).toBe('string')
        expect(typeof utilityResult.data.deliveryFee).toBe('number')
        expect(typeof utilityResult.data.isActive).toBe('boolean')
      }
    })
  })
})
