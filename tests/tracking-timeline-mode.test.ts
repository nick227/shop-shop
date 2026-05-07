/**
 * Tracking Timeline Mode Tests
 * 
 * Tests that order tracking renders different timelines
 * for pickup vs delivery modes
 */

import { describe, it, expect } from 'vitest'
import { getOrderProgress } from '../../../apps/web/src/pages/customer/utils/orderTrackingUtils'

describe('Tracking Timeline Mode Tests', () => {
  describe('Pickup Mode Timeline', () => {
    it('should show 100% progress at READY status for pickup', () => {
      const pickupOrder = {
        id: 'test-order',
        status: 'READY',
        deliveryType: 'PICKUP',
        deliveryMode: 'PICKUP',
      }

      const progress = getOrderProgress(pickupOrder)

      expect(progress.percentage).toBe(100)
      expect(progress.statusMessage).toBe('Ready for pickup')
    })

    it('should include all pickup milestones', () => {
      const pickupOrder = {
        id: 'test-order',
        status: 'PLACED',
        deliveryType: 'PICKUP',
        deliveryMode: 'PICKUP',
      }

      const progress = getOrderProgress(pickupOrder)

      expect(progress.percentage).toBe(10)
      expect(progress.statusMessage).toBe('Order placed')
    })
  })

  describe('Delivery Mode Timeline', () => {
    it('should show 75% progress at READY status for delivery', () => {
      const deliveryOrder = {
        id: 'test-order',
        status: 'READY',
        deliveryType: 'DELIVERY',
        deliveryMode: 'PLATFORM_DRIVER',
      }

      const progress = getOrderProgress(deliveryOrder)

      expect(progress.percentage).toBe(75)
      expect(progress.statusMessage).toBe('Order ready')
    })

    it('should show 90% progress at OUT_FOR_DELIVERY status', () => {
      const deliveryOrder = {
        id: 'test-order',
        status: 'OUT_FOR_DELIVERY',
        deliveryType: 'DELIVERY',
        deliveryMode: 'STORE_MANAGED_DELIVERY',
      }

      const progress = getOrderProgress(deliveryOrder)

      expect(progress.percentage).toBe(90)
      expect(progress.statusMessage).toBe('Out for delivery')
    })

    it('should show 100% progress at DELIVERED status', () => {
      const deliveryOrder = {
        id: 'test-order',
        status: 'DELIVERED',
        deliveryType: 'DELIVERY',
        deliveryMode: 'THIRD_PARTY_PROVIDER',
      }

      const progress = getOrderProgress(deliveryOrder)

      expect(progress.percentage).toBe(100)
      expect(progress.statusMessage).toBe('Delivered')
    })

    it('should include all delivery milestones', () => {
      const deliveryOrder = {
        id: 'test-order',
        status: 'ACCEPTED',
        deliveryType: 'DELIVERY',
        deliveryMode: 'PLATFORM_DRIVER',
      }

      const progress = getOrderProgress(deliveryOrder)

      expect(progress.percentage).toBe(25)
      expect(progress.statusMessage).toBe('Order accepted')
    })
  })

  describe('Mode Differentiation', () => {
    it('should differentiate pickup vs delivery progress at same status', () => {
      const pickupOrder = {
        id: 'test-order-1',
        status: 'READY',
        deliveryType: 'PICKUP',
        deliveryMode: 'PICKUP',
      }

      const deliveryOrder = {
        id: 'test-order-2',
        status: 'READY',
        deliveryType: 'DELIVERY',
        deliveryMode: 'PLATFORM_DRIVER',
      }

      const pickupProgress = getOrderProgress(pickupOrder)
      const deliveryProgress = getOrderProgress(deliveryOrder)

      // Same status but different modes should have different progress
      expect(pickupProgress.percentage).toBe(100) // Pickup complete at READY
      expect(deliveryProgress.percentage).toBe(75)  // Delivery not complete until OUT_FOR_DELIVERY
      expect(pickupProgress.percentage).not.toBe(deliveryProgress.percentage)
    })

    it('should handle CANCELED status consistently', () => {
      const pickupOrder = {
        id: 'test-order-1',
        status: 'CANCELED',
        deliveryType: 'PICKUP',
        deliveryMode: 'PICKUP',
      }

      const deliveryOrder = {
        id: 'test-order-2',
        status: 'CANCELED',
        deliveryType: 'DELIVERY',
        deliveryMode: 'PLATFORM_DRIVER',
      }

      const pickupProgress = getOrderProgress(pickupOrder)
      const deliveryProgress = getOrderProgress(deliveryOrder)

      // Both should show 0% progress
      expect(pickupProgress.percentage).toBe(0)
      expect(deliveryProgress.percentage).toBe(0)
    })
  })
})
