import type { FastifyInstance } from 'fastify'
import { prisma } from '@packages/db'
import { authenticate } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'

export const driverRoutes = async (app: FastifyInstance) => {
  // GET /driver/deliveries - Assigned active delivery orders for current driver
  app.get('/driver/deliveries', {
    preHandler: [authenticate, requireRole(['RIDER', 'ADMIN'])],
  }, async (req, reply) => {
    const { user } = req
    if (!user) return reply.code(401).send({ error: 'Unauthorized' })

    // ADMIN can optionally query other drivers later; v1 is "current driver only"
    const driverUserId = user.id

    const orders = await prisma.order.findMany({
      where: {
        assignedToUserId: driverUserId,
        deliveryType: 'DELIVERY',
        status: { in: ['READY', 'OUT_FOR_DELIVERY'] },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        store: { select: { id: true, name: true, slug: true, latitude: true, longitude: true } },
        items: true,
      },
    })

    return reply.code(200).send({ orders })
  })
}

