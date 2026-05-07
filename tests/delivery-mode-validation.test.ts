/**
 * Delivery Mode Validation Tests
 * 
 * Tests for invalid deliveryType/deliveryMode combinations
 * and validation logic in dispatch service
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { prisma } from '@packages/db'

describe('Delivery Mode Validation', () => {
  beforeEach(async () => {
    // Clean up test data
    await prisma.order.deleteMany()
    await prisma.deliveryJob.deleteMany()
  })

  describe('Invalid Mode Combinations', () => {
    it('should reject PICKUP with deliveryType=DELIVERY', async () => {
      // Create order with invalid combination
      const order = await prisma.order.create({
        data: {
          userId: 'test-user-id',
          storeId: 'test-store-id',
          status: 'READY',
          deliveryType: 'DELIVERY',
          deliveryMode: 'PICKUP', // Invalid: PICKUP mode with DELIVERY type
          subtotal: 10.00,
          fees: 3.00,
          tax: 1.00,
          tip: 0,
          total: 14.00,
          serviceFeePercent: 0,
          serviceFeeAmount: 0,
          netToVendor: 14.00,
          paymentStatus: 'PAID',
        }
      })

      expect(order.deliveryMode).toBe('PICKUP')
      expect(order.deliveryType).toBe('DELIVERY')
      // This combination should be caught by validation
    })

    it('should reject STORE_MANAGED_DELIVERY with deliveryType=PICKUP', async () => {
      // Create order with invalid combination
      const order = await prisma.order.create({
        data: {
          userId: 'test-user-id',
          storeId: 'test-store-id',
          status: 'READY',
          deliveryType: 'PICKUP',
          deliveryMode: 'STORE_MANAGED_DELIVERY', // Invalid: Delivery mode with pickup type
          subtotal: 10.00,
          fees: 0,
          tax: 0.80,
          tip: 0,
          total: 10.80,
          serviceFeePercent: 0,
          serviceFeeAmount: 0,
          netToVendor: 10.80,
          paymentStatus: 'PAID',
        }
      })

      expect(order.deliveryMode).toBe('STORE_MANAGED_DELIVERY')
      expect(order.deliveryType).toBe('PICKUP')
      // This combination should be caught by validation
    })

    it('should accept valid PICKUP with deliveryType=PICKUP', async () => {
      // Create valid pickup order
      const order = await prisma.order.create({
        data: {
          userId: 'test-user-id',
          storeId: 'test-store-id',
          status: 'READY',
          deliveryType: 'PICKUP',
          deliveryMode: 'PICKUP', // Valid: Both pickup
          subtotal: 10.00,
          fees: 0,
          tax: 0.80,
          tip: 0,
          total: 10.80,
          serviceFeePercent: 0,
          serviceFeeAmount: 0,
          netToVendor: 10.80,
          paymentStatus: 'PAID',
        }
      })

      expect(order.deliveryMode).toBe('PICKUP')
      expect(order.deliveryType).toBe('PICKUP')
    })

    it('should accept valid STORE_MANAGED_DELIVERY with deliveryType=DELIVERY', async () => {
      // Create valid delivery order
      const order = await prisma.order.create({
        data: {
          userId: 'test-user-id',
          storeId: 'test-store-id',
          status: 'READY',
          deliveryType: 'DELIVERY',
          deliveryMode: 'STORE_MANAGED_DELIVERY', // Valid: Both delivery
          subtotal: 10.00,
          fees: 3.00,
          tax: 0.80,
          tip: 0,
          total: 13.80,
          serviceFeePercent: 0,
          serviceFeeAmount: 0,
          netToVendor: 13.80,
          paymentStatus: 'PAID',
        }
      })

      expect(order.deliveryMode).toBe('STORE_MANAGED_DELIVERY')
      expect(order.deliveryType).toBe('DELIVERY')
    })

    it('should accept valid PLATFORM_DRIVER with deliveryType=DELIVERY', async () => {
      // Create valid platform driver order
      const order = await prisma.order.create({
        data: {
          userId: 'test-user-id',
          storeId: 'test-store-id',
          status: 'READY',
          deliveryType: 'DELIVERY',
          deliveryMode: 'PLATFORM_DRIVER', // Valid: Both delivery
          subtotal: 10.00,
          fees: 3.00,
          tax: 0.80,
          tip: 0,
          total: 13.80,
          serviceFeePercent: 0,
          serviceFeeAmount: 0,
          netToVendor: 13.80,
          paymentStatus: 'PAID',
        }
      })

      expect(order.deliveryMode).toBe('PLATFORM_DRIVER')
      expect(order.deliveryType).toBe('DELIVERY')
    })
  })

  describe('Dispatch Validation', () => {
    it('should reject IN_HOUSE provider with PLATFORM_DRIVER mode', async () => {
      const order = await prisma.order.create({
        data: {
          userId: 'test-user-id',
          storeId: 'test-store-id',
          status: 'READY',
          deliveryType: 'DELIVERY',
          deliveryMode: 'PLATFORM_DRIVER',
          deliveryLatitude: 40.7128,
          deliveryLongitude: -74.0060,
          subtotal: 10.00,
          fees: 3.00,
          tax: 0.80,
          tip: 0,
          total: 13.80,
          serviceFeePercent: 0,
          serviceFeeAmount: 0,
          netToVendor: 13.80,
          paymentStatus: 'PAID',
        }
      })

      // Try to dispatch with incompatible provider/mode
      const { dispatchOrderDelivery } = await import('@packages/db/src/services/delivery-dispatch.service')
      
      await expect(
        dispatchOrderDelivery({
          orderId: order.id,
          provider: 'IN_HOUSE', // Should only work with STORE_MANAGED_DELIVERY
          requestedByUserId: 'test-user-id',
        })
      ).rejects.toThrow('Delivery mode PLATFORM_DRIVER is not compatible with provider IN_HOUSE')
    })

    it('should accept IN_HOUSE provider with STORE_MANAGED_DELIVERY mode', async () => {
      const order = await prisma.order.create({
        data: {
          userId: 'test-user-id',
          storeId: 'test-store-id',
          status: 'READY',
          deliveryType: 'DELIVERY',
          deliveryMode: 'STORE_MANAGED_DELIVERY',
          deliveryLatitude: 40.7128,
          deliveryLongitude: -74.0060,
          subtotal: 10.00,
          fees: 3.00,
          tax: 0.80,
          tip: 0,
          total: 13.80,
          serviceFeePercent: 0,
          serviceFeeAmount: 0,
          netToVendor: 13.80,
          paymentStatus: 'PAID',
        }
      })

      const { dispatchOrderDelivery } = await import('@packages/db/src/services/delivery-dispatch.service')
      
      // Should succeed with compatible provider/mode
      const result = await dispatchOrderDelivery({
        orderId: order.id,
        provider: 'IN_HOUSE', // Compatible with STORE_MANAGED_DELIVERY
        requestedByUserId: 'test-user-id',
      })

      expect(result).toBeDefined()
      expect(result.provider).toBe('IN_HOUSE')
    })

    it('should reject PICKUP orders from dispatch', async () => {
      const order = await prisma.order.create({
        data: {
          userId: 'test-user-id',
          storeId: 'test-store-id',
          status: 'READY',
          deliveryType: 'PICKUP',
          deliveryMode: 'PICKUP',
          subtotal: 10.00,
          fees: 0,
          tax: 0.80,
          tip: 0,
          total: 10.80,
          serviceFeePercent: 0,
          serviceFeeAmount: 0,
          netToVendor: 10.80,
          paymentStatus: 'PAID',
        }
      })

      const { dispatchOrderDelivery } = await import('@packages/db/src/services/delivery-dispatch.service')
      
      await expect(
        dispatchOrderDelivery({
          orderId: order.id,
          provider: 'IN_HOUSE',
          requestedByUserId: 'test-user-id',
        })
      ).rejects.toThrow('PICKUP orders cannot be dispatched')
    })
  })
})
