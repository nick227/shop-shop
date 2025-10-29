/**
 * Validation Test Setup
 * Configuration and utilities for validation tests
 */

import { beforeAll, afterAll, beforeEach } from 'vitest'
import { vi } from 'vitest'

// Mock console methods to reduce noise during tests
const originalConsoleError = console.error
const originalConsoleWarn = console.warn

beforeAll(() => {
  // Suppress console.error and console.warn during tests unless explicitly needed
  console.error = vi.fn()
  console.warn = vi.fn()
})

afterAll(() => {
  // Restore console methods
  console.error = originalConsoleError
  console.warn = originalConsoleWarn
})

beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks()
})

// Test utilities
export const createMockValidationError = (field: string, message: string) => {
  return {
    field,
    message,
    errors: [{ path: [field], message, code: 'invalid_type' }]
  }
}

export const createMockZodError = (issues: any[]) => {
  return {
    issues,
    name: 'ZodError',
    message: 'Validation error'
  }
}

// Test data factories
export const createValidStoreData = (overrides: Partial<any> = {}) => ({
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
  ownerId: 'user-123',
  ...overrides
})

export const createValidItemData = (overrides: Partial<any> = {}) => ({
  id: 'item-123',
  name: 'Test Item',
  description: 'A test item',
  price: 9.99,
  stockQty: 100,
  isActive: true,
  storeId: 'store-123',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides
})

export const createValidOrderData = (overrides: Partial<any> = {}) => ({
  id: 'order-123',
  userId: 'user-123',
  storeId: 'store-123',
  status: 'PENDING',
  subtotal: 19.98,
  tax: 1.6,
  deliveryFee: 5.99,
  total: 27.57,
  deliveryType: 'DELIVERY',
  addressSnapshot: {
    line1: '123 Test St',
    line2: 'Apt 1',
    city: 'Test City',
    state: 'TS',
    postalCode: '12345'
  },
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides
})

export const createValidCartData = (overrides: Partial<any> = {}) => ({
  id: 'cart-123',
  userId: 'user-123',
  storeId: 'store-123',
  items: [
    {
      id: 'cart-item-123',
      itemId: 'item-123',
      quantity: 2,
      unitPrice: 9.99,
      totalPrice: 19.98
    }
  ],
  subtotal: 19.98,
  tax: 1.6,
  deliveryFee: 5.99,
  total: 27.57,
  status: 'ACTIVE',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides
})

export const createValidAddressData = (overrides: Partial<any> = {}) => ({
  id: 'address-123',
  userId: 'user-123',
  line1: '123 Test St',
  line2: 'Apt 1',
  city: 'Test City',
  state: 'TS',
  postalCode: '12345',
  country: 'US',
  isDefault: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides
})

export const createValidBundleData = (overrides: Partial<any> = {}) => ({
  id: 'bundle-123',
  name: 'Test Bundle',
  description: 'A test bundle',
  isActive: true,
  sortIndex: 1,
  pricing: {
    type: 'FIXED_PRICE',
    value: 29.99
  },
  items: [
    {
      itemId: 'item-123',
      quantity: 2,
      sortIndex: 1
    }
  ],
  storeId: 'store-123',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides
})

export const createValidUserData = (overrides: Partial<any> = {}) => ({
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  phone: '555-1234',
  role: 'USER',
  isCompany: false,
  companyName: null,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides
})

export const createValidAuthData = (overrides: Partial<any> = {}) => ({
  user: {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'USER'
  },
  token: 'jwt-token-123',
  ...overrides
})

export const createValidPaymentData = (overrides: Partial<any> = {}) => ({
  id: 'pi_123',
  amount: 2799,
  currency: 'usd',
  status: 'requires_payment_method',
  clientSecret: 'pi_123_secret',
  createdAt: '2024-01-01T00:00:00Z',
  ...overrides
})

export const createValidTipData = (overrides: Partial<any> = {}) => ({
  id: 'tip-123',
  orderId: 'order-123',
  amount: 5,
  status: 'PENDING',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides
})

export const createValidMediaData = (overrides: Partial<any> = {}) => ({
  id: 'media-123',
  url: 'https://example.com/image.jpg',
  filename: 'image.jpg',
  mimeType: 'image/jpeg',
  size: 1_024_000,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides
})

export const createValidPostData = (overrides: Partial<any> = {}) => ({
  id: 'post-123',
  storeId: 'store-123',
  content: 'This is a test post',
  mediaUrls: ['https://example.com/image1.jpg'],
  likesCount: 5,
  commentsCount: 2,
  sharesCount: 1,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides
})

export const createValidCommentData = (overrides: Partial<any> = {}) => ({
  id: 'comment-123',
  postId: 'post-123',
  userId: 'user-123',
  content: 'This is a test comment',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides
})

// Performance testing utilities
export const measurePerformance = (fn: () => void, iterations = 1) => {
  const times: number[] = []
  
  for (let i = 0; i < iterations; i++) {
    const start = performance.now()
    fn()
    const end = performance.now()
    times.push(end - start)
  }
  
  return {
    times,
    average: times.reduce((a, b) => a + b, 0) / times.length,
    min: Math.min(...times),
    max: Math.max(...times),
    total: times.reduce((a, b) => a + b, 0)
  }
}

// Error testing utilities
export const expectValidationError = (error: any, expectedField?: string, expectedMessage?: string) => {
  expect(error).toBeInstanceOf(Error)
  if (expectedField) {
    expect(error.field).toBe(expectedField)
  }
  if (expectedMessage) {
    expect(error.message).toContain(expectedMessage)
  }
}

export const expectZodError = (result: any) => {
  expect(result.success).toBe(false)
  if (!result.success) {
    expect(result.error.name).toBe('ZodError')
    expect(result.error.issues).toBeDefined()
    expect(Array.isArray(result.error.issues)).toBe(true)
  }
}
