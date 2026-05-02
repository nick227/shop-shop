import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import {
  cancelOrder,
  getStoreCancellationStats,
  getRecentCancellations,
  canCancelOrder,
  CANCELLATION_REASONS,
} from '@packages/db'
import { requireRole } from '../middleware/rbac'
import { rateLimits } from '../constants/rateLimits.js'

const CancelOrderSchema = z.object({
  orderId: z.string().uuid(),
  reason: z.string().min(1),
  shouldRefund: z.boolean().optional(),
})

const CancellationStatsSchema = z.object({
  storeId: z.string().uuid(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
})

export const orderCancellationRoutes = async (app: FastifyInstance) => {
  // POST /orders/cancel - Cancel an order
  app.post('/orders/cancel', {
    config: {
      rateLimit: rateLimits.orderCancel,
    },
    preHandler: [requireRole(['USER', 'VENDOR', 'ADMIN'])],
  }, async (req, reply) => {
    try {
      const userId = req.user?.id
      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' })
      }

      const input = CancelOrderSchema.parse(req.body)

      const result = await cancelOrder({
        ...input,
        userId,
      })

      return reply.code(200).send({ result })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation error', details: error.errors })
      }
      if (error instanceof Error) {
        if (
          error.message.includes('not found') ||
          error.message.includes('Unauthorized') ||
          error.message.includes('Cannot cancel') ||
          error.message.includes('already')
        ) {
          return reply.code(400).send({ error: error.message })
        }
      }
      throw error
    }
  })

  // GET /orders/:id/can-cancel - Check if order can be canceled
  app.get('/orders/:id/can-cancel', {
    preHandler: [requireRole(['USER', 'VENDOR', 'ADMIN'])],
  }, async (req, reply) => {
    try {
      const userId = req.user?.id
      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' })
      }

      const params = req.params as { id: string }

      const result = await canCancelOrder(params.id, userId)

      return reply.code(200).send(result)
    } catch (error) {
      throw error
    }
  })

  // GET /orders/cancellations/reasons - Get available cancellation reasons
  app.get('/orders/cancellations/reasons', async (req, reply) => {
    return reply.code(200).send({ reasons: CANCELLATION_REASONS })
  })

  // GET /orders/cancellations/recent - Get recent cancellations
  app.get('/orders/cancellations/recent', {
    preHandler: [requireRole(['VENDOR', 'ADMIN'])],
  }, async (req, reply) => {
    try {
      const query = req.query as { storeId?: string; limit?: string; offset?: string }

      // TODO: For vendors, verify store ownership

      const cancellations = await getRecentCancellations({
        storeId: query.storeId,
        limit: query.limit ? parseInt(query.limit) : undefined,
        offset: query.offset ? parseInt(query.offset) : undefined,
      })

      return reply.code(200).send({ cancellations })
    } catch (error) {
      throw error
    }
  })

  // GET /orders/cancellations/stats - Get cancellation statistics
  app.get('/orders/cancellations/stats', {
    preHandler: [requireRole(['VENDOR', 'ADMIN'])],
  }, async (req, reply) => {
    try {
      const query = CancellationStatsSchema.parse(req.query)

      // TODO: For vendors, verify store ownership

      const stats = await getStoreCancellationStats(
        query.storeId,
        query.startDate ? new Date(query.startDate) : undefined,
        query.endDate ? new Date(query.endDate) : undefined
      )

      return reply.code(200).send({ stats })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation error', details: error.errors })
      }
      throw error
    }
  })
}

