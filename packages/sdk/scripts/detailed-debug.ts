#!/usr/bin/env tsx
/**
 * Detailed Debug - Check exact schema requirements
 */

import { validators, ValidationError, validationUtils } from '../src/validators.js'

console.log('🔍 Detailed Schema Debug')
console.log('========================\n')

const testData = {
  owner: 'user123',
  name: 'Test Store',
  slug: 'test-store',
  description: 'A test store',
  companyName: null,
  taxId: null,
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
  deliveryZones: 'zone123',
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

console.log('Testing store validator with data:')
console.log('Data keys:', Object.keys(testData))
console.log('Data length:', Object.keys(testData).length)
console.log('')

try {
  const result = validators.store(testData)
  console.log('✅ Store validation succeeded!')
  console.log('Result keys:', Object.keys(result))
} catch (error) {
  if (validationUtils.isValidationError(error)) {
    const details = validationUtils.getValidationDetails(error)
    console.log('❌ Store validation failed with errors:')
    console.log('Field:', details.field)
    console.log('Number of errors:', details.errors.length)
    console.log('')
    console.log('Detailed errors:')
    details.errors.forEach((err, index) => {
      console.log(`  ${index + 1}. Path: ${Array.isArray(err.path) ? err.path.join('.') : err.path}`)
      console.log(`     Message: ${err.message}`)
      console.log(`     Code: ${err.code}`)
      console.log('')
    })
  } else {
    console.log('❌ Unexpected error:', error.message)
  }
}
