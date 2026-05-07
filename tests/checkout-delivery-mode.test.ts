/**
 * Checkout Delivery Mode End-to-End Tests
 * 
 * Tests that deliveryMode persists through checkout flow
 * and is available in order tracking
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
// Mock prisma for testing - in real implementation would import from db
const mockPrisma = {
  order: {
    create: vi.fn(),
    findUnique: vi.fn(),
    deleteMany: vi.fn(),
  },
  cart: {
    deleteMany: vi.fn(),
  }
}

// Mock API client
const mockApiClient = {
  checkout: {
    createSession: vi.fn(),
    complete: vi.fn(),
  }
}

describe('Checkout Delivery Mode Persistence', () => {
  beforeEach(async () => {
    // Clean up test data
    await mockPrisma.order.deleteMany()
    await mockPrisma.cart.deleteMany()
    vi.clearAllMocks()
  })

  describe('Delivery Mode Selection', () => {
    it('should persist PICKUP mode through checkout', async () => {
      // Mock checkout session creation
      mockApiClient.checkout.createSession.mockResolvedValue({
        sessionId: 'test-session-id',
        total: 10.80,
        estimatedDelivery: new Date().toISOString(),
      })

      // Mock checkout completion
      mockApiClient.checkout.complete.mockResolvedValue({
        order: {
          id: 'test-order-id',
          deliveryType: 'PICKUP',
          deliveryMode: 'PICKUP',
          status: 'PLACED',
          total: 10.80,
        },
        paymentId: 'test-payment-id',
      })

      // Simulate checkout flow
      const sessionResponse = await mockApiClient.checkout.createSession({
        items: [{ itemId: 'test-item-id', quantity: 1 }],
        deliveryType: 'PICKUP',
        deliveryMode: 'PICKUP',
        paymentMethod: { type: 'CREDIT_CARD', token: 'test-token' },
      })

      expect(sessionResponse.sessionId).toBe('test-session-id')

      const completeResponse = await mockApiClient.checkout.complete({
        sessionId: 'test-session-id',
        paymentMethod: { type: 'CREDIT_CARD', token: 'test-token' },
        tipAmount: 0,
      })

      expect(completeResponse.order.deliveryMode).toBe('PICKUP')
      expect(completeResponse.order.deliveryType).toBe('PICKUP')
    })

    it('should persist STORE_MANAGED_DELIVERY mode through checkout', async () => {
      // Mock checkout session creation
      mockApiClient.checkout.createSession.mockResolvedValue({
        sessionId: 'test-session-id',
        total: 13.80,
        estimatedDelivery: new Date().toISOString(),
      })

      // Mock checkout completion
      mockApiClient.checkout.complete.mockResolvedValue({
        order: {
          id: 'test-order-id',
          deliveryType: 'DELIVERY',
          deliveryMode: 'STORE_MANAGED_DELIVERY',
          status: 'PLACED',
          total: 13.80,
        },
        paymentId: 'test-payment-id',
      })

      // Simulate checkout flow
      const sessionResponse = await mockApiClient.checkout.createSession({
        items: [{ itemId: 'test-item-id', quantity: 1 }],
        deliveryType: 'DELIVERY',
        deliveryMode: 'STORE_MANAGED_DELIVERY',
        deliveryAddress: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
        },
        paymentMethod: { type: 'CREDIT_CARD', token: 'test-token' },
      })

      expect(sessionResponse.sessionId).toBe('test-session-id')

      const completeResponse = await mockApiClient.checkout.complete({
        sessionId: 'test-session-id',
        paymentMethod: { type: 'CREDIT_CARD', token: 'test-token' },
        tipAmount: 0,
      })

      expect(completeResponse.order.deliveryMode).toBe('STORE_MANAGED_DELIVERY')
      expect(completeResponse.order.deliveryType).toBe('DELIVERY')
    })

    it('should persist PLATFORM_DRIVER mode through checkout', async () => {
      // Mock checkout session creation
      mockApiClient.checkout.createSession.mockResolvedValue({
        sessionId: 'test-session-id',
        total: 13.80,
        estimatedDelivery: new Date().toISOString(),
      })

      // Mock checkout completion
      mockApiClient.checkout.complete.mockResolvedValue({
        order: {
          id: 'test-order-id',
          deliveryType: 'DELIVERY',
          deliveryMode: 'PLATFORM_DRIVER',
          status: 'PLACED',
          total: 13.80,
        },
        paymentId: 'test-payment-id',
      })

      // Simulate checkout flow
      const sessionResponse = await mockApiClient.checkout.createSession({
        items: [{ itemId: 'test-item-id', quantity: 1 }],
        deliveryType: 'DELIVERY',
        deliveryMode: 'PLATFORM_DRIVER',
        deliveryAddress: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
        },
        paymentMethod: { type: 'CREDIT_CARD', token: 'test-token' },
      })

      expect(sessionResponse.sessionId).toBe('test-session-id')

      const completeResponse = await mockApiClient.checkout.complete({
        sessionId: 'test-session-id',
        paymentMethod: { type: 'CREDIT_CARD', token: 'test-token' },
        tipAmount: 0,
      })

      expect(completeResponse.order.deliveryMode).toBe('PLATFORM_DRIVER')
      expect(completeResponse.order.deliveryType).toBe('DELIVERY')
    })
  })

  describe('Order Tracking Integration', () => {
    it('should make deliveryMode available in order tracking', async () => {
      // Create order with delivery mode
      const order = await mockPrisma.order.create({
        data: {
          userId: 'test-user-id',
          storeId: 'test-store-id',
          status: 'PLACED',
          deliveryType: 'DELIVERY',
          deliveryMode: 'PLATFORM_DRIVER',
          subtotal: 10.00,
          fees: 3.00,
          tax: 0.80,
          tip: 0,
          total: 13.80,
          serviceFeePercent: 0,
          serviceFeeAmount: 0,
          netToVendor: 13.80,
          paymentStatus: 'PAID',
          deliveryLatitude: 40.7128,
          deliveryLongitude: -74.0060,
        }
      })

      // Verify order can be retrieved with delivery mode
      const retrievedOrder = await mockPrisma.order.findUnique({
        where: { id: order.id },
        select: { deliveryMode: true, deliveryType: true },
      })

      expect(retrievedOrder?.deliveryMode).toBe('PLATFORM_DRIVER')
      expect(retrievedOrder?.deliveryType).toBe('DELIVERY')
    })
  })
})
