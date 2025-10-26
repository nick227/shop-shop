import { prisma } from '../client'
import { refundOrder } from './payment.service'
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

  // Check authorization
  const isCustomer = order.userId === input.userId
  const isVendor = order.store.ownerUserId === input.userId
  // TODO: Check if user is admin

  if (!isCustomer && !isVendor) {
    throw new Error('Unauthorized: Only customer or vendor can cancel this order')
  }

  // Check if order can be canceled
  if (order.status === 'COMPLETED') {
    throw new Error('Cannot cancel completed order - use refund instead')
  }

  if (order.status === 'CANCELED') {
    throw new Error('Order already canceled')
  }

  // Determine if refund is needed
  let refunded = false
  let refundAmount: number | undefined

  if (input.shouldRefund && order.paymentStatus === 'PAID') {
    try {
      const refundResult = await refundOrder({
        orderId: input.orderId,
        userId: input.userId,
      })
      
      refunded = true
      refundAmount = refundResult.amount
    } catch (error) {
      console.error('Refund failed during cancellation:', error)
      // Continue with cancellation even if refund fails
    }
  }

  // Update order status
  const updatedOrder = await prisma.order.update({
    where: { id: input.orderId },
    data: {
      status: 'CANCELED',
      cancelReason: input.reason as unknown,
      canceledBy: input.userId as unknown,
      canceledAt: new Date() as unknown,
      ...(refunded && {
        paymentStatus: 'REFUNDED',
        refundedAt: new Date() as unknown,
      }),
    } as object,
  })

  // Create order event for audit trail
  await prisma.orderEvent.create({
    data: {
      orderId: input.orderId,
      status: 'CANCELED',
      note: `Canceled: ${input.reason}`,
    },
  })

  // TODO: Send notification to customer and vendor

  return {
    orderId: updatedOrder.id,
    status: updatedOrder.status,
    canceledAt: (updatedOrder as unknown as { canceledAt: Date }).canceledAt,
    refunded,
    refundAmount,
  }
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

  const isCustomer = order.userId === userId
  const isVendor = order.store.ownerUserId === userId

  if (!isCustomer && !isVendor) {
    return { canCancel: false, reason: 'Unauthorized', requiresRefund: false }
  }

  if (order.status === 'COMPLETED') {
    return { 
      canCancel: false, 
      reason: 'Order completed - use refund instead', 
      requiresRefund: false 
    }
  }

  if (order.status === 'CANCELED') {
    return { canCancel: false, reason: 'Order already canceled', requiresRefund: false }
  }

  const requiresRefund = order.paymentStatus === 'PAID'

  return { canCancel: true, requiresRefund }
}

