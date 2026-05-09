import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import {
  createAffiliate,
  getAffiliateByUserId,
  getAffiliateByReferralCode,
  updateAffiliate,
  updateAffiliateStatus,
  getAffiliateStats,
  getCommissionsByAffiliate,
  getAffiliatePayouts,
  listAffiliates,
  processPayout,
  updatePayoutStatus,
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

  // GET /affiliates/referral/:code - Get affiliate by referral code (public)
  app.get('/affiliates/referral/:code', async (req, reply) => {
    try {
      const params = req.params as { code: string }
      const affiliate = await getAffiliateByReferralCode(params.code)

      if (!affiliate) {
        return reply.code(404).send({ error: 'Referral code not found' })
      }

      if (affiliate.status !== 'ACTIVE') {
        return reply.code(404).send({ error: 'Referral code inactive' })
      }

      return reply.code(200).send({
        referralCode: affiliate.referralCode,
        affiliateId: affiliate.id,
      })
    } catch (error) {
      throw error
    }
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
        input.failureReason
      )

      return reply.code(200).send({ payout })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation error', details: error.errors })
      }
      throw error
    }
  })
}

