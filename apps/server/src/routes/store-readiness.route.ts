import type { FastifyInstance } from 'fastify'
import { authenticate } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac'
import { userHasStoreAccess } from '../middleware/storeAccess.js'
import { getStoreReadiness } from '../services/store-readiness.service.js'

export const storeReadinessRoutes = async (app: FastifyInstance) => {
  app.get('/stores/:id/readiness', {
    preHandler: [authenticate, requireRole(['VENDOR', 'STAFF', 'ADMIN'])],
  }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const readiness = await getStoreReadiness(id)

    if (!readiness) {
      return reply.code(404).send({ error: 'Store not found' })
    }

    if (!(await userHasStoreAccess(req.user!.id, req.user!.role, id, 'settings'))) {
      return reply.code(403).send({ error: 'Forbidden: you do not manage this store' })
    }

    return reply.code(200).send(readiness)
  })
}
