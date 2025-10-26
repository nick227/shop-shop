import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import {
  createVerification,
  getVerificationByUserId,
  getVerification,
  updateVerification,
  submitVerification,
  reviewVerification,
  listVerifications,
  getVerificationStats,
  isVendorVerified,
} from '@packages/db'
import { requireRole } from '../middleware/rbac'

const CreateVerificationSchema = z.object({
  businessName: z.string().min(1),
  businessType: z.enum(['INDIVIDUAL', 'LLC', 'CORPORATION', 'PARTNERSHIP']),
  taxId: z.string().min(1),
  documentsJson: z.unknown().optional(),
})

const UpdateVerificationSchema = z.object({
  businessName: z.string().min(1).optional(),
  businessType: z.enum(['INDIVIDUAL', 'LLC', 'CORPORATION', 'PARTNERSHIP']).optional(),
  taxId: z.string().min(1).optional(),
  documentsJson: z.unknown().optional(),
})

const ReviewVerificationSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  reviewNotes: z.string().optional(),
  rejectionReason: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
  stripeAccountId: z.string().optional(),
})

export const vendorVerificationRoutes = async (app: FastifyInstance) => {
  // POST /vendor-verification - Create verification request
  app.post('/vendor-verification', {
    preHandler: [requireRole(['VENDOR'])],
  }, async (req, reply) => {
    try {
      const userId = req.user?.id
      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' })
      }

      const existing = await getVerificationByUserId(userId)
      if (existing) {
        return reply.code(400).send({ error: 'Verification already exists' })
      }

      const input = CreateVerificationSchema.parse(req.body)
      const verification = await createVerification({ ...input, userId })

      return reply.code(201).send({ verification })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation error', details: error.errors })
      }
      throw error
    }
  })

  // GET /vendor-verification/me - Get current user's verification
  app.get('/vendor-verification/me', {
    preHandler: [requireRole(['VENDOR'])],
  }, async (req, reply) => {
    try {
      const userId = req.user?.id
      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' })
      }

      const verification = await getVerificationByUserId(userId)
      if (!verification) {
        return reply.code(404).send({ error: 'Verification not found' })
      }

      return reply.code(200).send({ verification })
    } catch (error) {
      throw error
    }
  })

  // GET /vendor-verification/me/status - Check if vendor is verified
  app.get('/vendor-verification/me/status', {
    preHandler: [requireRole(['VENDOR'])],
  }, async (req, reply) => {
    try {
      const userId = req.user?.id
      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' })
      }

      const verified = await isVendorVerified(userId)
      return reply.code(200).send({ verified })
    } catch (error) {
      throw error
    }
  })

  // PATCH /vendor-verification/me - Update verification request
  app.patch('/vendor-verification/me', {
    preHandler: [requireRole(['VENDOR'])],
  }, async (req, reply) => {
    try {
      const userId = req.user?.id
      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' })
      }

      const verification = await getVerificationByUserId(userId)
      if (!verification) {
        return reply.code(404).send({ error: 'Verification not found' })
      }

      if (verification.status !== 'PENDING') {
        return reply.code(400).send({ 
          error: 'Can only update pending verifications' 
        })
      }

      const input = UpdateVerificationSchema.parse(req.body)
      const updated = await updateVerification(verification.id, input)

      return reply.code(200).send({ verification: updated })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation error', details: error.errors })
      }
      throw error
    }
  })

  // POST /vendor-verification/me/submit - Submit verification for review
  app.post('/vendor-verification/me/submit', {
    preHandler: [requireRole(['VENDOR'])],
  }, async (req, reply) => {
    try {
      const userId = req.user?.id
      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' })
      }

      const verification = await getVerificationByUserId(userId)
      if (!verification) {
        return reply.code(404).send({ error: 'Verification not found' })
      }

      if (verification.status !== 'PENDING') {
        return reply.code(400).send({ 
          error: 'Verification has already been submitted' 
        })
      }

      const updated = await submitVerification(verification.id)
      return reply.code(200).send({ verification: updated })
    } catch (error) {
      throw error
    }
  })

  // Admin routes
  // GET /vendor-verification - List all verifications
  app.get('/vendor-verification', {
    preHandler: [requireRole(['ADMIN'])],
  }, async (req, reply) => {
    try {
      const query = req.query as { status?: string; limit?: string; offset?: string }
      const result = await listVerifications({
        status: query.status as 'PENDING' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | undefined,
        limit: query.limit ? parseInt(query.limit) : undefined,
        offset: query.offset ? parseInt(query.offset) : undefined,
      })

      return reply.code(200).send(result)
    } catch (error) {
      throw error
    }
  })

  // GET /vendor-verification/stats - Get verification statistics
  app.get('/vendor-verification/stats', {
    preHandler: [requireRole(['ADMIN'])],
  }, async (req, reply) => {
    try {
      const stats = await getVerificationStats()
      return reply.code(200).send({ stats })
    } catch (error) {
      throw error
    }
  })

  // GET /vendor-verification/:id - Get specific verification
  app.get('/vendor-verification/:id', {
    preHandler: [requireRole(['ADMIN'])],
  }, async (req, reply) => {
    try {
      const params = req.params as { id: string }
      const verification = await getVerification(params.id)

      if (!verification) {
        return reply.code(404).send({ error: 'Verification not found' })
      }

      return reply.code(200).send({ verification })
    } catch (error) {
      throw error
    }
  })

  // POST /vendor-verification/:id/review - Review verification request
  app.post('/vendor-verification/:id/review', {
    preHandler: [requireRole(['ADMIN'])],
  }, async (req, reply) => {
    try {
      const params = req.params as { id: string }
      const input = ReviewVerificationSchema.parse(req.body)

      const verification = await getVerification(params.id)
      if (!verification) {
        return reply.code(404).send({ error: 'Verification not found' })
      }

      if (verification.status !== 'SUBMITTED' && verification.status !== 'UNDER_REVIEW') {
        return reply.code(400).send({ 
          error: 'Can only review submitted verifications' 
        })
      }

      const updated = await reviewVerification(params.id, {
        status: input.status,
        reviewNotes: input.reviewNotes,
        rejectionReason: input.rejectionReason,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
        stripeAccountId: input.stripeAccountId,
      })

      return reply.code(200).send({ verification: updated })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation error', details: error.errors })
      }
      throw error
    }
  })
}

