#!/usr/bin/env tsx
/**
 * Validation Test Suite
 * 
 * Tests runtime validation with Zod schemas
 * Ensures validators work correctly with real data
 */

import { validators, ValidationError, validationUtils } from '../src/validators.js'
import { logger } from './logger.js'

/**
 * Test data samples
 */
const testData = {
  validStore: {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Test Store',
    slug: 'test-store',
    description: 'A test store',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    owner: 'user123',
    companyName: 'Test Company',
    phone: '+1234567890',
    email: 'test@example.com',
    website: 'https://example.com',
    isPublished: true,
    deliveryEnabled: true,
    pickupEnabled: true,
    prepTimeMin: 15,
    feesJson: { deliveryFee: 5.99, minOrder: 10.00 },
    hoursJson: { monday: '9:00-17:00' },
    deliveryDistance: '10.00',
    deliveryCharge: '5.99',
    latitude: '40.7128',
    longitude: '-74.0060',
    addressStreet: '123 Main St',
    addressCity: 'New York',
    addressState: 'NY',
    addressZip: '10001',
    addressCountry: 'US',
    geocodedAt: '2024-01-01T00:00:00Z',
    geocodeSource: 'google',
    referredByAffiliateId: null,
    referredByAffiliate: null,
    stripeAccountId: 'acct_123',
    stripeOnboarded: true,
    commissionRate: '2.50',
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
  },
  
  invalidStore: {
    name: 'Test Store',
    // Missing required fields: id, slug, description, etc.
  },
  
  validOrder: {
    id: '123e4567-e89b-12d3-a456-426614174000',
    userId: 'user123',
    storeId: 'store123',
    cartId: 'cart123',
    status: 'PLACED',
    deliveryType: 'DELIVERY',
    paymentStatus: 'UNPAID',
    subtotal: '25.99',
    fees: '5.99',
    tax: '2.60',
    tip: '3.00',
    total: '37.58',
    serviceFeePercent: '2.50',
    serviceFeeAmount: '0.65',
    netToVendor: '36.93',
    stripePaymentIntentId: null,
    stripeChargeId: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    user: 'user123',
    store: 'store123',
    cart: 'cart123',
    items: 'items123',
    addressSnapshot: 'address123',
    stripePaymentIntentId: null,
    stripeChargeId: null
  }
}

/**
 * Test validation functions
 */
async function testValidators() {
  logger.section('🧪 Validation Test Suite')
  
  let passed = 0
  let failed = 0
  
  // Test valid store data
  try {
    const result = validators.store(testData.validStore)
    logger.success('✅ Store validator accepts valid data')
    passed++
  } catch (error) {
    logger.error('❌ Store validator rejected valid data:', error)
    failed++
  }
  
  // Test invalid store data
  try {
    validators.store(testData.invalidStore)
    logger.error('❌ Store validator should have rejected invalid data')
    failed++
  } catch (error) {
    if (validationUtils.isValidationError(error)) {
      logger.success('✅ Store validator correctly rejected invalid data')
      logger.info(`   Error: ${validationUtils.formatValidationError(error)}`)
      passed++
    } else {
      logger.error('❌ Store validator threw unexpected error:', error)
      failed++
    }
  }
  
  // Test store list validation
  try {
    const result = validators.storeList([testData.validStore])
    logger.success('✅ Store list validator accepts valid data')
    passed++
  } catch (error) {
    logger.error('❌ Store list validator rejected valid data:', error)
    failed++
  }
  
  // Test order validation
  try {
    const result = validators.order(testData.validOrder)
    logger.success('✅ Order validator accepts valid data')
    passed++
  } catch (error) {
    logger.error('❌ Order validator rejected valid data:', error)
    failed++
  }
  
  // Test error handling utilities
  try {
    validators.store(testData.invalidStore)
  } catch (error) {
    if (validationUtils.isValidationError(error)) {
      const details = validationUtils.getValidationDetails(error)
      logger.success('✅ Validation error details extracted correctly')
      logger.info(`   Field: ${details.field}`)
      logger.info(`   Errors: ${details.errors.length} validation errors`)
      passed++
    } else {
      logger.error('❌ Error is not a ValidationError')
      failed++
    }
  }
  
  // Summary
  logger.section('📊 Test Results')
  logger.info(`✅ Passed: ${passed}`)
  logger.info(`❌ Failed: ${failed}`)
  
  if (failed === 0) {
    logger.success('🎉 All validation tests passed!')
    return true
  } else {
    logger.error('💥 Some validation tests failed!')
    return false
  }
}

/**
 * Test API wrapper integration
 */
async function testAPIWrapperIntegration() {
  logger.section('🔗 API Wrapper Integration Test')
  
  try {
    // Import the generated API wrapper
    const { stores } = await import('../../apps/web/src/api/apiWrapper.js')
    
    logger.info('✅ API wrapper imports successfully')
    logger.info('✅ Stores API methods available:', Object.keys(stores))
    
    return true
  } catch (error) {
    logger.error('❌ API wrapper integration failed:', error)
    return false
  }
}

/**
 * Main test runner
 */
async function runValidationTests() {
  logger.section('🚀 Starting Validation Tests')
  
  const validatorTests = await testValidators()
  const integrationTests = await testAPIWrapperIntegration()
  
  if (validatorTests && integrationTests) {
    logger.success('\n🎉 All validation tests passed!')
    logger.info('✅ Runtime validation is working correctly')
    logger.info('✅ API wrapper integration is working')
    logger.info('✅ Error handling is working')
    return true
  } else {
    logger.error('\n💥 Some validation tests failed!')
    return false
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runValidationTests()
    .then(success => {
      process.exit(success ? 0 : 1)
    })
    .catch(error => {
      logger.error('Test runner failed:', error)
      process.exit(1)
    })
}

export { runValidationTests, testValidators, testAPIWrapperIntegration }
