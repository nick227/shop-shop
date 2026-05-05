#!/usr/bin/env tsx
/**
 * Simple Validation Test
 * Test basic Zod validation functionality
 */

import { z } from 'zod'

// Simple test schema
const TestSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.string(),
})

// Test data
const validData = {
  id: '123',
  name: 'Test',
  createdAt: '2024-01-01T00:00:00Z'
}

const invalidData = {
  name: 'Test'
  // Missing required fields
}

console.log('🧪 Testing basic Zod validation...')

try {
  const result = TestSchema.parse(validData)
  console.log('✅ Valid data passed validation:', result)
} catch (error) {
  console.error('❌ Valid data failed validation:', error)
}

try {
  TestSchema.parse(invalidData)
  console.error('❌ Invalid data should have failed validation')
} catch (error) {
  console.log('✅ Invalid data correctly failed validation:', error.message)
}

console.log('🎉 Basic validation test completed!')
