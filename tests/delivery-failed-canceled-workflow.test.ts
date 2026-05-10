import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { prisma } from '@packages/db'

// Failed/Canceled Delivery Workflow Tests
// Tests proper handling of delivery failures and cancellations

describe('Failed/Canceled Delivery Workflow Tests', () => {
  let testStoreId: string
  let testCustomerId: string
  let testVendorId: string

  beforeAll(async () => {
    // Create test store
    const store = await prisma.store.create({
      data: {
        id: `store_failed_${Date.now()}`,
        name: 'Failed Delivery Test Store',
        email: 'test-failed@example.com',
        phone: '+15551234567',
        address: '123 Test St, Test City, TS 12345',
        latitude: 32.7767,
        longitude: -96.7970,
        deliveryRadius: 10,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })
    testStoreId = store.id

    // Create test customer
    const customer = await prisma.user.create({
      data: {
        id: `customer_failed_${Date.now()}`,
        email: `customer-failed-${Date.now()}@test.com`,
        name: 'Test Customer',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })
    testCustomerId = customer.id

    // Create test vendor
    const vendor = await prisma.user.create({
      data: {
        id: `vendor_failed_${Date.now()}`,
        email: `vendor-failed-${Date.now()}@test.com`,
        name: 'Test Vendor',
        role: 'VENDOR',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })
    testVendorId = vendor.id

    // Link vendor to store
    await prisma.storeMember.create({
      data: {
        userId: vendor.id,
        storeId: store.id,
        role: 'OWNER',
        createdAt: new Date()
      }
    })

    console.log('❌ Failed/Canceled Workflow Tests Setup Complete')
    console.log(`Store: ${testStoreId}`)
    console.log(`Customer: ${testCustomerId}`)
    console.log(`Vendor: ${testVendorId}`)
  })

  afterAll(async () => {
    // Cleanup test data
    await prisma.deliveryJob.deleteMany({
      where: {
        order: {
          storeId: testStoreId
        }
      }
    })
    await prisma.order.deleteMany({
      where: { storeId: testStoreId }
    })
    await prisma.storeMember.deleteMany({
      where: { storeId: testStoreId }
    })
    await prisma.store.deleteMany({
      where: { id: testStoreId }
    })
    await prisma.user.deleteMany({
      where: {
        id: {
          in: [testCustomerId, testVendorId]
        }
      }
    })
    console.log('❌ Failed/Canceled Workflow Tests Cleanup Complete')
  })

  describe('DoorDash Failed Delivery Workflow', () => {
    it('should handle DoorDash DELIVERY_CANCELLED webhook', async () => {
      // Create order and delivery job
      const order = await prisma.order.create({
        data: {
          id: `order_dd_failed_${Date.now()}`,
          userId: testCustomerId,
          storeId: testStoreId,
          status: 'READY',
          deliveryType: 'DELIVERY',
          deliveryMode: 'THIRD_PARTY_PROVIDER',
          subtotal: 25.00,
          fees: 5.00,
          tax: 2.40,
          total: 32.40,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })

      const deliveryJob = await prisma.deliveryJob.create({
        data: {
          id: `delivery_dd_failed_${Date.now()}`,
          orderId: order.id,
          provider: 'DOORDASH_DRIVE',
          status: 'DISPATCHED',
          providerStatus: 'dispatched',
          providerExternalId: `doordash_${Date.now()}`,
          trackingUrl: 'https://doordash.com/tracking/test',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })

      // Simulate DoorDash cancellation webhook
      const response = await fetch(`http://localhost:3000/internal/delivery/status-updated`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          deliveryJobId: deliveryJob.id,
          status: 'CANCELED',
          providerStatus: 'canceled',
          source: 'doordash_webhook'
        })
      })

      expect(response.ok).toBe(true)

      // Verify database state
      const updatedJob = await prisma.deliveryJob.findUnique({
        where: { id: deliveryJob.id }
      })
      expect(updatedJob?.status).toBe('CANCELED')
      expect(updatedJob?.providerStatus).toBe('canceled')

      // Verify order status
      const updatedOrder = await prisma.order.findUnique({
        where: { id: order.id }
      })
      expect(updatedOrder?.status).toBe('CANCELED')
    })

    it('should handle DoorDash failed delivery webhook', async () => {
      // Create order and delivery job
      const order = await prisma.order.create({
        data: {
          id: `order_dd_failed2_${Date.now()}`,
          userId: testCustomerId,
          storeId: testStoreId,
          status: 'READY',
          deliveryType: 'DELIVERY',
          deliveryMode: 'THIRD_PARTY_PROVIDER',
          subtotal: 25.00,
          fees: 5.00,
          tax: 2.40,
          total: 32.40,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })

      const deliveryJob = await prisma.deliveryJob.create({
        data: {
          id: `delivery_dd_failed2_${Date.now()}`,
          orderId: order.id,
          provider: 'DOORDASH_DRIVE',
          status: 'DISPATCHED',
          providerStatus: 'dispatched',
          providerExternalId: `doordash_${Date.now()}`,
          trackingUrl: 'https://doordash.com/tracking/test',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })

      // Simulate DoorDash failed delivery webhook
      const response = await fetch(`http://localhost:3000/internal/delivery/status-updated`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          deliveryJobId: deliveryJob.id,
          status: 'FAILED',
          providerStatus: 'failed',
          source: 'doordash_webhook'
        })
      })

      expect(response.ok).toBe(true)

      // Verify database state
      const updatedJob = await prisma.deliveryJob.findUnique({
        where: { id: deliveryJob.id }
      })
      expect(updatedJob?.status).toBe('FAILED')
      expect(updatedJob?.providerStatus).toBe('failed')

      // Verify order status
      const updatedOrder = await prisma.order.findUnique({
        where: { id: order.id }
      })
      expect(updatedOrder?.status).toBe('FAILED')
    })
  })

  describe('In-house Failed/Canceled Workflow', () => {
    it('should handle in-house delivery cancellation', async () => {
      // Create order and delivery job
      const order = await prisma.order.create({
        data: {
          id: `order_inhouse_failed_${Date.now()}`,
          userId: testCustomerId,
          storeId: testStoreId,
          status: 'READY',
          deliveryType: 'DELIVERY',
          deliveryMode: 'STORE_MANAGED_DELIVERY',
          subtotal: 25.00,
          fees: 3.00,
          tax: 2.40,
          total: 30.40,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })

      const deliveryJob = await prisma.deliveryJob.create({
        data: {
          id: `delivery_inhouse_failed_${Date.now()}`,
          orderId: order.id,
          provider: 'IN_HOUSE',
          status: 'OUT_FOR_DELIVERY',
          providerStatus: 'out_for_delivery',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })

      // Cancel delivery
      const response = await fetch(`http://localhost:3000/api/delivery-jobs/${deliveryJob.id}/mark-out-for-delivery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test_vendor_token'
        },
        body: JSON.stringify({
          notes: 'Customer requested cancellation'
        })
      })

      expect(response.ok).toBe(true)

      // Verify database state
      const updatedJob = await prisma.deliveryJob.findUnique({
        where: { id: deliveryJob.id }
      })
      expect(updatedJob?.status).toBe('CANCELED')
      expect(updatedJob?.providerStatus).toBe('canceled')

      // Verify order status
      const updatedOrder = await prisma.order.findUnique({
        where: { id: order.id }
      })
      expect(updatedOrder?.status).toBe('CANCELED')
    })

    it('should handle in-house delivery failure', async () => {
      // Create order and delivery job
      const order = await prisma.order.create({
        data: {
          id: `order_inhouse_failed2_${Date.now()}`,
          userId: testCustomerId,
          storeId: testStoreId,
          status: 'OUT_FOR_DELIVERY',
          deliveryType: 'DELIVERY',
          deliveryMode: 'STORE_MANAGED_DELIVERY',
          subtotal: 25.00,
          fees: 3.00,
          tax: 2.40,
          total: 30.40,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })

      const deliveryJob = await prisma.deliveryJob.create({
        data: {
          id: `delivery_inhouse_failed2_${Date.now()}`,
          orderId: order.id,
          provider: 'IN_HOUSE',
          status: 'OUT_FOR_DELIVERY',
          providerStatus: 'out_for_delivery',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })

      // Mark delivery as failed
      const response = await fetch(`http://localhost:3000/api/delivery-jobs/${deliveryJob.id}/mark-out-for-delivery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test_vendor_token'
        },
        body: JSON.stringify({
          notes: 'Delivery failed - customer not available'
        })
      })

      expect(response.ok).toBe(true)

      // Verify database state
      const updatedJob = await prisma.deliveryJob.findUnique({
        where: { id: deliveryJob.id }
      })
      expect(updatedJob?.status).toBe('FAILED')
      expect(updatedJob?.providerStatus).toBe('failed')

      // Verify order status
      const updatedOrder = await prisma.order.findUnique({
        where: { id: order.id }
      })
      expect(updatedOrder?.status).toBe('FAILED')
    })
  })

  describe('Customer Tracking UI for Failed/Canceled Deliveries', () => {
    it('should show clear canceled state to customer', async () => {
      // Create canceled order
      const order = await prisma.order.create({
        data: {
          id: `order_canceled_ui_${Date.now()}`,
          userId: testCustomerId,
          storeId: testStoreId,
          status: 'CANCELED',
          deliveryType: 'DELIVERY',
          deliveryMode: 'THIRD_PARTY_PROVIDER',
          subtotal: 25.00,
          fees: 5.00,
          tax: 2.40,
          total: 32.40,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })

      const deliveryJob = await prisma.deliveryJob.create({
        data: {
          id: `delivery_canceled_ui_${Date.now()}`,
          orderId: order.id,
          provider: 'DOORDASH_DRIVE',
          status: 'CANCELED',
          providerStatus: 'canceled',
          providerExternalId: `doordash_${Date.now()}`,
          trackingUrl: 'https://doordash.com/tracking/test',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })

      // Test customer tracking endpoint
      const response = await fetch(`http://localhost:3000/api/delivery/tracking/${order.id}`, {
        headers: {
          'Authorization': 'Bearer test_customer_token'
        }
      })

      expect(response.ok).toBe(true)
      
      const data = await response.json()
      expect(data.deliveryJob).toBeTruthy()
      expect(data.deliveryJob?.status).toBe('CANCELED')
      expect(data.deliveryJob?.providerStatus).toBe('canceled')
    })

    it('should show clear failed state to customer', async () => {
      // Create failed order
      const order = await prisma.order.create({
        data: {
          id: `order_failed_ui_${Date.now()}`,
          userId: testCustomerId,
          storeId: testStoreId,
          status: 'FAILED',
          deliveryType: 'DELIVERY',
          deliveryMode: 'THIRD_PARTY_PROVIDER',
          subtotal: 25.00,
          fees: 5.00,
          tax: 2.40,
          total: 32.40,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })

      const deliveryJob = await prisma.deliveryJob.create({
        data: {
          id: `delivery_failed_ui_${Date.now()}`,
          orderId: order.id,
          provider: 'DOORDASH_DRIVE',
          status: 'FAILED',
          providerStatus: 'failed',
          providerExternalId: `doordash_${Date.now()}`,
          trackingUrl: 'https://doordash.com/tracking/test',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })

      // Test customer tracking endpoint
      const response = await fetch(`http://localhost:3000/api/delivery/tracking/${order.id}`, {
        headers: {
          'Authorization': 'Bearer test_customer_token'
        }
      })

      expect(response.ok).toBe(true)
      
      const data = await response.json()
      expect(data.deliveryJob).toBeTruthy()
      expect(data.deliveryJob?.status).toBe('FAILED')
      expect(data.deliveryJob?.providerStatus).toBe('failed')
    })
  })

  describe('Vendor Panel for Failed/Canceled Deliveries', () => {
    it('should show recovery options for failed delivery', async () => {
      // Create failed delivery job
      const order = await prisma.order.create({
        data: {
          id: `order_vendor_failed_${Date.now()}`,
          userId: testCustomerId,
          storeId: testStoreId,
          status: 'FAILED',
          deliveryType: 'DELIVERY',
          deliveryMode: 'STORE_MANAGED_DELIVERY',
          subtotal: 25.00,
          fees: 3.00,
          tax: 2.40,
          total: 30.40,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })

      const deliveryJob = await prisma.deliveryJob.create({
        data: {
          id: `delivery_vendor_failed_${Date.now()}`,
          orderId: order.id,
          provider: 'IN_HOUSE',
          status: 'FAILED',
          providerStatus: 'failed',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })

      // Test vendor panel access
      const response = await fetch(`http://localhost:3000/api/delivery/tracking/${order.id}`, {
        headers: {
          'Authorization': 'Bearer test_vendor_token'
        }
      })

      expect(response.ok).toBe(true)
      
      const data = await response.json()
      expect(data.deliveryJob).toBeTruthy()
      expect(data.deliveryJob?.status).toBe('FAILED')
      expect(data.deliveryJob?.providerStatus).toBe('failed')
    })

    it('should show cancel option for active delivery', async () => {
      // Create active delivery job
      const order = await prisma.order.create({
        data: {
          id: `order_vendor_cancel_${Date.now()}`,
          userId: testCustomerId,
          storeId: testStoreId,
          status: 'OUT_FOR_DELIVERY',
          deliveryType: 'DELIVERY',
          deliveryMode: 'STORE_MANAGED_DELIVERY',
          subtotal: 25.00,
          fees: 3.00,
          tax: 2.40,
          total: 30.40,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })

      const deliveryJob = await prisma.deliveryJob.create({
        data: {
          id: `delivery_vendor_cancel_${Date.now()}`,
          orderId: order.id,
          provider: 'IN_HOUSE',
          status: 'OUT_FOR_DELIVERY',
          providerStatus: 'out_for_delivery',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })

      // Test vendor panel access
      const response = await fetch(`http://localhost:3000/api/delivery/tracking/${order.id}`, {
        headers: {
          'Authorization': 'Bearer test_vendor_token'
        }
      })

      expect(response.ok).toBe(true)
      
      const data = await response.json()
      expect(data.deliveryJob).toBeTruthy()
      expect(data.deliveryJob?.status).toBe('OUT_FOR_DELIVERY')
      expect(data.deliveryJob?.providerStatus).toBe('out_for_delivery')
    })
  })

  describe('Admin Event Viewer for Failed/Canceled Deliveries', () => {
    it('should show failure reasons and raw events', async () => {
      // Create failed delivery with event
      const order = await prisma.order.create({
        data: {
          id: `order_admin_failed_${Date.now()}`,
          userId: testCustomerId,
          storeId: testStoreId,
          status: 'FAILED',
          deliveryType: 'DELIVERY',
          deliveryMode: 'THIRD_PARTY_PROVIDER',
          subtotal: 25.00,
          fees: 5.00,
          tax: 2.40,
          total: 32.40,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })

      const deliveryJob = await prisma.deliveryJob.create({
        data: {
          id: `delivery_admin_failed_${Date.now()}`,
          orderId: order.id,
          provider: 'DOORDASH_DRIVE',
          status: 'FAILED',
          providerStatus: 'failed',
          providerExternalId: `doordash_${Date.now()}`,
          trackingUrl: 'https://doordash.com/tracking/test',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })

      // Create provider event
      await prisma.deliveryProviderEvent.create({
        data: {
          id: `event_admin_failed_${Date.now()}`,
          deliveryJobId: deliveryJob.id,
          provider: 'DOORDASH_DRIVE',
          eventId: `webhook_failed_${Date.now()}`,
          eventType: 'status_updated',
          timestamp: new Date(),
          payload: {
            webhookEvent: 'failed',
            previousStatus: 'DISPATCHED',
            newStatus: 'FAILED',
            failureReason: 'Customer not available',
            dasherId: 'dasher_test_123',
            rawWebhookPayload: {
              event: 'delivery_failed',
              data: {
                id: `doordash_${Date.now()}`,
                status: 'failed'
              }
            }
          } as any,
          processed: true,
          createdAt: new Date()
        }
      })

      // Test admin event viewer
      const response = await fetch(`http://localhost:3000/api/admin/delivery-events`, {
        headers: {
          'Authorization': 'Bearer test_admin_token'
        }
      })

      expect(response.ok).toBe(true)
      
      const data = await response.json()
      expect(data.events).toBeTruthy()
      expect(data.events?.length).toBeGreaterThan(0)
      
      const failureEvent = data.events?.find((event: any) => 
        event.payload?.webhookEvent === 'failed'
      )
      expect(failureEvent).toBeTruthy()
      expect(failureEvent?.payload?.failureReason).toBe('Customer not available')
      expect(failureEvent?.payload?.rawWebhookPayload).toBeTruthy()
    })
  })
})
