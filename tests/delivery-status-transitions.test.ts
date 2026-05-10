import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { prisma } from '@packages/db'

// Delivery Status Transition Tests
// Validates that only safe status transitions are allowed and unsafe ones are blocked

describe('Delivery Status Transition Tests', () => {
  let testStoreId: string
  let testCustomerId: string
  let testVendorId: string
  let testAdminId: string

  beforeAll(async () => {
    // Create test store
    const store = await prisma.store.create({
      data: {
        id: `store_transitions_${Date.now()}`,
        name: 'Transition Test Store',
        email: 'test-transitions@example.com',
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
        id: `customer_transitions_${Date.now()}`,
        email: `customer-transitions-${Date.now()}@test.com`,
        name: 'Test Customer',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })
    testCustomerId = customer.id

    // Create test vendor
    const vendor = await prisma.user.create({
      data: {
        id: `vendor_transitions_${Date.now()}`,
        email: `vendor-transitions-${Date.now()}@test.com`,
        name: 'Test Vendor',
        role: 'VENDOR',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })
    testVendorId = vendor.id

    // Create test admin
    const admin = await prisma.user.create({
      data: {
        id: `admin_transitions_${Date.now()}`,
        email: `admin-transitions-${Date.now()}@test.com`,
        name: 'Test Admin',
        role: 'ADMIN',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })
    testAdminId = admin.id

    // Link vendor to store
    await prisma.storeMember.create({
      data: {
        userId: vendor.id,
        storeId: store.id,
        role: 'OWNER',
        createdAt: new Date()
      }
    })

    // Enable both delivery modes
    await prisma.storeDeliveryOption.createMany({
      data: [
        {
          id: `doordash_config_${Date.now()}`,
          storeId: store.id,
          deliveryMode: 'THIRD_PARTY_PROVIDER',
          provider: 'DOORDASH_DRIVE',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: `inhouse_config_${Date.now()}`,
          storeId: store.id,
          deliveryMode: 'STORE_MANAGED_DELIVERY',
          provider: 'IN_HOUSE',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]
    })

    console.log('🔄 Status Transition Tests Setup Complete')
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
    await prisma.storeDeliveryOption.deleteMany({
      where: { storeId: testStoreId }
    })
    await prisma.store.deleteMany({
      where: { id: testStoreId }
    })
    await prisma.user.deleteMany({
      where: {
        id: {
          in: [testCustomerId, testVendorId, testAdminId]
        }
      }
    })
    console.log('🔄 Status Transition Tests Cleanup Complete')
  })

  describe('In-house Delivery Safe Transitions', () => {
    it('should allow READY → OUT_FOR_DELIVERY', async () => {
      // Create order and delivery job
      const order = await prisma.order.create({
        data: {
          id: `order_ready_${Date.now()}`,
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
          id: `delivery_ready_${Date.now()}`,
          orderId: order.id,
          provider: 'IN_HOUSE',
          status: 'READY',
          providerStatus: 'ready',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })

      // Test valid transition
      const response = await fetch(`http://localhost:3000/api/delivery-jobs/${deliveryJob.id}/mark-out-for-delivery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test_vendor_token'
        },
        body: JSON.stringify({
          notes: 'Valid transition test'
        })
      })

      expect(response.ok).toBe(true)
      
      const data = await response.json()
      expect(data.success).toBe(true)

      // Verify database state
      const updatedJob = await prisma.deliveryJob.findUnique({
        where: { id: deliveryJob.id }
      })
      expect(updatedJob?.status).toBe('OUT_FOR_DELIVERY')
    })

    it('should allow OUT_FOR_DELIVERY → DELIVERED', async () => {
      // Create out for delivery job
      const order = await prisma.order.create({
        data: {
          id: `order_out_${Date.now()}`,
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
          id: `delivery_out_${Date.now()}`,
          orderId: order.id,
          provider: 'IN_HOUSE',
          status: 'OUT_FOR_DELIVERY',
          providerStatus: 'out_for_delivery',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })

      // Test valid transition
      const response = await fetch(`http://localhost:3000/api/delivery-jobs/${deliveryJob.id}/mark-delivered`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test_vendor_token'
        },
        body: JSON.stringify({
          notes: 'Valid transition test'
        })
      })

      expect(response.ok).toBe(true)
      
      const data = await response.json()
      expect(data.success).toBe(true)

      // Verify database state
      const updatedJob = await prisma.deliveryJob.findUnique({
        where: { id: deliveryJob.id }
      })
      expect(updatedJob?.status).toBe('DELIVERED')
    })

    it('should block PENDING_PAYMENT → DELIVERED', async () => {
      // Create pending payment order
      const order = await prisma.order.create({
        data: {
          id: `order_pending_${Date.now()}`,
          userId: testCustomerId,
          storeId: testStoreId,
          status: 'PENDING_PAYMENT',
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
          id: `delivery_pending_${Date.now()}`,
          orderId: order.id,
          provider: 'IN_HOUSE',
          status: 'PENDING_PAYMENT',
          providerStatus: 'pending',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })

      // Test unsafe transition
      const response = await fetch(`http://localhost:3000/api/delivery-jobs/${deliveryJob.id}/mark-delivered`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test_vendor_token'
        },
        body: JSON.stringify({
          notes: 'Unsafe transition test'
        })
      })

      expect(response.ok).toBe(false)
      expect(response.status).toBe(400)
      
      const data = await response.json()
      expect(data.error).toContain('Invalid status transition')
    })

    it('should block CANCELED → OUT_FOR_DELIVERY', async () => {
      // Create canceled delivery job
      const order = await prisma.order.create({
        data: {
          id: `order_canceled_${Date.now()}`,
          userId: testCustomerId,
          storeId: testStoreId,
          status: 'CANCELED',
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
          id: `delivery_canceled_${Date.now()}`,
          orderId: order.id,
          provider: 'IN_HOUSE',
          status: 'CANCELED',
          providerStatus: 'canceled',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })

      // Test unsafe transition
      const response = await fetch(`http://localhost:3000/api/delivery-jobs/${deliveryJob.id}/mark-out-for-delivery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test_vendor_token'
        },
        body: JSON.stringify({
          notes: 'Unsafe transition from canceled'
        })
      })

      expect(response.ok).toBe(false)
      expect(response.status).toBe(400)
      
      const data = await response.json()
      expect(data.error).toContain('Invalid status transition')
    })

    it('should block DELIVERED → OUT_FOR_DELIVERY', async () => {
      // Create delivered delivery job
      const order = await prisma.order.create({
        data: {
          id: `order_delivered_${Date.now()}`,
          userId: testCustomerId,
          storeId: testStoreId,
          status: 'COMPLETED',
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
          id: `delivery_delivered_${Date.now()}`,
          orderId: order.id,
          provider: 'IN_HOUSE',
          status: 'DELIVERED',
          providerStatus: 'delivered',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })

      // Test unsafe transition
      const response = await fetch(`http://localhost:3000/api/delivery-jobs/${deliveryJob.id}/mark-out-for-delivery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test_vendor_token'
        },
        body: JSON.stringify({
          notes: 'Unsafe transition from delivered'
        })
      })

      expect(response.ok).toBe(false)
      expect(response.status).toBe(400)
      
      const data = await response.json()
      expect(data.error).toContain('Invalid status transition')
    })
  })

  describe('DoorDash Delivery Safe Transitions', () => {
    it('should allow READY → DISPATCHED', async () => {
      // Create order
      const order = await prisma.order.create({
        data: {
          id: `order_ready_dd_${Date.now()}`,
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

      // Create DoorDash delivery job (simulated webhook)
      const deliveryJob = await prisma.deliveryJob.create({
        data: {
          id: `delivery_ready_dd_${Date.now()}`,
          orderId: order.id,
          provider: 'DOORDASH_DRIVE',
          status: 'READY',
          providerStatus: 'ready',
          providerExternalId: `doordash_${Date.now()}`,
          trackingUrl: 'https://doordash.com/tracking/test',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })

      // Test valid transition via internal endpoint
      const response = await fetch(`http://localhost:3000/internal/delivery/status-updated`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          deliveryJobId: deliveryJob.id,
          status: 'DISPATCHED',
          providerStatus: 'dispatched',
          source: 'test'
        })
      })

      expect(response.ok).toBe(true)
      
      // Verify database state
      const updatedJob = await prisma.deliveryJob.findUnique({
        where: { id: deliveryJob.id }
      })
      expect(updatedJob?.status).toBe('DISPATCHED')
    })

    it('should allow DISPATCHED → OUT_FOR_DELIVERY', async () => {
      // Update to dispatched
      await prisma.deliveryJob.update({
        where: { id: `delivery_ready_dd_${Date.now()}` },
        data: {
          status: 'DISPATCHED',
          providerStatus: 'dispatched',
          updatedAt: new Date()
        }
      })

      // Test valid transition
      const response = await fetch(`http://localhost:3000/internal/delivery/status-updated`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          deliveryJobId: `delivery_ready_dd_${Date.now()}`,
          status: 'OUT_FOR_DELIVERY',
          providerStatus: 'out_for_delivery',
          source: 'test'
        })
      })

      expect(response.ok).toBe(true)
      
      // Verify database state
      const updatedJob = await prisma.deliveryJob.findUnique({
        where: { id: `delivery_ready_dd_${Date.now()}` }
      })
      expect(updatedJob?.status).toBe('OUT_FOR_DELIVERY')
    })

    it('should block unsafe DoorDash transitions', async () => {
      // Test public endpoint protection
      const response = await fetch(`http://localhost:3000/api/delivery/status-updated`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test_vendor_token'
        },
        body: JSON.stringify({
          deliveryJobId: `delivery_ready_dd_${Date.now()}`,
          status: 'DELIVERED',
          providerStatus: 'delivered',
          source: 'test'
        })
      })

      expect(response.ok).toBe(false)
      expect(response.status).toBe(401) // Should be protected
    })
  })

  describe('Access Control Tests', () => {
    it('should allow customer to view own order', async () => {
      // Create customer order
      const order = await prisma.order.create({
        data: {
          id: `order_access_${Date.now()}`,
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

      // Test customer access
      const response = await fetch(`http://localhost:3000/api/delivery/tracking/${order.id}`, {
        headers: {
          'Authorization': 'Bearer test_customer_token'
        }
      })

      expect(response.ok).toBe(true)
      
      const data = await response.json()
      expect(data).toBeTruthy()
    })

    it('should block customer from viewing other customer order', async () => {
      // Create other customer order
      const otherCustomer = await prisma.user.create({
        data: {
          id: `other_customer_${Date.now()}`,
          email: `other-customer-${Date.now()}@test.com`,
          name: 'Other Customer',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })

      const otherOrder = await prisma.order.create({
        data: {
          id: `order_other_${Date.now()}`,
          userId: otherCustomer.id,
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

      // Test blocked access
      const response = await fetch(`http://localhost:3000/api/delivery/tracking/${otherOrder.id}`, {
        headers: {
          'Authorization': 'Bearer test_customer_token'
        }
      })

      expect(response.ok).toBe(false)
      expect(response.status).toBe(403)
    })

    it('should allow vendor to manage store deliveries', async () => {
      // Create store order
      const order = await prisma.order.create({
        data: {
          id: `order_vendor_${Date.now()}`,
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

      // Test vendor access
      const response = await fetch(`http://localhost:3000/api/delivery/tracking/${order.id}`, {
        headers: {
          'Authorization': 'Bearer test_vendor_token'
        }
      })

      expect(response.ok).toBe(true)
      
      const data = await response.json()
      expect(data).toBeTruthy()
    })

    it('should block vendor from managing other store deliveries', async () => {
      // Create other store
      const otherStore = await prisma.store.create({
        data: {
          id: `other_store_${Date.now()}`,
          name: 'Other Store',
          email: 'other-store@test.com',
          phone: '+15551234568',
          address: '456 Other St, Test City, TS 12345',
          latitude: 32.7767,
          longitude: -96.7970,
          deliveryRadius: 10,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })

      const otherOrder = await prisma.order.create({
        data: {
          id: `order_other_store_${Date.now()}`,
          userId: testCustomerId,
          storeId: otherStore.id,
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

      // Test blocked access
      const response = await fetch(`http://localhost:3000/api/delivery/tracking/${otherOrder.id}`, {
        headers: {
          'Authorization': 'Bearer test_vendor_token'
        }
      })

      expect(response.ok).toBe(false)
      expect(response.status).toBe(403)
    })

    it('should allow admin to view all deliveries', async () => {
      // Create store order
      const order = await prisma.order.create({
        data: {
          id: `order_admin_${Date.now()}`,
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

      // Test admin access
      const response = await fetch(`http://localhost:3000/api/delivery/tracking/${order.id}`, {
        headers: {
          'Authorization': 'Bearer test_admin_token'
        }
      })

      expect(response.ok).toBe(true)
      
      const data = await response.json()
      expect(data).toBeTruthy()
    })

    it('should block unauthenticated access', async () => {
      // Create store order
      const order = await prisma.order.create({
        data: {
          id: `order_unauth_${Date.now()}`,
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

      // Test unauthenticated access
      const response = await fetch(`http://localhost:3000/api/delivery/tracking/${order.id}`)

      expect(response.ok).toBe(false)
      expect(response.status).toBe(401)
    })
  })
})
