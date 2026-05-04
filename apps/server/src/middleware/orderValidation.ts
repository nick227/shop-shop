/**
 * Order Status Validation Middleware
 *
 * Validates order status transitions using the current DB status before processing.
 */

import type { FastifyRequest, FastifyReply } from 'fastify'
import { validateStatusTransition, type OrderStatus } from '../orders/validation'
import { prisma, type PrismaOrderStatus } from '@packages/db'
import type { AuthenticatedUser } from './auth.js'

function mapRoleForTransition(user: AuthenticatedUser | undefined): 'customer' | 'vendor' | 'admin' | undefined {
  if (!user) return undefined
  if (user.role === 'ADMIN') return 'admin'
  if (user.role === 'USER') return 'customer'
  if (user.role === 'VENDOR' || user.role === 'STAFF') return 'vendor'
  return undefined
}

/** Loads current order status from the database (single source of truth). */
export async function getCurrentOrderStatusFromDb(orderId: string): Promise<PrismaOrderStatus | null> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { status: true },
  })
  return order?.status ?? null
}

export function createOrderStatusValidationMiddleware() {
  return async function orderStatusValidationMiddleware(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as { orderId?: string }
    const body = request.body as { status?: string } | undefined
    const orderId = params.orderId
    const newStatus = body?.status
    const user = request.user

    if (!orderId || !newStatus) {
      reply.status(400).send({
        error: 'Bad Request',
        message: 'Order ID and new status are required',
      })
      return
    }

    const currentStatus = await getCurrentOrderStatusFromDb(orderId)
    if (!currentStatus) {
      reply.status(404).send({
        error: 'Not Found',
        message: 'Order not found',
      })
      return
    }

    const validation = validateStatusTransition(
      currentStatus as OrderStatus,
      newStatus as OrderStatus,
      {
        userId: user?.id,
        userRole: mapRoleForTransition(user),
        timestamp: new Date().toISOString(),
        orderId,
      },
    )

    if (!validation.isValid) {
      reply.status(400).send({
        error: 'Bad Request',
        message: 'Invalid status transition',
        details: validation.errors,
        warnings: validation.warnings,
      })
      return
    }

    ;(request as FastifyRequest & { orderValidation?: typeof validation }).orderValidation = validation
  }
}

export async function logOrderStatusChange(
  orderId: string,
  _fromStatus: string,
  toStatus: string,
  userId: string,
  reason?: string,
): Promise<void> {
  await prisma.orderEvent.create({
    data: {
      orderId,
      status: toStatus as PrismaOrderStatus,
      note: reason ?? null,
    },
  })
}
