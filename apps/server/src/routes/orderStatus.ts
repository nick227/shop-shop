import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma, executeOrderCommand, orderOperations } from '@packages/db'
import { requireAuth } from '../middleware/rbac.js'
import { assertOrderAccess } from '../resources/order-access.js'
import { canManageOrder } from './order-operations.route.js'

/** Compatibility routes delegate to the same authoritative command service. */
export default async function orderStatusRoutes(app: FastifyInstance) {
  app.patch('/:orderId/status', { preHandler: [requireAuth] }, async (req, reply) => {
    const { orderId } = z.object({ orderId: z.string().uuid() }).parse(req.params)
    const body = z
      .object({
        status: z.enum([
          'ACCEPTED',
          'PREPARING',
          'READY',
          'COMPLETED',
          'OUT_FOR_DELIVERY',
          'DELIVERED',
          'CANCELED',
        ]),
        prepMinutes: z.number().int().min(1).max(240).optional(),
        reason: z.string().optional(),
        expectedVersion: z.number().int().optional(),
        operationId: z.string().max(100).optional(),
        collectionCode: z.string().optional(),
      })
      .parse(req.body)
    const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } })
    const manager = await canManageOrder(req.user!.id, order.storeId)
    if (
      !manager &&
      !(
        order.userId === req.user!.id &&
        body.status === 'CANCELED' &&
        ['PLACED', 'PENDING_PAYMENT'].includes(order.status)
      )
    )
      return reply.code(403).send({ error: 'You cannot perform this action' })
    try {
      return {
        order: await executeOrderCommand({
          ...body,
          newStatus: body.status,
          customerOnly: !manager,
          orderId,
          changedBy: req.user!.id,
          note: body.reason,
        }),
      }
    } catch (error) {
      return reply
        .code(409)
        .send({ error: error instanceof Error ? error.message : 'Order changed' })
    }
  })
  for (const suffix of ['status', 'transitions']) {
    app.get(`/:orderId/${suffix}`, { preHandler: [requireAuth] }, async (req) => {
      const { orderId } = z.object({ orderId: z.string().uuid() }).parse(req.params)
      const order = await prisma.order.findUniqueOrThrow({
        where: { id: orderId },
        include: { events: { orderBy: { createdAt: 'asc' } } },
      })
      await assertOrderAccess(order, { userId: req.user!.id, userRole: req.user!.role }, 'read')
      return {
        orderId,
        status: order.status,
        statusHistory: order.events,
        allowedTransitions: (await canManageOrder(req.user!.id, order.storeId))
          ? orderOperations(order).allowedActions
          : [],
      }
    })
  }
}
