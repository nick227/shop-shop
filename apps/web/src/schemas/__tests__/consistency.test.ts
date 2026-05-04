/**
 * Schema Consistency Tests
 * Ensures all schemas are consistent across the application
 */

import { describe, it, expect } from 'vitest'
import { validateSchemaConsistency, getSchemaUsageStats, generateConsistencyReport } from '../SchemaConsistencyValidator'
import { schemas as consistentSchemas } from '../ConsistentSchemas'
const unifiedSchemas = consistentSchemas

describe('Schema Consistency', () => {
  describe('Schema Validation', () => {
    it('should validate all schemas are consistent', () => {
      const validation = validateSchemaConsistency()
      expect(validation.isValid).toBe(true)
      
      if (validation.errors.length > 0) {
        console.error('Schema validation errors:', validation.errors)
      }
      
      expect(validation.errors).toHaveLength(0)
    })

    it('should have no critical warnings', () => {
      const validation = validateSchemaConsistency()
      
      // Allow some warnings but not critical ones
      const criticalWarnings = validation.warnings.filter(w => 
        w.includes('missing') || w.includes('broken')
      )
      
      expect(criticalWarnings).toHaveLength(0)
    })
  })

  describe('Schema Completeness', () => {
    it('should have all required unified schemas', () => {
      const requiredSchemas = [
        'login',
        'signup',
        'authResponse',
        'user',
        'store',
        'createStore',
        'updateStore',
        'item',
        'createItem',
        'updateItem',
        'order',
        'createOrder',
        'cart',
        'address',
        'createAddress',
        'updateAddress',
        'bundle',
        'createBundle',
        'updateBundle',
        'promotion',
        'createPromotion',
        'updatePromotion',
        'paymentIntent',
        'createPaymentIntent',
        'tip',
        'createTip',
        'updateTip',
        'mediaUpload',
        'mediaUploadMetadata'
      ]

      for (const schemaName of requiredSchemas) {
        expect(schemaName in unifiedSchemas).toBe(true)
      }
    })

    it('should have all required consistent schemas', () => {
      const requiredSchemas = [
        'login',
        'signup',
        'authResponse',
        'user',
        'signupForm',
        'loginForm',
        'email',
        'password',
        'phone'
      ]

      for (const schemaName of requiredSchemas) {
        expect(schemaName in consistentSchemas).toBe(true)
      }
    })
  })

  describe('Schema Compatibility', () => {
    it('should have compatible login schemas', () => {
      const testData = {
        email: 'test@example.com',
        password: 'password123'
      }

      const unifiedResult = unifiedSchemas.login.safeParse(testData)
      const consistentResult = consistentSchemas.loginForm.safeParse(testData)

      expect(unifiedResult.success).toBe(true)
      expect(consistentResult.success).toBe(true)
    })

    it('should have compatible signup schemas', () => {
      const testData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      }

      const unifiedResult = unifiedSchemas.signup.safeParse(testData)
      const consistentResult = consistentSchemas.signupForm.safeParse(testData)

      expect(unifiedResult.success).toBe(true)
      expect(consistentResult.success).toBe(true)
    })

    it('should have compatible email validation', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'test+tag@example.org'
      ]

      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'test@',
        'test..test@example.com'
      ]

      for (const email of validEmails) {
        const result = consistentSchemas.email.safeParse(email)
        expect(result.success).toBe(true)
      }

      for (const email of invalidEmails) {
        const result = consistentSchemas.email.safeParse(email)
        expect(result.success).toBe(false)
      }
    })

    it('should have compatible password validation', () => {
      const validPasswords = [
        'password123',
        'SecurePass123!',
        'VeryLongPassword123'
      ]

      const invalidPasswords = [
        '123',
        'short',
        'password',
        ''
      ]

      for (const password of validPasswords) {
        const result = consistentSchemas.password.safeParse(password)
        expect(result.success).toBe(true)
      }

      for (const password of invalidPasswords) {
        const result = consistentSchemas.password.safeParse(password)
        expect(result.success).toBe(false)
      }
    })
  })

  describe('Schema Statistics', () => {
    it('should have reasonable schema counts', () => {
      const stats = getSchemaUsageStats()
      
      expect(stats.totalSchemas).toBeGreaterThan(0)
      expect(stats.unifiedSchemas).toBeGreaterThan(20) // Should have many unified schemas
      expect(stats.consistentSchemas).toBeGreaterThan(5) // Should have several consistent schemas
    })
  })

  describe('Consistency Report', () => {
    it('should generate a valid consistency report', () => {
      const report = generateConsistencyReport()
      
      expect(report).toContain('# Schema Consistency Report')
      expect(report).toContain('## Status:')
      expect(report).toContain('## Statistics')
      expect(report).toContain('## Recommendations')
    })

    it('should indicate valid status in report', () => {
      const report = generateConsistencyReport()
      const validation = validateSchemaConsistency()
      
      if (validation.isValid) {
        expect(report).toContain('✅ VALID')
      } else {
        expect(report).toContain('❌ INVALID')
      }
    })
  })

  describe('Schema Type Safety', () => {
    it('should have proper TypeScript types', () => {
      // Test that types are properly inferred
      type LoginData = typeof consistentSchemas.loginForm._input
      type SignupData = typeof consistentSchemas.signupForm._input
      
      const loginData: LoginData = {
        email: 'test@example.com',
        password: 'password123'
      }
      
      const signupData: SignupData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      }
      
      expect(loginData).toBeDefined()
      expect(signupData).toBeDefined()
    })
  })
})
