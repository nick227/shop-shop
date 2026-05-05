#!/usr/bin/env tsx
/**
 * Test Schema Imports
 * Check what's actually exported from schemas
 */

console.log('🔍 Testing schema imports...')

try {
  const schemas = await import('@packages/schemas/dtos')
  console.log('✅ Successfully imported schemas package')
  console.log('📋 Available exports:', Object.keys(schemas))
  
  // Check for specific schemas
  const requiredSchemas = [
    'StoreResponseSchema',
    'ItemResponseSchema', 
    'CartResponseSchema',
    'OrderResponseSchema',
    'AddressResponseSchema',
    'PostResponseSchema',
    'BundleResponseSchema',
    'UserResponseSchema',
    'PromotionResponseSchema'
  ]
  
  console.log('\n🔍 Checking required schemas:')
  for (const schemaName of requiredSchemas) {
    if (schemaName in schemas) {
      console.log(`✅ ${schemaName} - Available`)
    } else {
      console.log(`❌ ${schemaName} - Missing`)
    }
  }
  
} catch (error) {
  console.error('❌ Failed to import schemas:', error)
}
