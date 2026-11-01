import { requireVendorWorkspace } from '../middleware/vendorAccess.js'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { VendorErrors, requireVendorAuth, userHasStoreAccess } from './vendor/vendorHelpers.js'
import {
  getStoreAffiliateRecentOrders,
  getStoreAffiliateSalesByAffiliate,
  getStoreAffiliateSalesSummary,
} from '@packages/db'

const StoreIdParamsSchema = z.object({
  storeId: z.string().uuid(),
})

export const vendorAffiliateSalesRoutes = async (app: FastifyInstance) => {
  // GET /api/vendor/stores/:storeId/affiliate-sales
  app.get(
    '/api/vendor/stores/:storeId/affiliate-sales',
    { preHandler: [requireVendorWorkspace] },
    async (req, reply) => {
      const userId = req.user?.id
      const params = StoreIdParamsSchema.parse(req.params)

      if (!await requireVendorAuth(userId, req.user!.role, params.storeId, 'analytics', reply)) {
        return
      }

      const [summary, rows, recentOrders] = await Promise.all([
        getStoreAffiliateSalesSummary(params.storeId),
        getStoreAffiliateSalesByAffiliate(params.storeId),
        getStoreAffiliateRecentOrders(params.storeId, 25),
      ])

      return reply.code(200).send({ summary, rows, recentOrders })
    }
  )
}

