/**
 * Order Service
 * Handles order operations with real-time broadcasting
 */

import { prisma } from '../client.js'
import type { Order, OrderStatus, OrderEvent } from '../generated/client/index.js'
import { calculateCommissionForOrder } from './affiliate.service.js'
import {
  configureOrderRealtimePublisher,
  publishOrderCreated,
  publishOrderStatusChanged,
} from './order-realtime.publisher.js'
import { assertValidTransition } from '../order-state-machine.js'

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
   * Transition order to a new status.
   * Validates the transition, writes the audit event, logs, and broadcasts.
   * This is the single entry point for all programmatic status changes.
   */
  async transitionOrderStatus(input: UpdateOrderStatusInput): Promise<Order> {
    const { orderId, newStatus, note, changedBy } = input

    const currentOrder = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true },
    })

    if (!currentOrder) {
      throw new Error('Order not found')
    }

    const oldStatus = currentOrder.status

    // Validate transition against state machine
    assertValidTransition(oldStatus, newStatus)

    // Structured transition log (one JSON line per transition)
    console.log(
      JSON.stringify({
        event: 'order.transition',
        orderId,
        from: oldStatus,
        to: newStatus,
        changedBy: changedBy ?? 'system',
        note: note ?? null,
        timestamp: new Date().toISOString(),
      }),
    )

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: newStatus,
      },
    })

    // Audit trail
    await this.createOrderEvent({ orderId, status: newStatus, note })

    // Commission calculation fires on delivery (DELIVERED) or legacy COMPLETED
    if (
      (newStatus === 'DELIVERED' || newStatus === 'COMPLETED') &&
      oldStatus !== 'DELIVERED' &&
      oldStatus !== 'COMPLETED'
    ) {
      await calculateCommissionForOrder(orderId).catch((err) => {
        console.error('Failed to calculate commission for order:', orderId, err)
      })
    }

    await publishOrderStatusChanged(orderId, oldStatus, newStatus, { note, changedBy })

    return updatedOrder
  }

  /**
   * @deprecated Use transitionOrderStatus — kept for internal backward-compat callers.
   */
  async updateOrderStatus(input: UpdateOrderStatusInput): Promise<Order> {
    return this.transitionOrderStatus(input)
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

    await publishOrderCreated(orderId)
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

/** Wire broker once (e.g. WebSocket fan-out). Same hook used by HTTP order resources. */
export function setOrderServiceBroadcast(broadcast: BroadcastFunction) {
  configureOrderRealtimePublisher(broadcast)
}

