import { requireVendorWorkspace } from '../middleware/vendorAccess.js'
﻿import type { FastifyInstance } from 'fastify'
import { requireVendorAuth } from './vendor/vendorHelpers.js'
import { getStoreReadiness } from '../services/store-readiness.service.js'

export const storeReadinessRoutes = async (app: FastifyInstance) => {
  app.get('/stores/:id/readiness', {
    preHandler: [requireVendorWorkspace],
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
