/**
 * Order Status Routes
 *
 * Endpoints for updating and retrieving order status with validation and audit logging.
 */

import type { FastifyInstance, FastifyReply } from 'fastify'
import { z } from 'zod'
import { OrderStatus } from '../orders/validation'
import { createOrderStatusValidationMiddleware, logOrderStatusChange } from '../middleware/orderValidation'
import { prisma } from '@packages/db'
import { requireAuth } from '../middleware/rbac.js'
import { userHasStoreAccess } from '../middleware/storeAccess.js'

const updateOrderStatusSchema = z.object({
  status: z.enum(['PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'COMPLETED', 'CANCELED']),
  reason: z.string().optional(),
  notes: z.string().optional(),
})

const orderParamsSchema = z.object({
  orderId: z.string().uuid('Invalid order ID format'),
})

interface OrderForAccess {
  id: string
  status: string
  customerId: string
  storeId: string
}

async function getOrderForAccess(orderId: string): Promise<OrderForAccess | null> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      status: true,
      userId: true,
      storeId: true,
    },
  })
  if (!order) return null
  return {
    id: order.id,
    status: order.status,
    customerId: order.userId,
    storeId: order.storeId,
  }
}

async function assertCanViewOrModifyOrder(
  user: { id: string; role: string },
  order: OrderForAccess,
  reply: FastifyReply,
): Promise<boolean> {
  if (user.role === 'ADMIN') return true

  if (user.role === 'USER') {
    if (order.customerId !== user.id) {
      reply.code(403).send({ error: 'Forbidden', message: 'You can only access your own orders' })
      return false
    }
    return true
  }

  if (user.role === 'VENDOR' || user.role === 'STAFF') {
    const allowed = await userHasStoreAccess(user.id, user.role, order.storeId, 'orders')
    if (!allowed) {
      reply.code(403).send({ error: 'Forbidden', message: 'You can only access orders for stores you manage' })
      return false
    }
    return true
  }

  reply.code(403).send({ error: 'Forbidden', message: 'Insufficient permissions for this order' })
  return false
}

async function updateOrderStatus(orderId: string, newStatus: OrderStatus, userId: string, reason?: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { status: true } })
  if (!order) throw new Error('Order not found')

  const oldStatus = order.status
  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { status: newStatus },
    select: { id: true, status: true },
  })

  await logOrderStatusChange(orderId, oldStatus, newStatus, userId, reason)
  return updated
}

async function getOrderStatusHistory(orderId: string) {
  const events = await prisma.orderEvent.findMany({
    where: { orderId },
    orderBy: { createdAt: 'asc' },
    select: { status: true, createdAt: true, note: true },
  })
  return events.map((e) => ({
    orderId,
    status: e.status,
    timestamp: e.createdAt.toISOString(),
    userId: '',
    reason: e.note ?? '',
  }))
}

export default async function orderStatusRoutes(fastify: FastifyInstance) {
  const orderValidationMiddleware = createOrderStatusValidationMiddleware()

  fastify.patch(
    '/:orderId/status',
    {
      preHandler: [requireAuth, orderValidationMiddleware],
    },
    async (request, reply) => {
      try {
        const paramsParsed = orderParamsSchema.safeParse(request.params)
        if (!paramsParsed.success) {
          reply.code(400).send({ error: 'Bad Request', message: 'Invalid order ID', details: paramsParsed.error.flatten() })
          return
        }
        const bodyParsed = updateOrderStatusSchema.safeParse(request.body)
        if (!bodyParsed.success) {
          reply.code(400).send({ error: 'Bad Request', message: 'Invalid body', details: bodyParsed.error.flatten() })
          return
        }
        const { orderId } = paramsParsed.data
        const { status: newStatus, reason } = bodyParsed.data
        const user = request.user
        const validation = (request as unknown as { orderValidation?: { isValid: boolean; warnings: string[] } }).orderValidation

        if (!user) {
          reply.code(401).send({ error: 'Unauthorized', message: 'Authentication required' })
          return
        }

        const order = await getOrderForAccess(orderId)
        if (!order) {
          reply.code(404).send({ error: 'Not Found', message: 'Order not found' })
          return
        }

        if (!(await assertCanViewOrModifyOrder(user, order, reply))) return

        const updatedOrder = await updateOrderStatus(orderId, newStatus as OrderStatus, user.id, reason)

        reply.code(200).send({
          order: {
            id: updatedOrder.id,
            status: updatedOrder.status,
            updatedAt: new Date().toISOString(),
          },
          validation: {
            isValid: validation?.isValid ?? true,
            warnings: validation?.warnings ?? [],
          },
        })
      } catch (error) {
        request.log.error({ err: error }, 'Order status update error')
        reply.code(500).send({
          error: 'Internal Server Error',
          message: 'Failed to update order status',
        })
      }
    },
  )

  fastify.get(
    '/:orderId/status',
    {
      preHandler: [requireAuth],
    },
    async (request, reply) => {
      try {
        const paramsParsed = orderParamsSchema.safeParse(request.params)
        if (!paramsParsed.success) {
          reply.code(400).send({ error: 'Bad Request', message: 'Invalid order ID', details: paramsParsed.error.flatten() })
          return
        }
        const { orderId } = paramsParsed.data
        const user = request.user
        if (!user) {
          reply.code(401).send({ error: 'Unauthorized', message: 'Authentication required' })
          return
        }

        const order = await getOrderForAccess(orderId)
        if (!order) {
          reply.code(404).send({ error: 'Not Found', message: 'Order not found' })
          return
        }

        if (!(await assertCanViewOrModifyOrder(user, order, reply))) return

        const statusHistory = await getOrderStatusHistory(orderId)

        reply.code(200).send({
          orderId,
          status: order.status,
          statusHistory,
        })
      } catch (error) {
        request.log.error({ err: error }, 'Get order status error')
        reply.code(500).send({
          error: 'Internal Server Error',
          message: 'Failed to get order status',
        })
      }
    },
  )

  fastify.get(
    '/:orderId/transitions',
    {
      preHandler: [requireAuth],
    },
    async (request, reply) => {
      try {
        const paramsParsed = orderParamsSchema.safeParse(request.params)
        if (!paramsParsed.success) {
          reply.code(400).send({ error: 'Bad Request', message: 'Invalid order ID', details: paramsParsed.error.flatten() })
          return
        }
        const { orderId } = paramsParsed.data
        const user = request.user
        if (!user) {
          reply.code(401).send({ error: 'Unauthorized', message: 'Authentication required' })
          return
        }

        const order = await getOrderForAccess(orderId)
        if (!order) {
          reply.code(404).send({ error: 'Not Found', message: 'Order not found' })
          return
        }

        if (!(await assertCanViewOrModifyOrder(user, order, reply))) return

        const { getOrderStatusRules } = await import('../orders/validation')
        const statusRules = getOrderStatusRules(order.status as OrderStatus)

        const allowedTransitions = statusRules.allowedTransitions.map((status) => ({
          status,
          description: getOrderStatusRules(status).description,
          businessRules: getOrderStatusRules(status).businessRules,
        }))

        reply.code(200).send({
          currentStatus: order.status,
          allowedTransitions,
        })
      } catch (error) {
        request.log.error({ err: error }, 'Get order transitions error')
        reply.code(500).send({
          error: 'Internal Server Error',
          message: 'Failed to get order transitions',
        })
      }
    },
  )
}
