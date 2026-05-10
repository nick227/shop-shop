/**
 * Central order realtime payloads → topics (vendor / customer / order watchers).
 * Wired once via configureOrderRealtimePublisher (e.g. Fastify → WebSocket broker).
 */
import { prisma } from '../client.js';
let publishFn;
export function configureOrderRealtimePublisher(fn) {
    publishFn = fn;
}
function publish(topic, event) {
    publishFn?.(topic, event);
}
/**
 * New order: vendor dashboard, customer confirmation, per-order subscribers.
 * Reloads order so item counts match persisted line items.
 */
export async function publishOrderCreated(orderId) {
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
            user: { select: { id: true, name: true } },
            store: { select: { id: true, name: true } },
            items: true,
        },
    });
    if (!order) {
        return;
    }
    const timestamp = new Date().toISOString();
    let itemCount = 0;
    for (const row of order.items) {
        itemCount += row.quantity;
    }
    const totalAmount = Number.parseFloat(order.total.toString());
    const vendorPayload = {
        orderId: order.id,
        storeId: order.storeId,
        customerId: order.userId,
        customerName: order.user.name || 'Customer',
        total: totalAmount,
        deliveryType: order.deliveryType,
        status: order.status,
        itemCount,
    };
    publish(`vendor:${order.storeId}`, {
        type: 'order.created',
        timestamp,
        payload: vendorPayload,
    });
    publish(`customer:${order.userId}`, {
        type: 'order.created',
        timestamp,
        payload: {
            orderId: order.id,
            storeId: order.storeId,
            storeName: order.store.name,
            status: order.status,
            total: totalAmount,
        },
    });
    publish(`order:${order.id}`, {
        type: 'order.created',
        timestamp,
        payload: vendorPayload,
    });
}
/**
 * Status transitions: same three topics as OrderService previously used.
 */
export async function publishOrderStatusChanged(orderId, oldStatus, newStatus, options) {
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { userId: true, storeId: true },
    });
    if (!order) {
        return;
    }
    const timestamp = new Date().toISOString();
    const estimatedReady = newStatus === 'ACCEPTED'
        ? new Date(Date.now() + 20 * 60 * 1000).toISOString()
        : undefined;
    const payload = {
        orderId,
        oldStatus,
        newStatus,
        changedBy: options?.changedBy,
        note: options?.note,
    };
    if (estimatedReady !== undefined) {
        payload.estimatedReady = estimatedReady;
    }
    const event = {
        type: 'order.status.changed',
        timestamp,
        payload,
    };
    publish(`customer:${order.userId}`, event);
    publish(`vendor:${order.storeId}`, event);
    publish(`order:${orderId}`, event);
}
