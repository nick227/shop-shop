/**
 * Integration Test: Real-time Order Broadcasting
 * Tests order service WebSocket broadcasting without UI
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { prisma } from '@packages/db'
import { orderService, setOrderServiceBroadcast } from '@packages/db'
import type { Order } from '@packages/db'

describe('Real-time Order Broadcasting', () => {
  let testStoreId: string
  let testUserId: string
  let testOrderId: string
  const broadcastedEvents: any[] = []

  beforeAll(async () => {
    // Setup mock broadcast function
    setOrderServiceBroadcast((topic, event) => {
      broadcastedEvents.push({ topic, event })
    })

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        passwordHash: 'test',
        name: 'Test User',
      },
    })
    testUserId = user.id

    // Create test store
    const store = await prisma.store.create({
      data: {
        ownerUserId: testUserId,
        name: 'Test Store',
        slug: `test-store-${Date.now()}`,
        prepTimeMin: 20,
      },
    })
    testStoreId = store.id

    // Create test item
    await prisma.item.create({
      data: {
        storeId: testStoreId,
        title: 'Test Item',
        price: 10.99,
      },
    })

    // Create test order
    const order = await prisma.order.create({
      data: {
        userId: testUserId,
        storeId: testStoreId,
        status: 'PLACED',
        deliveryType: 'PICKUP',
        paymentStatus: 'UNPAID',
        subtotal: 10.99,
        fees: 0,
        tax: 0.88,
        tip: 0,
        total: 11.87,
        serviceFeePercent: 3.0,
        serviceFeeAmount: 0.33,
        netToVendor: 11.54,
      },
    })
    testOrderId = order.id
  })

  afterAll(async () => {
    // Cleanup
    await prisma.orderEvent.deleteMany({ where: { orderId: testOrderId } })
    await prisma.order.deleteMany({ where: { userId: testUserId } })
    await prisma.item.deleteMany({ where: { storeId: testStoreId } })
    await prisma.store.deleteMany({ where: { id: testStoreId } })
    await prisma.user.deleteMany({ where: { id: testUserId } })
  })

  it('should broadcast new order creation to vendor and customer', async () => {
    broadcastedEvents.length = 0 // Clear previous events

    await orderService.broadcastNewOrder(testOrderId)

    // Should broadcast to vendor and customer
    expect(broadcastedEvents).toHaveLength(2)

    const vendorEvent = broadcastedEvents.find((e) => e.topic.startsWith('vendor:'))
    const customerEvent = broadcastedEvents.find((e) => e.topic.startsWith('customer:'))

    expect(vendorEvent).toBeDefined()
    expect(vendorEvent?.event.type).toBe('order.created')
    expect(vendorEvent?.event.payload).toMatchObject({
      orderId: testOrderId,
      storeId: testStoreId,
      customerId: testUserId,
    })

    expect(customerEvent).toBeDefined()
    expect(customerEvent?.event.type).toBe('order.created')
  })

  it('should broadcast order status update to all parties', async () => {
    broadcastedEvents.length = 0

    await orderService.updateOrderStatus({
      orderId: testOrderId,
      newStatus: 'ACCEPTED',
      note: 'Starting preparation',
      changedBy: testUserId,
    })

    // Should broadcast to customer, vendor, and order watchers
    expect(broadcastedEvents.length).toBeGreaterThanOrEqual(3)

    const customerEvent = broadcastedEvents.find((e) => e.topic === `customer:${testUserId}`)
    const vendorEvent = broadcastedEvents.find((e) => e.topic === `vendor:${testStoreId}`)
    const orderEvent = broadcastedEvents.find((e) => e.topic === `order:${testOrderId}`)

    expect(customerEvent).toBeDefined()
    expect(customerEvent?.event.type).toBe('order.status.changed')
    expect(customerEvent?.event.payload).toMatchObject({
      orderId: testOrderId,
      oldStatus: 'PLACED',
      newStatus: 'ACCEPTED',
      note: 'Starting preparation',
    })

    expect(vendorEvent).toBeDefined()
    expect(orderEvent).toBeDefined()
  })

  it('should create OrderEvent audit trail for status changes', async () => {
    await orderService.updateOrderStatus({
      orderId: testOrderId,
      newStatus: 'PREPARING',
      note: 'Food is being prepared',
    })

    const events = await prisma.orderEvent.findMany({
      where: { orderId: testOrderId },
      orderBy: { createdAt: 'asc' },
    })

    expect(events.length).toBeGreaterThanOrEqual(2)

    const preparingEvent = events.find((e) => e.status === 'PREPARING')
    expect(preparingEvent).toBeDefined()
    expect(preparingEvent?.note).toBe('Food is being prepared')
  })

  it('should handle complete status flow with broadcasts', async () => {
    broadcastedEvents.length = 0

    const statusFlow: Array<'PLACED' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'COMPLETED'> = [
      'PREPARING',
      'READY',
      'COMPLETED',
    ]

    for (const status of statusFlow) {
      await orderService.updateOrderStatus({
        orderId: testOrderId,
        newStatus: status,
        note: `Moving to ${status}`,
      })
    }

    // Each status change broadcasts to 3 topics (customer, vendor, order)
    expect(broadcastedEvents.length).toBeGreaterThanOrEqual(statusFlow.length * 3)

    // Verify final status
    const order = await prisma.order.findUnique({ where: { id: testOrderId } })
    expect(order?.status).toBe('COMPLETED')

    // Verify audit trail
    const events = await prisma.orderEvent.findMany({
      where: { orderId: testOrderId },
      orderBy: { createdAt: 'asc' },
    })
    expect(events.length).toBeGreaterThanOrEqual(statusFlow.length + 1)
  })

  it('should broadcast order cancellation', async () => {
    broadcastedEvents.length = 0

    await orderService.cancelOrder(testOrderId, 'Customer requested cancellation', testUserId)

    expect(broadcastedEvents.length).toBeGreaterThanOrEqual(3)

    const cancelEvents = broadcastedEvents.filter((e) => e.event.payload.newStatus === 'CANCELED')
    expect(cancelEvents.length).toBeGreaterThanOrEqual(3)
  })

  it('should include estimated ready time in status updates', async () => {
    broadcastedEvents.length = 0

    await orderService.updateOrderStatus({
      orderId: testOrderId,
      newStatus: 'ACCEPTED',
      note: 'Order accepted',
    })

    const customerEvent = broadcastedEvents.find((e) => e.topic.startsWith('customer:'))
    expect(customerEvent?.event.payload.estimatedReady).toBeDefined()
    expect(typeof customerEvent?.event.payload.estimatedReady).toBe('string')
  })

  it('should broadcast to correct topic patterns', async () => {
    broadcastedEvents.length = 0

    await orderService.updateOrderStatus({
      orderId: testOrderId,
      newStatus: 'PREPARING',
    })

    const topics = broadcastedEvents.map((e) => e.topic)

    expect(topics).toContain(`customer:${testUserId}`)
    expect(topics).toContain(`vendor:${testStoreId}`)
    expect(topics).toContain(`order:${testOrderId}`)
  })
})

