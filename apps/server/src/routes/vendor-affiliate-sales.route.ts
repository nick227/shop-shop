import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { requireRole } from '../middleware/rbac'
import { userHasStoreAccess } from '../middleware/storeAccess'
import {
  getStoreAffiliateRecentOrders,
  getStoreAffiliateSalesByAffiliate,
  getStoreAffiliateSalesSummary,
} from '@packages/db'

async function canViewAffiliateSales(userId: string, userRole: string, storeId: string) {
  const [analytics, finance] = await Promise.all([
    userHasStoreAccess(userId, userRole, storeId, 'analytics'),
    userHasStoreAccess(userId, userRole, storeId, 'finance'),
  ])
  return analytics || finance
}

const StoreIdParamsSchema = z.object({
  storeId: z.string().uuid(),
})

export const vendorAffiliateSalesRoutes = async (app: FastifyInstance) => {
  // GET /api/vendor/stores/:storeId/affiliate-sales
  app.get(
    '/api/vendor/stores/:storeId/affiliate-sales',
    { preHandler: [requireRole(['USER', 'VENDOR', 'ADMIN', 'STAFF'])] },
    async (req, reply) => {
      const userId = req.user?.id
      if (!userId) return reply.code(401).send({ error: 'Unauthorized' })

      const params = StoreIdParamsSchema.parse(req.params)
      const allowed = await canViewAffiliateSales(userId, req.user!.role, params.storeId)
      if (!allowed) return reply.code(403).send({ error: 'You cannot view affiliate sales for this store' })

      const [summary, rows, recentOrders] = await Promise.all([
        getStoreAffiliateSalesSummary(params.storeId),
        getStoreAffiliateSalesByAffiliate(params.storeId),
        getStoreAffiliateRecentOrders(params.storeId, 25),
      ])

      return reply.code(200).send({ summary, rows, recentOrders })
    }
  )
}

