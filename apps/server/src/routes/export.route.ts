import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import {
  exportCommissionsToCSV,
  exportAccountingPayoutsToCSV,
  exportOrdersToCSV,
  streamOrdersToCSV,
  exportTaxSummaryToCSV,
  exportServiceFeesToCSV,
  exportFinancialSummaryToCSV,
  exportVendorPayoutsToCSV,
  prisma,
} from '@packages/db'
import { requireRole } from '../middleware/rbac'
import { userHasStoreAccess } from '../middleware/storeAccess.js'
import { VendorErrors } from './vendor/vendorHelpers'

const DateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
})

const CommissionsExportSchema = DateRangeSchema.extend({
  affiliateId: z.string().uuid().optional(),
  status: z.enum(['PENDING', 'APPROVED', 'PAID', 'REVERSED']).optional(),
})

const PayoutsExportSchema = DateRangeSchema.extend({
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']).optional(),
})

const OrdersExportSchema = DateRangeSchema.extend({
  storeId: z.string().uuid().optional(),
  status: z.enum(['PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELED']).optional(),
})

const TaxSummarySchema = DateRangeSchema.extend({
  storeId: z.string().uuid().optional(),
})

export const exportRoutes = async (app: FastifyInstance) => {
  // GET /exports/commissions - Export affiliate commissions to CSV
  app.get('/exports/commissions', {
    preHandler: [requireRole(['ADMIN'])],
  }, async (req, reply) => {
    try {
      const query = CommissionsExportSchema.parse(req.query)

      const csv = await exportCommissionsToCSV({
        startDate: query.startDate ? new Date(query.startDate) : undefined,
        endDate: query.endDate ? new Date(query.endDate) : undefined,
        affiliateId: query.affiliateId,
        status: query.status,
      })

      const filename = `commissions_${new Date().toISOString().split('T')[0]}.csv`

      return reply
        .header('Content-Type', 'text/csv')
        .header('Content-Disposition', `attachment; filename="${filename}"`)
        .send(csv)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation error', details: error.errors })
      }
      throw error
    }
  })

  // GET /exports/payouts - Export affiliate payouts to CSV
  app.get('/exports/payouts', {
    preHandler: [requireRole(['ADMIN'])],
  }, async (req, reply) => {
    try {
      const query = PayoutsExportSchema.parse(req.query)

      const csv = await exportAccountingPayoutsToCSV({
        startDate: query.startDate ? new Date(query.startDate) : undefined,
        endDate: query.endDate ? new Date(query.endDate) : undefined,
        status: query.status,
      })

      const filename = `payouts_${new Date().toISOString().split('T')[0]}.csv`

      return reply
        .header('Content-Type', 'text/csv')
        .header('Content-Disposition', `attachment; filename="${filename}"`)
        .send(csv)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation error', details: error.errors })
      }
      throw error
    }
  })

  // GET /exports/orders - Export orders to CSV (small datasets)
  app.get('/exports/orders', {
    preHandler: [requireRole(['ADMIN', 'VENDOR', 'STAFF'])],
  }, async (req, reply) => {
    try {
      const query = OrdersExportSchema.parse(req.query)

      let storeId = query.storeId
      if (req.user!.role === 'VENDOR' || req.user!.role === 'STAFF') {
        if (!storeId) {
          return reply.code(400).send({ error: 'Vendors must specify storeId' })
        }
        const store = await prisma.store.findUnique({ where: { id: storeId }, select: { id: true } })
        if (!store) return reply.code(404).send({ error: 'Store not found' })
        if (!(await userHasStoreAccess(req.user!.id, req.user!.role, storeId, 'analytics'))) {
          return VendorErrors.forbidden(reply, 'You cannot access analytics for this store')
        }
      }

      const csv = await exportOrdersToCSV({
        startDate: query.startDate ? new Date(query.startDate) : undefined,
        endDate: query.endDate ? new Date(query.endDate) : undefined,
        storeId,
        status: query.status,
      })

      const filename = `orders_${new Date().toISOString().split('T')[0]}.csv`

      return reply
        .header('Content-Type', 'text/csv')
        .header('Content-Disposition', `attachment; filename="${filename}"`)
        .send(csv)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation error', details: error.errors })
      }
      throw error
    }
  })

  // GET /exports/orders/stream - Stream orders export for large datasets
  app.get('/exports/orders/stream', {
    preHandler: [requireRole(['ADMIN', 'VENDOR', 'STAFF'])],
  }, async (req, reply) => {
    try {
      const query = OrdersExportSchema.parse(req.query)

      let storeId = query.storeId
      if (req.user!.role === 'VENDOR' || req.user!.role === 'STAFF') {
        if (!storeId) {
          return reply.code(400).send({ error: 'Vendors must specify storeId' })
        }
        const store = await prisma.store.findUnique({ where: { id: storeId }, select: { id: true } })
        if (!store) return reply.code(404).send({ error: 'Store not found' })
        if (!(await userHasStoreAccess(req.user!.id, req.user!.role, storeId, 'analytics'))) {
          return VendorErrors.forbidden(reply, 'You cannot access analytics for this store')
        }
      }

      const filename = `orders_stream_${new Date().toISOString().split('T')[0]}.csv`

      // Set streaming headers
      reply.header('Content-Type', 'text/csv')
      reply.header('Content-Disposition', `attachment; filename="${filename}"`)
      reply.header('Transfer-Encoding', 'chunked')

      // Stream the CSV data
      const stream = streamOrdersToCSV({
        startDate: query.startDate ? new Date(query.startDate) : undefined,
        endDate: query.endDate ? new Date(query.endDate) : undefined,
        storeId,
        status: query.status,
      })

      for await (const chunk of stream) {
        reply.raw.write(chunk)
      }

      reply.raw.end()
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation error', details: error.errors })
      }
      throw error
    }
  })

  // GET /exports/tax-summary - Export tax summary to CSV
  app.get('/exports/tax-summary', {
    preHandler: [requireRole(['ADMIN', 'VENDOR', 'STAFF'])],
  }, async (req, reply) => {
    try {
      const query = TaxSummarySchema.parse(req.query)

      let storeId = query.storeId
      if (req.user!.role === 'VENDOR' || req.user!.role === 'STAFF') {
        if (!storeId) {
          return reply.code(400).send({ error: 'Vendors must specify storeId' })
        }
        const store = await prisma.store.findUnique({ where: { id: storeId }, select: { id: true } })
        if (!store) return reply.code(404).send({ error: 'Store not found' })
        if (!(await userHasStoreAccess(req.user!.id, req.user!.role, storeId, 'analytics'))) {
          return VendorErrors.forbidden(reply, 'You cannot access analytics for this store')
        }
      }

      const csv = await exportTaxSummaryToCSV({
        startDate: query.startDate ? new Date(query.startDate) : undefined,
        endDate: query.endDate ? new Date(query.endDate) : undefined,
        storeId,
      })

      const filename = `tax_summary_${new Date().toISOString().split('T')[0]}.csv`

      return reply
        .header('Content-Type', 'text/csv')
        .header('Content-Disposition', `attachment; filename="${filename}"`)
        .send(csv)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation error', details: error.errors })
      }
      throw error
    }
  })

  // GET /exports/service-fees - Export service fees to CSV
  app.get('/exports/service-fees', {
    preHandler: [requireRole(['ADMIN'])],
  }, async (req, reply) => {
    try {
      const query = DateRangeSchema.parse(req.query)

      const csv = await exportServiceFeesToCSV(
        query.startDate ? new Date(query.startDate) : undefined,
        query.endDate ? new Date(query.endDate) : undefined
      )

      const filename = `service_fees_${new Date().toISOString().split('T')[0]}.csv`

      return reply
        .header('Content-Type', 'text/csv')
        .header('Content-Disposition', `attachment; filename="${filename}"`)
        .send(csv)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation error', details: error.errors })
      }
      throw error
    }
  })

  // GET /exports/financial-summary - Export complete financial breakdown
  app.get('/exports/financial-summary', {
    preHandler: [requireRole(['ADMIN'])],
  }, async (req, reply) => {
    try {
      const query = DateRangeSchema.parse(req.query)

      const csv = await exportFinancialSummaryToCSV(
        query.startDate ? new Date(query.startDate) : undefined,
        query.endDate ? new Date(query.endDate) : undefined
      )

      const filename = `financial_summary_${new Date().toISOString().split('T')[0]}.csv`

      return reply
        .header('Content-Type', 'text/csv')
        .header('Content-Disposition', `attachment; filename="${filename}"`)
        .send(csv)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation error', details: error.errors })
      }
      throw error
    }
  })

  // GET /exports/vendor-payouts - Export vendor payout summary
  app.get('/exports/vendor-payouts', {
    preHandler: [requireRole(['ADMIN'])],
  }, async (req, reply) => {
    try {
      const query = DateRangeSchema.parse(req.query)

      const csv = await exportVendorPayoutsToCSV(
        query.startDate ? new Date(query.startDate) : undefined,
        query.endDate ? new Date(query.endDate) : undefined
      )

      const filename = `vendor_payouts_${new Date().toISOString().split('T')[0]}.csv`

      return reply
        .header('Content-Type', 'text/csv')
        .header('Content-Disposition', `attachment; filename="${filename}"`)
        .send(csv)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation error', details: error.errors })
      }
      throw error
    }
  })
}
