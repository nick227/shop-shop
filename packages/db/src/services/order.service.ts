/**
 * Order Service
 * Handles order operations with real-time broadcasting
 */

import { prisma } from '../client.js'
import type { Order, OrderStatus, OrderEvent } from '../generated/client/index.js'
import { calculateCommissionForOrder } from './affiliate.service.js'

export interface BroadcastFunction {
  (topic: string, event: { type: string; timestamp: string; payload: Record<string, unknown> }): void
}

export interface CreateOrderEventInput {
  orderId: string
  status: OrderStatus
  note?: string
}

export interface UpdateOrderStatusInput {
  orderId: string
  newStatus: OrderStatus
  note?: string
  changedBy?: string
}

export class OrderService {
  private broadcast?: BroadcastFunction

  constructor(broadcast?: BroadcastFunction) {
    this.broadcast = broadcast
  }

  /**
   * Create order event (audit trail) and broadcast
   */
  async createOrderEvent(input: CreateOrderEventInput): Promise<OrderEvent> {
    const event = await prisma.orderEvent.create({
      data: {
        orderId: input.orderId,
        status: input.status,
        note: input.note,
      },
    })

    return event
  }

  /**
   * Update order status with real-time broadcasting
   */
  async updateOrderStatus(input: UpdateOrderStatusInput): Promise<Order> {
    const { orderId, newStatus, note, changedBy } = input

    // Get current order
    const currentOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        store: { select: { id: true, name: true, ownerUserId: true } },
      },
    })

    if (!currentOrder) {
      throw new Error('Order not found')
    }

    const oldStatus = currentOrder.status

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: newStatus },
      include: {
        user: true,
        store: true,
        items: { include: { item: true } },
        address: true,
      },
    })

    // Create audit trail event
    await this.createOrderEvent({
      orderId,
      status: newStatus,
      note,
    })

    // Calculate affiliate commission when order is completed
    if (newStatus === 'COMPLETED' && oldStatus !== 'COMPLETED') {
      await calculateCommissionForOrder(orderId).catch((err) => {
        console.error('Failed to calculate commission for order:', orderId, err)
      })
    }

    // Broadcast to all interested parties
    if (this.broadcast) {
      const timestamp = new Date().toISOString()
      
      // Calculate estimated ready time (20 min default)
      const estimatedReady = new Date(Date.now() + 20 * 60 * 1000).toISOString()

      const basePayload = {
        orderId,
        oldStatus,
        newStatus,
        changedBy,
        note,
        estimatedReady: newStatus === 'ACCEPTED' ? estimatedReady : undefined,
      }

      // Broadcast to customer
      this.broadcast(`customer:${currentOrder.userId}`, {
        type: 'order.status.changed',
        timestamp,
        payload: basePayload,
      })

      // Broadcast to vendor
      this.broadcast(`vendor:${currentOrder.storeId}`, {
        type: 'order.status.changed',
        timestamp,
        payload: basePayload,
      })

      // Broadcast to specific order watchers
      this.broadcast(`order:${orderId}`, {
        type: 'order.status.changed',
        timestamp,
        payload: basePayload,
      })
    }

    return updatedOrder
  }

  /**
   * Broadcast new order creation to vendor
   */
  async broadcastNewOrder(orderId: string): Promise<void> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { id: true, name: true } },
        store: { select: { id: true, name: true } },
        items: true,
      },
    })

    if (!order) {
      throw new Error('Order not found')
    }

    // Create initial order event
    await this.createOrderEvent({
      orderId,
      status: order.status,
      note: 'Order placed',
    })

    if (this.broadcast) {
      const timestamp = new Date().toISOString()

      // Notify vendor
      this.broadcast(`vendor:${order.storeId}`, {
        type: 'order.created',
        timestamp,
        payload: {
          orderId: order.id,
          storeId: order.storeId,
          customerId: order.userId,
          customerName: order.user.name || 'Customer',
          total: parseFloat(order.total.toString()),
          deliveryType: order.deliveryType,
          status: order.status,
          itemCount: order.items.length,
        },
      })

      // Notify customer (confirmation)
      this.broadcast(`customer:${order.userId}`, {
        type: 'order.created',
        timestamp,
        payload: {
          orderId: order.id,
          storeId: order.storeId,
          storeName: order.store.name,
          status: order.status,
          total: parseFloat(order.total.toString()),
        },
      })
    }
  }

  /**
   * Get order with full details
   */
  async getOrderById(orderId: string) {
    return prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        store: { select: { id: true, name: true, slug: true, phone: true } },
        items: {
          include: {
            item: { select: { id: true, title: true, price: true } },
          },
        },
        address: true,
        events: { orderBy: { createdAt: 'desc' } },
      },
    })
  }

  /**
   * Get orders for customer
   */
  async getCustomerOrders(userId: string, filters?: { status?: OrderStatus }) {
    return prisma.order.findMany({
      where: {
        userId,
        ...(filters?.status && { status: filters.status }),
      },
      include: {
        store: { select: { id: true, name: true, slug: true } },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Get orders for vendor
   */
  async getVendorOrders(storeId: string, filters?: { status?: OrderStatus }) {
    return prisma.order.findMany({
      where: {
        storeId,
        ...(filters?.status && { status: filters.status }),
      },
      include: {
        user: { select: { id: true, name: true, phone: true } },
        items: true,
        address: true,
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Get pending orders count for vendor
   */
  async getPendingOrdersCount(storeId: string): Promise<number> {
    return prisma.order.count({
      where: {
        storeId,
        status: { in: ['PLACED', 'ACCEPTED', 'PREPARING'] },
      },
    })
  }

  /**
   * Cancel order
   */
  async cancelOrder(orderId: string, reason?: string, canceledBy?: string): Promise<Order> {
    return this.updateOrderStatus({
      orderId,
      newStatus: 'CANCELED',
      note: reason || 'Order canceled',
      changedBy: canceledBy,
    })
  }
}

// Export singleton instance
export const orderService = new OrderService()

// Allow setting broadcast function
export function setOrderServiceBroadcast(broadcast: BroadcastFunction) {
  const service = orderService as unknown as { broadcast?: BroadcastFunction }
  service.broadcast = broadcast
}

