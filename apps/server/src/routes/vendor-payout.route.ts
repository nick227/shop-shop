import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import {
  getVendorPayoutSummary,
  processVendorPayout,
  getStoresReadyForPayout,
  processAllVendorPayouts,
  getVendorPayoutHistory,
  getPendingPayoutAmount,
} from '@packages/db'
import { requireRole } from '../middleware/rbac'

const ProcessPayoutSchema = z.object({
  storeId: z.string().uuid(),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
})

const BatchPayoutSchema = z.object({
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
})

const PayoutSummarySchema = z.object({
  storeId: z.string().uuid(),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
})

export const vendorPayoutRoutes = async (app: FastifyInstance) => {
  // GET /vendor-payouts/summary - Get payout summary for a store
  app.get('/vendor-payouts/summary', {
    preHandler: [requireRole(['VENDOR', 'ADMIN'])],
  }, async (req, reply) => {
    try {
      const query = PayoutSummarySchema.parse(req.query)

      // TODO: For vendors, verify store ownership
      
      const summary = await getVendorPayoutSummary(
        query.storeId,
        new Date(query.periodStart),
        new Date(query.periodEnd)
      )

      return reply.code(200).send({ summary })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation error', details: error.errors })
      }
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          return reply.code(404).send({ error: error.message })
        }
      }
      throw error
    }
  })

  // GET /vendor-payouts/stores/:storeId/pending - Get pending payout amount
  app.get('/vendor-payouts/stores/:storeId/pending', {
    preHandler: [requireRole(['VENDOR', 'ADMIN'])],
  }, async (req, reply) => {
    try {
      const params = req.params as { storeId: string }

      // TODO: For vendors, verify store ownership

      const amount = await getPendingPayoutAmount(params.storeId)

      return reply.code(200).send({ storeId: params.storeId, pendingAmount: amount })
    } catch (error) {
      throw error
    }
  })

  // GET /vendor-payouts/stores/:storeId/history - Get payout history
  app.get('/vendor-payouts/stores/:storeId/history', {
    preHandler: [requireRole(['VENDOR', 'ADMIN'])],
  }, async (req, reply) => {
    try {
      const params = req.params as { storeId: string }
      const query = req.query as { limit?: string; offset?: string }

      // TODO: For vendors, verify store ownership

      const history = await getVendorPayoutHistory(params.storeId, {
        limit: query.limit ? parseInt(query.limit) : undefined,
        offset: query.offset ? parseInt(query.offset) : undefined,
      })

      return reply.code(200).send(history)
    } catch (error) {
      throw error
    }
  })

  // POST /vendor-payouts/process - Process payout for a store (Admin only)
  app.post('/vendor-payouts/process', {
    preHandler: [requireRole(['ADMIN'])],
  }, async (req, reply) => {
    try {
      const input = ProcessPayoutSchema.parse(req.body)

      const result = await processVendorPayout({
        storeId: input.storeId,
        periodStart: new Date(input.periodStart),
        periodEnd: new Date(input.periodEnd),
      })

      return reply.code(200).send({ payout: result })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation error', details: error.errors })
      }
      if (error instanceof Error) {
        if (error.message.includes('not found') || error.message.includes('No orders')) {
          return reply.code(404).send({ error: error.message })
        }
        if (error.message.includes('Stripe account') || error.message.includes('onboarded')) {
          return reply.code(400).send({ error: error.message })
        }
      }
      throw error
    }
  })

  // GET /vendor-payouts/eligible - Get all stores eligible for payout (Admin only)
  app.get('/vendor-payouts/eligible', {
    preHandler: [requireRole(['ADMIN'])],
  }, async (req, reply) => {
    try {
      const query = z.object({
        periodStart: z.string().datetime(),
        periodEnd: z.string().datetime(),
      }).parse(req.query)

      const eligible = await getStoresReadyForPayout(
        new Date(query.periodStart),
        new Date(query.periodEnd)
      )

      return reply.code(200).send({
        eligible,
        count: eligible.length,
        totalAmount: eligible.reduce((sum, s) => sum + s.netPayout, 0),
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation error', details: error.errors })
      }
      throw error
    }
  })

  // POST /vendor-payouts/process-all - Process payouts for all eligible stores (Admin only)
  app.post('/vendor-payouts/process-all', {
    preHandler: [requireRole(['ADMIN'])],
  }, async (req, reply) => {
    try {
      const input = BatchPayoutSchema.parse(req.body)

      const results = await processAllVendorPayouts(
        new Date(input.periodStart),
        new Date(input.periodEnd)
      )

      return reply.code(200).send({
        processed: results.success.length,
        failed: results.failed.length,
        totalPaidOut: results.success.reduce((sum, r) => sum + r.amount, 0),
        results,
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation error', details: error.errors })
      }
      throw error
    }
  })
}

