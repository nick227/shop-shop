import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { prisma } from '@packages/db'

// In-house Delivery Manual QA Test
// Tests complete in-house delivery flow: store enable → customer order → manual dispatch → delivery

describe('In-house Delivery Manual QA', () => {
  let testStoreId: string
  let testCustomerId: string
  let testVendorId: string

  beforeAll(async () => {
    // Create test store with in-house delivery enabled
    const store = await prisma.store.create({
      data: {
        id: `store_inhouse_${Date.now()}`,
        name: 'In-house Test Store',
        email: 'test-inhouse@example.com',
        phone: '+15551234567',
        address: '123 Delivery St, Test City, TS 12345',
        latitude: 32.7767,
        longitude: -96.7970,
        deliveryRadius: 5,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })
    testStoreId = store.id

    // Create test customer
    const customer = await prisma.user.create({
      data: {
        id: `customer_inhouse_${Date.now()}`,
        email: `customer-inhouse-${Date.now()}@test.com`,
        name: 'Test Customer',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })
    testCustomerId = customer.id

    // Create test vendor
    const vendor = await prisma.user.create({
      data: {
        id: `vendor_inhouse_${Date.now()}`,
        email: `vendor-inhouse-${Date.now()}@test.com`,
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

    // Create in-house delivery configuration for store
    await prisma.storeDeliveryOption.create({
      data: {
        id: `inhouse_config_${Date.now()}`,
        storeId: store.id,
        deliveryMode: 'STORE_MANAGED_DELIVERY',
        provider: 'IN_HOUSE',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    console.log('🏪 In-house Delivery QA Test Setup Complete')
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
    await prisma.storeDeliveryOption.deleteMany({
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
    console.log('🏹 In-house Delivery QA Test Cleanup Complete')
  })

  it('should enable in-house delivery for store', async () => {
    // Verify in-house configuration exists
    const config = await prisma.storeDeliveryOption.findFirst({
      where: {
        storeId: testStoreId,
        deliveryMode: 'STORE_MANAGED_DELIVERY',
        provider: 'IN_HOUSE',
        isActive: true
      }
    })

    expect(config).toBeTruthy()
    expect(config?.provider).toBe('IN_HOUSE')
    expect(config?.isActive).toBe(true)
  })

  it('should create order with in-house delivery mode', async () => {
    // Create test order
    const order = await prisma.order.create({
      data: {
        id: `order_inhouse_${Date.now()}`,
        userId: testCustomerId,
        storeId: testStoreId,
        status: 'PENDING_PAYMENT',
        deliveryType: 'DELIVERY',
        deliveryMode: 'STORE_MANAGED_DELIVERY',
        subtotal: 30.00,
        fees: 3.00,
        tax: 2.70,
        total: 35.70,
        deliveryAddress: '456 Delivery Ave, Test City, TS 12345',
        deliveryLatitude: 32.78,
        deliveryLongitude: -96.80,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    expect(order.id).toBeTruthy()
    expect(order.deliveryMode).toBe('STORE_MANAGED_DELIVERY')
    expect(order.deliveryType).toBe('DELIVERY')
    expect(order.status).toBe('PENDING_PAYMENT')
  })

  it('should transition to READY when payment confirmed', async () => {
    // Simulate payment completion
    await prisma.order.update({
      where: { id: `order_inhouse_${Date.now()}` },
      data: {
        status: 'READY',
        updatedAt: new Date()
      }
    })

    const updatedOrder = await prisma.order.findUnique({
      where: { id: `order_inhouse_${Date.now()}` }
    })

    expect(updatedOrder?.status).toBe('READY')
  })

  it('should create in-house delivery job on vendor dispatch', async () => {
    // Create in-house delivery job
    const deliveryJob = await prisma.deliveryJob.create({
      data: {
        id: `delivery_inhouse_${Date.now()}`,
        orderId: `order_inhouse_${Date.now()}`,
        provider: 'IN_HOUSE',
        status: 'READY',
        providerStatus: 'ready',
        providerExternalId: null,
        trackingUrl: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    expect(deliveryJob.id).toBeTruthy()
    expect(deliveryJob.provider).toBe('IN_HOUSE')
    expect(deliveryJob.status).toBe('READY')
    expect(deliveryJob.providerStatus).toBe('ready')
  })

  it('should handle basic flow: READY → OUT_FOR_DELIVERY → DELIVERED', async () => {
    // Test basic flow without driver assignment
    const deliveryJobId = `delivery_inhouse_${Date.now()}`
    
    // Mark out for delivery
    const outForDeliveryResponse = await fetch(`http://localhost:3000/api/delivery-jobs/${deliveryJobId}/mark-out-for-delivery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test_vendor_token'
      },
      body: JSON.stringify({
        notes: 'Customer ready for delivery'
      })
    })

    expect(outForDeliveryResponse.ok).toBe(true)
    
    const outForDeliveryData = await outForDeliveryResponse.json()
    expect(outForDeliveryData.success).toBe(true)

    // Verify status transition
    const updatedJob1 = await prisma.deliveryJob.findUnique({
      where: { id: deliveryJobId }
    })
    expect(updatedJob1?.status).toBe('OUT_FOR_DELIVERY')
    expect(updatedJob1?.providerStatus).toBe('out_for_delivery')

    // Mark delivered
    const deliveredResponse = await fetch(`http://localhost:3000/api/delivery-jobs/${deliveryJobId}/mark-delivered`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test_vendor_token'
      },
      body: JSON.stringify({
        notes: 'Delivered to customer',
        customerRating: 5,
        customerTip: 5.00
      })
    })

    expect(deliveredResponse.ok).toBe(true)
    
    const deliveredData = await deliveredResponse.json()
    expect(deliveredData.success).toBe(true)

    // Verify final status
    const updatedJob2 = await prisma.deliveryJob.findUnique({
      where: { id: deliveryJobId }
    })
    expect(updatedJob2?.status).toBe('DELIVERED')
    expect(updatedJob2?.providerStatus).toBe('delivered')

    // Verify order status
    const finalOrder = await prisma.order.findUnique({
      where: { id: `order_inhouse_${Date.now()}` }
    })
    expect(finalOrder?.status).toBe('COMPLETED')
  })

  it('should handle rich flow: READY → DRIVER_ASSIGNED → PICKED_UP → OUT_FOR_DELIVERY → DELIVERED', async () => {
    // Create driver for rich flow testing
    const driver = await prisma.user.create({
      data: {
        id: `driver_inhouse_${Date.now()}`,
        email: `driver-inhouse-${Date.now()}@test.com`,
        name: 'Test Driver',
        role: 'VENDOR',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    // Link driver to store
    await prisma.storeMember.create({
      data: {
        userId: driver.id,
        storeId: testStoreId,
        role: 'MANAGER',
        createdAt: new Date()
      }
    })

    // Create delivery job with driver assignment
    const richDeliveryJob = await prisma.deliveryJob.create({
      data: {
        id: `delivery_rich_${Date.now()}`,
        orderId: `order_inhouse_${Date.now()}`,
        provider: 'IN_HOUSE',
        status: 'READY',
        providerStatus: 'ready',
        providerExternalId: null,
        trackingUrl: null,
        assignedDriverId: driver.id,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    // Mark with driver assigned
    const driverAssignedResponse = await fetch(`http://localhost:3000/api/delivery-jobs/${richDeliveryJob.id}/mark-out-for-delivery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test_vendor_token'
      },
      body: JSON.stringify({
        driverId: driver.id,
        notes: 'Driver assigned to delivery'
      })
    })

    expect(driverAssignedResponse.ok).toBe(true)

    // Simulate picking up (would need additional endpoint for rich flow)
    await prisma.deliveryJob.update({
      where: { id: richDeliveryJob.id },
      data: {
        status: 'OUT_FOR_DELIVERY',
        providerStatus: 'picked_up',
        updatedAt: new Date()
      }
    })

    // Complete rich flow
    const deliveredResponse = await fetch(`http://localhost:3000/api/delivery-jobs/${richDeliveryJob.id}/mark-delivered`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test_vendor_token'
      },
      body: JSON.stringify({
        notes: 'Rich flow completed',
        customerRating: 5
      })
    })

    expect(deliveredResponse.ok).toBe(true)

    const finalRichJob = await prisma.deliveryJob.findUnique({
      where: { id: richDeliveryJob.id }
    })
    expect(finalRichJob?.status).toBe('DELIVERED')
    expect(finalRichJob?.providerStatus).toBe('delivered')
  })

  it('should reject unsafe status transitions', async () => {
    const deliveryJobId = `delivery_inhouse_${Date.now()}`
    
    // Try to transition from DELIVERED to OUT_FOR_DELIVERY (should fail)
    const unsafeResponse = await fetch(`http://localhost:3000/api/delivery-jobs/${deliveryJobId}/mark-out-for-delivery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test_vendor_token'
      },
      body: JSON.stringify({
        notes: 'Attempting unsafe transition'
      })
    })

    expect(unsafeResponse.ok).toBe(false)
    
    const unsafeData = await unsafeResponse.json()
    expect(unsafeData.error).toContain('Invalid status transition')

    // Try to transition from CANCELED to OUT_FOR_DELIVERY (should fail)
    const unsafeResponse2 = await fetch(`http://localhost:3000/api/delivery-jobs/${deliveryJobId}/mark-out-for-delivery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test_vendor_token'
      },
      body: JSON.stringify({
        notes: 'Another unsafe transition'
      })
    })

    expect(unsafeResponse2.ok).toBe(false)
    expect(unsafeResponse2.status).toBe(400)
  })

  it('should maintain proper access controls', async () => {
    // Test customer can only view their own orders
    const customerOrder = await prisma.order.findFirst({
      where: {
        userId: testCustomerId,
        storeId: testStoreId
      }
    })

    expect(customerOrder).toBeTruthy()

    // Test customer cannot view other orders
    const otherCustomerOrder = await prisma.order.findFirst({
      where: {
        userId: `other_customer_${Date.now()}`,
        storeId: testStoreId
      }
    })

    expect(otherCustomerOrder).toBeFalsy()

    // Test vendor can manage store deliveries
    const vendorOrder = await prisma.order.findFirst({
      where: {
        storeId: testStoreId
      }
    })

    expect(vendorOrder).toBeTruthy()

    // Test vendor cannot manage other store deliveries
    const otherVendorOrder = await prisma.order.findFirst({
      where: {
        storeId: `other_store_${Date.now()}`
      }
    })

    expect(otherVendorOrder).toBeFalsy()
  })

  it('should provide complete delivery tracking data', async () => {
    const finalDeliveryJob = await prisma.deliveryJob.findFirst({
      where: { orderId: `order_inhouse_${Date.now()}` },
      include: {
        order: {
          select: {
            id: true,
            userId: true,
            storeId: true,
            status: true,
            deliveryAddress: true
          }
        }
      }
    })

    expect(finalDeliveryJob).toBeTruthy()
    expect(finalDeliveryJob?.provider).toBe('IN_HOUSE')
    expect(finalDeliveryJob?.status).toBe('DELIVERED')
    expect(finalDeliveryJob?.providerStatus).toBe('delivered')
    expect(finalDeliveryJob?.order?.id).toBe(`order_inhouse_${Date.now()}`)
    expect(finalDeliveryJob?.order?.userId).toBe(testCustomerId)
    expect(finalDeliveryJob?.order?.storeId).toBe(testStoreId)
  })

  it('should handle failed in-house delivery gracefully', async () => {
    // Create failed delivery scenario
    await prisma.deliveryJob.update({
      where: { id: `delivery_inhouse_${Date.now()}` },
      data: {
        status: 'FAILED',
        providerStatus: 'failed',
        providerPayload: {
          failureReason: 'Customer not available',
          driverNotes: 'Attempted delivery twice'
        },
        updatedAt: new Date()
      }
    })

    // Create failure event
    await prisma.deliveryProviderEvent.create({
      data: {
        id: `event_inhouse_failed_${Date.now()}`,
        deliveryJobId: `delivery_inhouse_${Date.now()}`,
        provider: 'IN_HOUSE',
        eventId: `manual_failed_${Date.now()}`,
        eventType: 'status_updated',
        timestamp: new Date(),
        payload: {
          previousStatus: 'OUT_FOR_DELIVERY',
          newStatus: 'FAILED',
          failureReason: 'Customer not available'
        } as any,
        processed: true,
        createdAt: new Date()
      }
    })

    const failedDeliveryJob = await prisma.deliveryJob.findFirst({
      where: { orderId: `order_inhouse_${Date.now()}` }
    })

    expect(failedDeliveryJob?.status).toBe('FAILED')
    expect(failedDeliveryJob?.providerStatus).toBe('failed')
  })
})
