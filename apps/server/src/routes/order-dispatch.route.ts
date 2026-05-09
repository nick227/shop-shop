import type { FastifyInstance, FastifyReply } from 'fastify'
import { z } from 'zod'
import { dispatchOrderDelivery, prisma } from '@packages/db'
import { requireAuth } from '../middleware/rbac.js'
import { userHasStoreAccess } from '../middleware/storeAccess.js'
import { VendorErrors } from './vendor/vendorHelpers'
import { toDeliveryJobResponse } from '../resources/delivery-job.resource.js'

const paramsSchema = z.object({
  orderId: z.string().uuid(),
})

const bodySchema = z.object({
  provider: z.enum(['IN_HOUSE', 'DOORDASH_DRIVE', 'UBER_DIRECT']),
  assignedToUserId: z.string().uuid().optional(),
})

async function assertCanDispatchOrder(
  user: { id: string; role: string },
  order: { storeId: string; userId: string },
  reply: FastifyReply,
): Promise<boolean> {
  if (user.role === 'ADMIN') return true
  if (user.role !== 'VENDOR' && user.role !== 'STAFF') {
    reply.code(403).send({ error: 'Forbidden', message: 'Insufficient permissions to dispatch deliveries' })
    return false
  }
  const allowed = await userHasStoreAccess(user.id, user.role, order.storeId, 'dispatch')
  if (!allowed) {
    reply.code(403).send({ error: 'Forbidden', message: 'You cannot dispatch deliveries for this store' })
    return false
  }
  return true
}

export const orderDispatchRoutes = async (app: FastifyInstance) => {
  app.post('/:orderId/dispatch', {
    preHandler: [requireAuth],
  }, async (req, reply) => {
    try {
      const { user } = req
      if (!user) return VendorErrors.unauthorized(reply)

      const paramsParsed = paramsSchema.safeParse(req.params)
      if (!paramsParsed.success) {
        return reply.code(400).send({ error: 'Bad Request', message: 'Invalid orderId', details: paramsParsed.error.flatten() })
      }
      const bodyParsed = bodySchema.safeParse(req.body)
      if (!bodyParsed.success) {
        return reply.code(400).send({ error: 'Bad Request', message: 'Invalid body', details: bodyParsed.error.flatten() })
      }

      const { orderId } = paramsParsed.data
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { id: true, storeId: true, userId: true },
      })
      if (!order) return reply.code(404).send({ error: 'Not Found', message: 'Order not found' })

      const canDispatch = await assertCanDispatchOrder(user, order, reply)
      if (!canDispatch) return

      const deliveryJob = await dispatchOrderDelivery({
        orderId,
        provider: bodyParsed.data.provider,
        requestedByUserId: user.id,
        assignedToUserId: bodyParsed.data.assignedToUserId,
      })

      return reply.code(201).send({ deliveryJob: toDeliveryJobResponse(deliveryJob) })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation error', details: error.errors })
      }
      if (error instanceof Error && (
        error.message.includes('Order is not a delivery order') ||
        error.message.includes('Order must be READY') ||
        error.message.includes('active delivery job') ||
        error.message.includes('assignedToUserId') ||
        error.message.includes('active store driver') ||
        error.message.includes('coordinates')
      )) {
        return reply.code(400).send({ error: error.message })
      }
      throw error
    }
  })
}

