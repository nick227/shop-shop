/**
 * Central order realtime payloads → topics (vendor / customer / order watchers).
 * Wired once via configureOrderRealtimePublisher (e.g. Fastify → WebSocket broker).
 */

import { prisma } from '../client.js'

export interface OrderRealtimeEvent {
  type: string
  timestamp: string
  payload: Record<string, unknown>
}

export type OrderRealtimePublishFn = (topic: string, event: OrderRealtimeEvent) => void

let publishFn: OrderRealtimePublishFn | undefined

export function configureOrderRealtimePublisher(fn: OrderRealtimePublishFn): void {
  publishFn = fn
}

function publish(topic: string, event: OrderRealtimeEvent): void {
  publishFn?.(topic, event)
}

/**
 * New order: vendor dashboard, customer confirmation, per-order subscribers.
 * Reloads order so item counts match persisted line items.
 */
export async function publishOrderCreated(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: { select: { id: true, name: true } },
      store: { select: { id: true, name: true } },
      items: true,
    },
  })

  if (!order) {
    return
  }

  const timestamp = new Date().toISOString()
  const itemCount = order.items.reduce((sum, row) => sum + row.quantity, 0)

  const vendorPayload = {
    orderId: order.id,
    storeId: order.storeId,
    customerId: order.userId,
    customerName: order.user.name || 'Customer',
    total: parseFloat(order.total.toString()),
    deliveryType: order.deliveryType,
    status: order.status,
    itemCount,
  }

  publish(`vendor:${order.storeId}`, {
    type: 'order.created',
    timestamp,
    payload: vendorPayload,
  })

  publish(`customer:${order.userId}`, {
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

  publish(`order:${order.id}`, {
    type: 'order.created',
    timestamp,
    payload: vendorPayload,
  })
}

export interface PublishOrderStatusChangedOptions {
  note?: string
  changedBy?: string
}

/**
 * Status transitions: same three topics as OrderService previously used.
 */
export async function publishOrderStatusChanged(
  orderId: string,
  oldStatus: string,
  newStatus: string,
  options?: PublishOrderStatusChangedOptions
): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { userId: true, storeId: true },
  })

  if (!order) {
    return
  }

  const timestamp = new Date().toISOString()
  const estimatedReady =
    newStatus === 'ACCEPTED'
      ? new Date(Date.now() + 20 * 60 * 1000).toISOString()
      : undefined

  const payload: Record<string, unknown> = {
    orderId,
    oldStatus,
    newStatus,
    changedBy: options?.changedBy,
    note: options?.note,
  }

  if (estimatedReady !== undefined) {
    payload.estimatedReady = estimatedReady
  }

  const event: OrderRealtimeEvent = {
    type: 'order.status.changed',
    timestamp,
    payload,
  }

  publish(`customer:${order.userId}`, event)
  publish(`vendor:${order.storeId}`, event)
  publish(`order:${orderId}`, event)
}
