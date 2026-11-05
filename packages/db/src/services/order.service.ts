import { executeOrderCommand, type OrderCommand } from './order-lifecycle.service.js'
/**
 * Order Service
 * Handles order operations with real-time broadcasting
 */

import { prisma } from '../client.js'
import type { Order, OrderStatus, OrderEvent } from '../generated/client/index.js'
import { runAffiliateCommissions } from './affiliate-commission.service.js'
import {
  configureOrderRealtimePublisher,
  publishOrderCreated,
} from './order-realtime.publisher.js'

export interface BroadcastFunction {
  (topic: string, event: { type: string; timestamp: string; payload: Record<string, unknown> }): void
}

export interface CreateOrderEventInput {
  orderId: string
  status: OrderStatus
  note?: string
}

export type UpdateOrderStatusInput = OrderCommand & { newStatus: OrderStatus }

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
    const order = await executeOrderCommand(input)
    // Preserve immediate legacy commission behavior; durable work remains the retry fallback.
    try {
      if (input.newStatus === 'COMPLETED' || input.newStatus === 'DELIVERED') await runAffiliateCommissions(input.orderId)
    } catch (error) { console.warn('Commission work remains queued', error) }
    return order
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

