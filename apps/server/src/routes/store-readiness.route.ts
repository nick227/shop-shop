import type { FastifyInstance } from 'fastify'
import { requireRole } from '../middleware/rbac'
import { requireVendorAuth } from './vendor/vendorHelpers'
import { getStoreReadiness } from '../services/store-readiness.service.js'

export const storeReadinessRoutes = async (app: FastifyInstance) => {
  app.get('/stores/:id/readiness', {
    preHandler: [requireRole(['VENDOR', 'STAFF', 'ADMIN'])],
  }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const readiness = await getStoreReadiness(id)

    if (!readiness) {
      return reply.code(404).send({ error: 'Store not found' })
    }

    if (!await requireVendorAuth(req.user?.id, req.user?.role, id, 'settings', reply)) {
      return
    }

    return reply.code(200).send(readiness)
  })
}
