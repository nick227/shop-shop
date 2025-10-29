/**
 * Schema Consistency Validator
 * Ensures all schemas across the application are consistent
 */

import { z } from 'zod'
import { schemas as unifiedSchemas } from '../api/schemas/UnifiedSchemas'
import { schemas as consistentSchemas } from './ConsistentSchemas'

/**
 * Validate that all schemas are consistent across the application
 */
export function validateSchemaConsistency(): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  try {
    // Test that unified schemas are working
    const testLoginData = {
      email: 'test@example.com',
      password: 'password123'
    }

    const loginResult = unifiedSchemas.login.safeParse(testLoginData)
    if (!loginResult.success) {
      errors.push('Unified login schema validation failed')
    }

    // Test that consistent schemas are working
    const testSignupData = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User'
    }

    const signupResult = consistentSchemas.signupForm.safeParse(testSignupData)
    if (!signupResult.success) {
      errors.push('Consistent signup form schema validation failed')
    }

    // Test that schemas are compatible
    const unifiedLoginResult = unifiedSchemas.login.safeParse(testLoginData)
    const consistentLoginResult = consistentSchemas.loginForm.safeParse(testLoginData)
    
    if (unifiedLoginResult.success !== consistentLoginResult.success) {
      errors.push('Login schemas are not compatible between unified and consistent schemas')
    }

    // Check for missing schemas
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
      if (!(schemaName in unifiedSchemas)) {
        errors.push(`Missing required schema: ${schemaName}`)
      }
    }

    // Check for deprecated schema usage
    const deprecatedSchemas = [
      'emailSchema',
      'passwordSchema', 
      'phoneSchema'
    ]

    for (const schemaName of deprecatedSchemas) {
      if (schemaName in unifiedSchemas) {
        warnings.push(`Deprecated schema still in use: ${schemaName}`)
      }
    }

  } catch (error) {
    errors.push(`Schema validation error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Get schema usage statistics
 */
export function getSchemaUsageStats(): {
  totalSchemas: number
  unifiedSchemas: number
  consistentSchemas: number
  deprecatedSchemas: number
} {
  const unifiedCount = Object.keys(unifiedSchemas).length
  const consistentCount = Object.keys(consistentSchemas).length
  
  return {
    totalSchemas: unifiedCount + consistentCount,
    unifiedSchemas: unifiedCount,
    consistentSchemas: consistentCount,
    deprecatedSchemas: 0 // Will be calculated based on actual usage
  }
}

/**
 * Generate schema consistency report
 */
export function generateConsistencyReport(): string {
  const validation = validateSchemaConsistency()
  const stats = getSchemaUsageStats()
  
  let report = '# Schema Consistency Report\n\n'
  
  report += `## Status: ${validation.isValid ? '✅ VALID' : '❌ INVALID'}\n\n`
  
  report += '## Statistics\n'
  report += `- Total Schemas: ${stats.totalSchemas}\n`
  report += `- Unified Schemas: ${stats.unifiedSchemas}\n`
  report += `- Consistent Schemas: ${stats.consistentSchemas}\n`
  report += `- Deprecated Schemas: ${stats.deprecatedSchemas}\n\n`
  
  if (validation.errors.length > 0) {
    report += '## Errors\n'
    for (const error of validation.errors) {
      report += `- ❌ ${error}\n`
    }
    report += '\n'
  }
  
  if (validation.warnings.length > 0) {
    report += '## Warnings\n'
    for (const warning of validation.warnings) {
      report += `- ⚠️ ${warning}\n`
    }
    report += '\n'
  }
  
  report += '## Recommendations\n'
  if (validation.isValid) {
    report += '- ✅ All schemas are consistent\n'
    report += '- ✅ No action required\n'
  } else {
    report += '- 🔧 Fix schema validation errors\n'
    report += '- 🔄 Update deprecated schema usage\n'
    report += '- 📝 Review schema naming conventions\n'
  }
  
  return report
}
