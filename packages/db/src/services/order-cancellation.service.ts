import { executeOrderCommand } from './order-lifecycle.service.js'
import { getAccountCapabilities } from './account-capabilities.service.js'
﻿import { prisma } from '../client.js'
import { refundOrder } from './payment.service.js'
import { publishOrderStatusChanged } from './order-realtime.publisher.js'
import { assertValidTransition, canTransitionTo } from '../order-state-machine.js'
import { Decimal } from 'decimal.js'

export interface CancelOrderInput {
  orderId: string
  userId: string
  reason: string
  shouldRefund?: boolean
}

export interface CancelOrderResult {
  orderId: string
  status: string
  canceledAt: Date
  refunded: boolean
  refundAmount?: number
}

export const CANCELLATION_REASONS = {
  CUSTOMER_REQUEST: 'Customer requested cancellation',
  OUT_OF_STOCK: 'Items out of stock',
  KITCHEN_CAPACITY: 'Kitchen at capacity',
  DELIVERY_UNAVAILABLE: 'Delivery unavailable',
  PAYMENT_FAILED: 'Payment processing failed',
  FRAUD_SUSPECTED: 'Suspected fraudulent order',
  CUSTOMER_NO_SHOW: 'Customer no-show for pickup',
  OTHER: 'Other reason',
} as const

async function userCanManageOrdersOnStore(
  userId: string,
  storeId: string,
  storeOwnerId: string,
): Promise<boolean> {
  if (!(await getAccountCapabilities(userId)).canAccessVendorPortal) return false
  if (userId === storeOwnerId) return true
  const member = await prisma.teamMember.findFirst({
    where: { storeId, userId, isActive: true },
    select: { permissionsJson: true },
  })
  if (!member) return false
  const raw = member.permissionsJson
  const perms: string[] = Array.isArray(raw)
    ? raw.filter((p): p is string => typeof p === 'string')
    : []
  return perms.includes('MANAGE_ORDERS') || perms.includes('FULL_ACCESS')
}

/**
 * Cancel an order with optional refund
 */
export async function cancelOrder(input: CancelOrderInput): Promise<CancelOrderResult> {
  const order = await prisma.order.findUnique({
    where: { id: input.orderId },
    include: {
      store: { select: { ownerUserId: true } },
      user: { select: { id: true, email: true } },
    },
  })

  if (!order) {
    throw new Error('Order not found')
  }

  const actor = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { role: true },
  })
  const isAdmin = (await getAccountCapabilities(input.userId)).canAdministerStores

  const isCustomer = order.userId === input.userId
  const isStoreSide = await userCanManageOrdersOnStore(
    input.userId,
    order.storeId,
    order.store.ownerUserId,
  )

  if (!isCustomer && !isStoreSide && !isAdmin) {
    throw new Error('Unauthorized: Only customer, store staff, or admin can cancel this order')
  }

  if (isCustomer && !isStoreSide && !isAdmin && !['PENDING_PAYMENT', 'PLACED'].includes(order.status)) {
    throw new Error('Unauthorized: Contact the store to cancel after acceptance')
  }
  const updated = await executeOrderCommand({ orderId: input.orderId, newStatus: 'CANCELED', customerOnly: isCustomer && !isStoreSide && !isAdmin, changedBy: input.userId, note: input.reason })
  return { orderId: updated.id, status: updated.status, canceledAt: updated.canceledAt!, refunded: updated.paymentStatus === 'REFUNDED' }

}

/**
 * Get cancellation statistics for a store
 */
export async function getStoreCancellationStats(
  storeId: string,
  startDate?: Date,
  endDate?: Date
) {
  const where: Record<string, unknown> = {
    storeId,
    status: 'CANCELED',
  }

  if (startDate || endDate) {
    where.canceledAt = {}
    if (startDate) {
      (where.canceledAt as Record<string, unknown>).gte = startDate
    }
    if (endDate) {
      (where.canceledAt as Record<string, unknown>).lte = endDate
    }
  }

  const total = await prisma.order.count({ where })
  
  // For now, return empty byReason until schema is regenerated
  const byReason: Array<{ reason: string; count: number }> = []

  const refundedCount = await prisma.order.count({
    where: {
      ...where,
      paymentStatus: 'REFUNDED',
    },
  })

  return {
    totalCancellations: total,
    refundedOrders: refundedCount,
    refundRate: total > 0 ? (refundedCount / total) * 100 : 0,
    byReason,
  }
}

/**
 * Get recent cancellations for review
 */
export async function getRecentCancellations(options?: {
  storeId?: string
  limit?: number
  offset?: number
}) {
  const where: Record<string, unknown> = {
    status: 'CANCELED',
  }

  if (options?.storeId) {
    where.storeId = options.storeId
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
  })
}

/**
 * Check if order is eligible for cancellation
 */
export async function canCancelOrder(orderId: string, userId: string): Promise<{
  canCancel: boolean
  reason?: string
  requiresRefund: boolean
}> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      store: { select: { ownerUserId: true } },
    },
  })

  if (!order) {
    return { canCancel: false, reason: 'Order not found', requiresRefund: false }
  }

  const actor = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })
  const isAdmin = (await getAccountCapabilities(userId)).canAdministerStores

  const isCustomer = order.userId === userId
  const isStoreSide = await userCanManageOrdersOnStore(
    userId,
    order.storeId,
    order.store.ownerUserId,
  )

  if (!isCustomer && !isStoreSide && !isAdmin) {
    return { canCancel: false, reason: 'Unauthorized', requiresRefund: false }
  }

  if (isCustomer && !isStoreSide && !isAdmin && !['PENDING_PAYMENT', 'PLACED'].includes(order.status)) return { canCancel: false, reason: 'Contact the store after acceptance', requiresRefund: false }

  const { valid, reason } = canTransitionTo(order.status, 'CANCELED')
  if (!valid) {
    return { canCancel: false, reason, requiresRefund: false }
  }

  const requiresRefund = order.paymentStatus === 'PAID'

  return { canCancel: true, requiresRefund }
}

