#!/usr/bin/env tsx
/**
 * Debug Validation Issues
 * Check what's happening with our validators
 */

import { z } from 'zod'
import { validators, ValidationError, validationUtils } from '../src/validators.js'

console.log('🔍 Debugging Validation Issues')
console.log('==============================\n')

// Test 1: Check if validators are properly imported
console.log('1. Checking validators object:')
console.log('   validators type:', typeof validators)
console.log('   validators keys:', Object.keys(validators))
console.log('   store validator type:', typeof validators.store)
console.log('')

// Test 2: Check Zod import
console.log('2. Checking Zod import:')
console.log('   z type:', typeof z)
console.log('   z.object type:', typeof z.object)
console.log('')

// Test 3: Test basic Zod functionality
console.log('3. Testing basic Zod functionality:')
try {
  const TestSchema = z.object({
    id: z.string(),
    name: z.string()
  })
  
  const validData = { id: '123', name: 'test' }
  const result = TestSchema.parse(validData)
  console.log('   ✅ Basic Zod validation works:', result)
} catch (error) {
  console.log('   ❌ Basic Zod validation failed:', error.message)
}
console.log('')

// Test 4: Test store validator with minimal data
console.log('4. Testing store validator with minimal data:')
const minimalStore = {
  id: '123',
  name: 'Test Store',
  slug: 'test-store',
  description: 'A test store',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  owner: 'user123',
  companyName: null,
  phone: '+1234567890',
  email: 'test@example.com',
  website: 'https://example.com',
  isPublished: null,
  deliveryEnabled: null,
  pickupEnabled: null,
  prepTimeMin: null,
  feesJson: null,
  hoursJson: null,
  deliveryDistance: null,
  deliveryCharge: null,
  latitude: null,
  longitude: null,
  addressStreet: null,
  addressCity: null,
  addressState: null,
  addressZip: null,
  addressCountry: null,
  geocodedAt: null,
  geocodeSource: null,
  referredByAffiliateId: null,
  referredByAffiliate: null,
  stripeAccountId: null,
  stripeOnboarded: null,
  commissionRate: null,
  media: 'media123',
  items: 'items123',
  orders: 'orders123',
  carts: 'carts123',
  posts: 'posts123',
  bundles: 'bundles123',
  teamMembers: 'team123',
  invitations: 'invites123',
  Promotion: 'promo123',
  FavoriteStore: 'fav123'
}

try {
  const result = validators.store(minimalStore)
  console.log('   ✅ Store validator works with minimal data')
  console.log('   Result keys:', Object.keys(result))
} catch (error) {
  console.log('   ❌ Store validator failed:', error.message)
  if (validationUtils.isValidationError(error)) {
    console.log('   Error details:', validationUtils.getValidationDetails(error))
  }
}
console.log('')

// Test 5: Check what the actual schema expects
console.log('5. Checking schema structure:')
try {
  // Try to access the schema directly
  const { StoreResponseSchema } = await import('@packages/schemas/dtos')
  console.log('   ✅ StoreResponseSchema imported successfully')
  console.log('   Schema type:', typeof StoreResponseSchema)
  
  // Try to parse with the schema directly
  const result = StoreResponseSchema.parse(minimalStore)
  console.log('   ✅ Direct schema parsing works')
} catch (error) {
  console.log('   ❌ Direct schema parsing failed:', error.message)
}
console.log('')

console.log('🔍 Debug complete')
