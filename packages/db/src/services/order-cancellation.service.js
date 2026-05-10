import { prisma } from '../client.js';
import { refundOrder } from './payment.service.js';
import { publishOrderStatusChanged } from './order-realtime.publisher.js';
import { assertValidTransition, canTransitionTo } from '../order-state-machine.js';
export const CANCELLATION_REASONS = {
    CUSTOMER_REQUEST: 'Customer requested cancellation',
    OUT_OF_STOCK: 'Items out of stock',
    KITCHEN_CAPACITY: 'Kitchen at capacity',
    DELIVERY_UNAVAILABLE: 'Delivery unavailable',
    PAYMENT_FAILED: 'Payment processing failed',
    FRAUD_SUSPECTED: 'Suspected fraudulent order',
    CUSTOMER_NO_SHOW: 'Customer no-show for pickup',
    OTHER: 'Other reason',
};
async function userCanManageOrdersOnStore(userId, storeId, storeOwnerId) {
    if (userId === storeOwnerId)
        return true;
    const member = await prisma.teamMember.findFirst({
        where: { storeId, userId, isActive: true },
        select: { permissionsJson: true },
    });
    if (!member)
        return false;
    const raw = member.permissionsJson;
    const perms = Array.isArray(raw)
        ? raw.filter((p) => typeof p === 'string')
        : [];
    return perms.includes('MANAGE_ORDERS') || perms.includes('FULL_ACCESS');
}
/**
 * Cancel an order with optional refund
 */
export async function cancelOrder(input) {
    const order = await prisma.order.findUnique({
        where: { id: input.orderId },
        include: {
            store: { select: { ownerUserId: true } },
            user: { select: { id: true, email: true } },
        },
    });
    if (!order) {
        throw new Error('Order not found');
    }
    const actor = await prisma.user.findUnique({
        where: { id: input.userId },
        select: { role: true },
    });
    const isAdmin = actor?.role === 'ADMIN';
    const isCustomer = order.userId === input.userId;
    const isStoreSide = await userCanManageOrdersOnStore(input.userId, order.storeId, order.store.ownerUserId);
    if (!isCustomer && !isStoreSide && !isAdmin) {
        throw new Error('Unauthorized: Only customer, store staff, or admin can cancel this order');
    }
    // Check if cancellation is a valid transition (state machine enforced)
    assertValidTransition(order.status, 'CANCELED');
    // Determine if refund is needed
    let refunded = false;
    let refundAmount;
    if (input.shouldRefund && order.paymentStatus === 'PAID') {
        try {
            const refundResult = await refundOrder({
                orderId: input.orderId,
                userId: input.userId,
            });
            refunded = true;
            refundAmount = refundResult.amount;
        }
        catch (error) {
            console.error('Refund failed during cancellation:', error);
            // Continue with cancellation even if refund fails
        }
    }
    const previousStatus = order.status;
    console.log(JSON.stringify({
        event: 'order.transition',
        orderId: input.orderId,
        from: previousStatus,
        to: 'CANCELED',
        changedBy: input.userId,
        note: `Canceled: ${input.reason}`,
        timestamp: new Date().toISOString(),
    }));
    const updatedOrder = await prisma.order.update({
        where: { id: input.orderId },
        data: {
            status: 'CANCELED',
            cancelReason: input.reason,
            canceledBy: input.userId,
            canceledAt: new Date(),
            ...(refunded && {
                paymentStatus: 'REFUNDED',
                refundedAt: new Date(),
            }),
        },
    });
    // Create order event for audit trail
    await prisma.orderEvent.create({
        data: {
            orderId: input.orderId,
            status: 'CANCELED',
            note: `Canceled: ${input.reason}`,
        },
    });
    await publishOrderStatusChanged(updatedOrder.id, previousStatus, updatedOrder.status, {
        note: `Canceled: ${input.reason}`,
        changedBy: input.userId,
    });
    return {
        orderId: updatedOrder.id,
        status: updatedOrder.status,
        canceledAt: updatedOrder.canceledAt,
        refunded,
        refundAmount,
    };
}
/**
 * Get cancellation statistics for a store
 */
export async function getStoreCancellationStats(storeId, startDate, endDate) {
    const where = {
        storeId,
        status: 'CANCELED',
    };
    if (startDate || endDate) {
        where.canceledAt = {};
        if (startDate) {
            where.canceledAt.gte = startDate;
        }
        if (endDate) {
            where.canceledAt.lte = endDate;
        }
    }
    const total = await prisma.order.count({ where });
    // For now, return empty byReason until schema is regenerated
    const byReason = [];
    const refundedCount = await prisma.order.count({
        where: {
            ...where,
            paymentStatus: 'REFUNDED',
        },
    });
    return {
        totalCancellations: total,
        refundedOrders: refundedCount,
        refundRate: total > 0 ? (refundedCount / total) * 100 : 0,
        byReason,
    };
}
/**
 * Get recent cancellations for review
 */
export async function getRecentCancellations(options) {
    const where = {
        status: 'CANCELED',
    };
    if (options?.storeId) {
        where.storeId = options.storeId;
    }
    return prisma.order.findMany({
        where,
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    name: true,
                },
            },
            store: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                },
            },
        },
        orderBy: { createdAt: 'desc' },
        take: options?.limit || 50,
        skip: options?.offset || 0,
    });
}
/**
 * Check if order is eligible for cancellation
 */
export async function canCancelOrder(orderId, userId) {
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
            store: { select: { ownerUserId: true } },
        },
    });
    if (!order) {
        return { canCancel: false, reason: 'Order not found', requiresRefund: false };
    }
    const actor = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
    });
    const isAdmin = actor?.role === 'ADMIN';
    const isCustomer = order.userId === userId;
    const isStoreSide = await userCanManageOrdersOnStore(userId, order.storeId, order.store.ownerUserId);
    if (!isCustomer && !isStoreSide && !isAdmin) {
        return { canCancel: false, reason: 'Unauthorized', requiresRefund: false };
    }
    const { valid, reason } = canTransitionTo(order.status, 'CANCELED');
    if (!valid) {
        return { canCancel: false, reason, requiresRefund: false };
    }
    const requiresRefund = order.paymentStatus === 'PAID';
    return { canCancel: true, requiresRefund };
}
