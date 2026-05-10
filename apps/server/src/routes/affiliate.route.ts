import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import {
  createAffiliate,
  getAffiliateByUserId,
  getAffiliateBySlugOrCode,
  updateAffiliate,
  updateAffiliateStatus,
  getAffiliateStats,
  getCommissionsByAffiliate,
  getAffiliatePayouts,
  listAffiliates,
  processPayout,
  updatePayoutStatus,
  checkPayoutEligibility,
  createPayoutWithReview,
  approvePayout,
  markPayoutAsPaid,
  reversePayout,
  getPayoutAuditLogs,
  exportPayoutsToCSV,
  prisma,
} from '@packages/db'
import { requireRole } from '../middleware/rbac'
import { VendorErrors } from './vendor/vendorHelpers'

async function requireActiveAffiliate(req: any, reply: any) {
  const userId = req.user?.id as string | undefined
  if (!userId) return VendorErrors.unauthorized(reply)

  const affiliate = await getAffiliateByUserId(userId)
  if (!affiliate) return reply.code(404).send({ error: 'Affiliate profile not found' })
  if (affiliate.status !== 'ACTIVE') {
    return reply.code(403).send({ error: 'Affiliate is not active', status: affiliate.status })
  }
}

const CreateAffiliateSchema = z.object({
  bio: z.string().optional(),
  website: z.string().url().optional(),
  paypalEmail: z.string().email().optional(),
  taxId: z.string().optional(),
})

const BankAccountSchema = z.object({
  accountNumber: z.string().min(1),
  routingNumber: z.string().min(1),
  accountType: z.enum(['CHECKING', 'SAVINGS']),
  bankName: z.string().min(1),
  accountHolderName: z.string().min(1),
}).optional()

const UpdateAffiliateSchema = z.object({
  bio: z.string().optional(),
  website: z.string().url().optional(),
  paypalEmail: z.string().email().optional(),
  taxId: z.string().optional(),
  bankAccountJson: BankAccountSchema,
})

const ProcessPayoutSchema = z.object({
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  method: z.enum(['PAYPAL', 'BANK_TRANSFER', 'CHECK', 'STRIPE_TRANSFER']),
})

const UpdatePayoutStatusSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']),
  referenceId: z.string().optional(),
  failureReason: z.string().optional(),
})

const CreatePayoutWithReviewSchema = z.object({
  affiliateId: z.string(),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  method: z.enum(['PAYPAL', 'BANK_TRANSFER', 'CHECK', 'STRIPE_TRANSFER']),
  reviewNotes: z.string().optional(),
  autoApprove: z.boolean().optional(),
})

const ApprovePayoutSchema = z.object({
  notes: z.string().optional(),
})

const MarkPayoutPaidSchema = z.object({
  paymentReference: z.string().optional(),
})

const ReversePayoutSchema = z.object({
  reason: z.string().min(1, 'Reason is required'),
})

export const affiliateRoutes = async (app: FastifyInstance) => {
  // GET /affiliates/application - Get current user's affiliate application/status (any authed user)
  app.get('/affiliates/application', {
    preHandler: [requireRole(['USER', 'VENDOR', 'AFFILIATE', 'ADMIN'])],
  }, async (req, reply) => {
    const userId = req.user?.id
    if (!userId) return VendorErrors.unauthorized(reply)

    const affiliate = await getAffiliateByUserId(userId)
    return reply.code(200).send({
      affiliate: affiliate ? { id: affiliate.id, status: affiliate.status } : null,
    })
  })

  // POST /affiliates/signup - Create affiliate account
  app.post('/affiliates/signup', {
    preHandler: [requireRole(['USER', 'VENDOR'])],
  }, async (req, reply) => {
    try {
      const userId = req.user?.id
      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' })
      }

      const existing = await getAffiliateByUserId(userId)
      if (existing) {
        return reply.code(400).send({ error: 'User is already an affiliate' })
      }

      const input = CreateAffiliateSchema.parse(req.body)
      const affiliate = await createAffiliate({ 
        bio: input.bio,
        website: input.website,
        paypalEmail: input.paypalEmail,
        taxId: input.taxId,
        userId 
      })

      return reply.code(201).send({ affiliate })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation error', details: error.errors })
      }
      throw error
    }
  })

  // GET /affiliates/me - Get current user's affiliate profile
  app.get('/affiliates/me', {
    preHandler: [requireRole(['USER', 'VENDOR', 'AFFILIATE', 'ADMIN']), requireActiveAffiliate],
  }, async (req, reply) => {
    try {
      const userId = req.user?.id
      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' })
      }

      const affiliate = await getAffiliateByUserId(userId)
      if (!affiliate) {
        return reply.code(404).send({ error: 'Affiliate profile not found' })
      }

      return reply.code(200).send({ affiliate })
    } catch (error) {
      throw error
    }
  })

  // GET /affiliates/me/stats - Get affiliate statistics
  app.get('/affiliates/me/stats', {
    preHandler: [requireRole(['USER', 'VENDOR', 'AFFILIATE', 'ADMIN']), requireActiveAffiliate],
  }, async (req, reply) => {
    try {
      const userId = req.user?.id
      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' })
      }

      const affiliate = await getAffiliateByUserId(userId)
      if (!affiliate) {
        return reply.code(404).send({ error: 'Affiliate profile not found' })
      }

      const stats = await getAffiliateStats(affiliate.id)
      return reply.code(200).send(stats)
    } catch (error) {
      throw error
    }
  })

  // PATCH /affiliates/me - Update affiliate profile
  app.patch('/affiliates/me', {
    preHandler: [requireRole(['USER', 'VENDOR', 'AFFILIATE', 'ADMIN']), requireActiveAffiliate],
  }, async (req, reply) => {
    try {
      const userId = req.user?.id
      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' })
      }

      const affiliate = await getAffiliateByUserId(userId)
      if (!affiliate) {
        return reply.code(404).send({ error: 'Affiliate profile not found' })
      }

      const input = UpdateAffiliateSchema.parse(req.body)
      const updated = await updateAffiliate(affiliate.id, {
        bio: input.bio,
        website: input.website,
        paypalEmail: input.paypalEmail,
        taxId: input.taxId,
        bankAccountJson: input.bankAccountJson,
      })

      return reply.code(200).send({ affiliate: updated })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation error', details: error.errors })
      }
      throw error
    }
  })

  // GET /affiliates/me/commissions - Get affiliate commissions
  app.get('/affiliates/me/commissions', {
    preHandler: [requireRole(['USER', 'VENDOR', 'AFFILIATE', 'ADMIN']), requireActiveAffiliate],
  }, async (req, reply) => {
    try {
      const userId = req.user?.id
      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' })
      }

      const affiliate = await getAffiliateByUserId(userId)
      if (!affiliate) {
        return reply.code(404).send({ error: 'Affiliate profile not found' })
      }

      const query = req.query as { status?: string; limit?: string; offset?: string }
      const result = await getCommissionsByAffiliate(affiliate.id, {
        status: query.status as 'PENDING' | 'APPROVED' | 'PAID' | 'REVERSED' | undefined,
        limit: query.limit ? parseInt(query.limit) : undefined,
        offset: query.offset ? parseInt(query.offset) : undefined,
      })

      return reply.code(200).send(result)
    } catch (error) {
      throw error
    }
  })

  // GET /affiliates/me/payouts - Get affiliate payouts
  app.get('/affiliates/me/payouts', {
    preHandler: [requireRole(['USER', 'VENDOR', 'AFFILIATE', 'ADMIN']), requireActiveAffiliate],
  }, async (req, reply) => {
    try {
      const userId = req.user?.id
      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' })
      }

      const affiliate = await getAffiliateByUserId(userId)
      if (!affiliate) {
        return reply.code(404).send({ error: 'Affiliate profile not found' })
      }

      const query = req.query as { status?: string; limit?: string; offset?: string }
      const result = await getAffiliatePayouts(affiliate.id, {
        status: query.status as 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | undefined,
        limit: query.limit ? parseInt(query.limit) : undefined,
        offset: query.offset ? parseInt(query.offset) : undefined,
      })

      return reply.code(200).send(result)
    } catch (error) {
      throw error
    }
  })

  // GET /affiliates/:id - Get full affiliate detail by ID (admin only)
  app.get('/affiliates/:id', {
    preHandler: [requireRole(['ADMIN'])],
  }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const affiliate = await prisma.affiliate.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        _count: { select: { commissions: true, payouts: true, referredStores: true } },
      },
    })
    if (!affiliate) return reply.code(404).send({ error: 'Affiliate not found' })
    return reply.send({ affiliate })
  })

  // GET /affiliates/:id/commissions - Get commissions for any affiliate (admin only)
  app.get('/affiliates/:id/commissions', {
    preHandler: [requireRole(['ADMIN'])],
  }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const query = req.query as { status?: string; limit?: string; offset?: string }
    const result = await getCommissionsByAffiliate(id, {
      status: query.status as 'PENDING' | 'APPROVED' | 'PAID' | 'REVERSED' | undefined,
      limit: query.limit ? parseInt(query.limit) : undefined,
      offset: query.offset ? parseInt(query.offset) : undefined,
    })
    return reply.code(200).send(result)
  })

  // GET /affiliates/:id/payouts - Get payouts for any affiliate (admin only)
  app.get('/affiliates/:id/payouts', {
    preHandler: [requireRole(['ADMIN'])],
  }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const query = req.query as { status?: string; limit?: string; offset?: string }
    const result = await getAffiliatePayouts(id, {
      status: query.status as 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | undefined,
      limit: query.limit ? parseInt(query.limit) : undefined,
      offset: query.offset ? parseInt(query.offset) : undefined,
    })
    return reply.code(200).send(result)
  })

  // GET /affiliates/referral/:slugOrCode - Public resolver for /r/:slugOrCode landing.
  // Resolves referralSlug first, then referralCode. Always returns the canonical
  // referralCode so the frontend can persist it consistently regardless of which
  // form the URL used.
  app.get('/affiliates/referral/:slugOrCode', async (req, reply) => {
    const params = req.params as { slugOrCode: string }
    const affiliate = await getAffiliateBySlugOrCode(params.slugOrCode)

    if (!affiliate || affiliate.status !== 'ACTIVE') {
      return reply.code(404).send({ error: 'Referral link not found or inactive' })
    }

    return reply.code(200).send({
      affiliateId: affiliate.id,
      referralCode: affiliate.referralCode,
      referralSlug: affiliate.referralSlug ?? null,
    })
  })

  // Admin routes
  // GET /affiliates - List all affiliates
  app.get('/affiliates', {
    preHandler: [requireRole(['ADMIN'])],
  }, async (req, reply) => {
    try {
      const query = req.query as { status?: string; limit?: string; offset?: string }
      const result = await listAffiliates({
        status: query.status as 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'TERMINATED' | undefined,
        limit: query.limit ? parseInt(query.limit) : undefined,
        offset: query.offset ? parseInt(query.offset) : undefined,
      })

      return reply.code(200).send(result)
    } catch (error) {
      throw error
    }
  })

  // PATCH /affiliates/:id/status - Update affiliate status
  app.patch('/affiliates/:id/status', {
    preHandler: [requireRole(['ADMIN'])],
  }, async (req, reply) => {
    try {
      const params = req.params as { id: string }
      const body = req.body as { status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'TERMINATED' }

      const affiliate = await updateAffiliateStatus(params.id, body.status)
      return reply.code(200).send({ affiliate })
    } catch (error) {
      throw error
    }
  })

  // POST /affiliates/:id/payout - Process payout for affiliate
  app.post('/affiliates/:id/payout', {
    preHandler: [requireRole(['ADMIN'])],
  }, async (req, reply) => {
    try {
      const params = req.params as { id: string }
      const input = ProcessPayoutSchema.parse(req.body)

      const payout = await processPayout({
        affiliateId: params.id,
        periodStart: new Date(input.periodStart),
        periodEnd: new Date(input.periodEnd),
        method: input.method,
        adminUserId: req.user!.id,
      })

      return reply.code(201).send({ payout })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation error', details: error.errors })
      }
      throw error
    }
  })

  // PATCH /payouts/:id/status - Update payout status
  app.patch('/payouts/:id/status', {
    preHandler: [requireRole(['ADMIN'])],
  }, async (req, reply) => {
    try {
      const params = req.params as { id: string }
      const input = UpdatePayoutStatusSchema.parse(req.body)

      const payout = await updatePayoutStatus(
        params.id,
        input.status,
        input.referenceId,
        input.failureReason,
        req.user!.id,
      )

      return reply.code(200).send({ payout })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation error', details: error.errors })
      }
      throw error
    }
  })

  // GET /payouts/eligibility/:affiliateId - Check payout eligibility
  app.get('/payouts/eligibility/:affiliateId', {
    preHandler: [requireRole(['ADMIN'])],
  }, async (req, reply) => {
    try {
      const params = req.params as { affiliateId: string }
      const eligibility = await checkPayoutEligibility(params.affiliateId)
      return reply.code(200).send({ eligibility })
    } catch (error) {
      throw error
    }
  })

  // POST /payouts/create-with-review - Create payout with admin review
  app.post('/payouts/create-with-review', {
    preHandler: [requireRole(['ADMIN'])],
  }, async (req, reply) => {
    try {
      const input = CreatePayoutWithReviewSchema.parse(req.body)
      const payoutId = await createPayoutWithReview(
        input,
        req.user!.id,
      )
      return reply.code(201).send({ payoutId })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation error', details: error.errors })
      }
      throw error
    }
  })

  // POST /payouts/:id/approve - Admin approval of pending payout
  app.post('/payouts/:id/approve', {
    preHandler: [requireRole(['ADMIN'])],
  }, async (req, reply) => {
    try {
      const params = req.params as { id: string }
      const input = ApprovePayoutSchema.parse(req.body)
      await approvePayout(params.id, req.user!.id, input.notes)
      return reply.code(200).send({ success: true })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation error', details: error.errors })
      }
      throw error
    }
  })

  // POST /payouts/:id/mark-paid - Mark payout as paid
  app.post('/payouts/:id/mark-paid', {
    preHandler: [requireRole(['ADMIN'])],
  }, async (req, reply) => {
    try {
      const params = req.params as { id: string }
      const input = MarkPayoutPaidSchema.parse(req.body)
      await markPayoutAsPaid(params.id, req.user!.id, input.paymentReference)
      return reply.code(200).send({ success: true })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation error', details: error.errors })
      }
      throw error
    }
  })

  // POST /payouts/:id/reverse - Reverse a payout
  app.post('/payouts/:id/reverse', {
    preHandler: [requireRole(['ADMIN'])],
  }, async (req, reply) => {
    try {
      const params = req.params as { id: string }
      const input = ReversePayoutSchema.parse(req.body)
      await reversePayout(params.id, req.user!.id, input.reason)
      return reply.code(200).send({ success: true })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation error', details: error.errors })
      }
      throw error
    }
  })

  // GET /payouts/audit-logs - Get payout audit logs
  app.get('/payouts/audit-logs', {
    preHandler: [requireRole(['ADMIN'])],
  }, async (req, reply) => {
    try {
      const query = req.query as { affiliateId?: string; limit?: string }
      const limit = query.limit ? parseInt(query.limit) : 50
      const auditLogs = await getPayoutAuditLogs(query.affiliateId, limit)
      return reply.code(200).send({ auditLogs })
    } catch (error) {
      throw error
    }
  })

  // GET /payouts/export - Export payouts to CSV
  app.get('/payouts/export', {
    preHandler: [requireRole(['ADMIN'])],
  }, async (req, reply) => {
    try {
      const query = req.query as { 
        affiliateId?: string; 
        startDate?: string; 
        endDate?: string 
      }
      
      const dateRange = query.startDate && query.endDate ? {
        start: new Date(query.startDate),
        end: new Date(query.endDate),
      } : undefined

      const csvContent = await exportPayoutsToCSV(query.affiliateId, dateRange)
      
      reply.header('Content-Type', 'text/csv')
      reply.header('Content-Disposition', 'attachment; filename="payouts-export.csv"')
      return reply.code(200).send(csvContent)
    } catch (error) {
      throw error
    }
  })
}

