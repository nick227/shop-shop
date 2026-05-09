import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import {
  validatePromotionCode,
  redeemPromotion,
  getUserPromotionHistory,
  getPromotionAnalytics,
  canUserUsePromotion,
  getActivePromotionsForStore,
} from '@packages/db'
import { requireRole } from '../middleware/rbac'
import { VendorErrors } from './vendor/vendorHelpers'

const ValidatePromotionSchema = z.object({
  code: z.string().min(1),
  storeId: z.string().uuid().optional(),
  orderSubtotal: z.number().positive(),
  appliedPromotions: z.array(z.string()).optional(),
})

const RedeemPromotionSchema = z.object({
  promotionId: z.string().uuid(),
  orderId: z.string().uuid().optional(),
  discountAmount: z.number().positive(),
})

export const promotionEnhancedRoutes = async (app: FastifyInstance) => {
  // POST /promotions/validate - Validate promotion code
  app.post('/promotions/validate', {
    preHandler: [requireRole(['USER', 'VENDOR', 'ADMIN'])],
  }, async (req, reply) => {
    try {
      const userId = req.user?.id
      if (!userId) {
        return VendorErrors.unauthorized(reply)
      }

      const input = ValidatePromotionSchema.parse(req.body)

      const result = await validatePromotionCode({
        ...input,
        userId,
      })

      return reply.code(200).send(result)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation error', details: error.errors })
      }
      throw error
    }
  })

  // POST /promotions/redeem - Redeem promotion code
  app.post('/promotions/redeem', {
    preHandler: [requireRole(['USER', 'VENDOR', 'ADMIN'])],
  }, async (req, reply) => {
    try {
      const userId = req.user?.id
      if (!userId) {
        return VendorErrors.unauthorized(reply)
      }

      const input = RedeemPromotionSchema.parse(req.body)

      const redemption = await redeemPromotion({
        promotionId: input.promotionId,
        orderId: input.orderId,
        discountAmount: input.discountAmount,
        userId,
      })

      return reply.code(201).send({ redemption })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation error', details: error.errors })
      }
      throw error
    }
  })

  // GET /promotions/me/history - Get user's redemption history
  app.get('/promotions/me/history', {
    preHandler: [requireRole(['USER', 'VENDOR', 'ADMIN'])],
  }, async (req, reply) => {
    try {
      const userId = req.user?.id
      if (!userId) {
        return VendorErrors.unauthorized(reply)
      }

      const history = await getUserPromotionHistory(userId)

      return reply.code(200).send({ history })
    } catch (error) {
      throw error
    }
  })

  // GET /promotions/:id/analytics - Get promotion analytics
  app.get('/promotions/:id/analytics', {
    preHandler: [requireRole(['VENDOR', 'ADMIN'])],
  }, async (req, reply) => {
    try {
      const params = req.params as { id: string }

      // TODO: Verify user owns promotion or is admin

      const analytics = await getPromotionAnalytics(params.id)

      return reply.code(200).send(analytics)
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return reply.code(404).send({ error: error.message })
      }
      throw error
    }
  })

  // GET /promotions/:id/can-use - Check if user can use promotion
  app.get('/promotions/:id/can-use', {
    preHandler: [requireRole(['USER', 'VENDOR', 'ADMIN'])],
  }, async (req, reply) => {
    try {
      const userId = req.user?.id
      if (!userId) {
        return VendorErrors.unauthorized(reply)
      }

      const params = req.params as { id: string }

      const result = await canUserUsePromotion(params.id, userId)

      return reply.code(200).send(result)
    } catch (error) {
      throw error
    }
  })

  // GET /stores/:storeId/promotions/active - Get active promotions for store
  app.get('/stores/:storeId/promotions/active', async (req, reply) => {
    try {
      const params = req.params as { storeId: string }

      const promotions = await getActivePromotionsForStore(params.storeId)

      return reply.code(200).send({ promotions })
    } catch (error) {
      throw error
    }
  })
}

