import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { 
  createVendorApplication, 
  getVendorApplicationByUserId,
  updateVendorApplication,
  listVendorApplications,
  approveVendorApplication,
  rejectVendorApplication
} from '@packages/db'
import { requireRole } from '../middleware/rbac'
import { VendorErrors } from './vendor/vendorHelpers'
import { prisma } from '@packages/db'
import type { Role } from '@packages/db/generated/client'

// Simplified MVP vendor application schema
const CreateVendorApplicationSchema = z.object({
  businessName: z.string().min(1, 'Business name is required'),
  contactName: z.string().min(1, 'Contact name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(1, 'Phone number is required'),
  businessType: z.enum(['INDIVIDUAL', 'LLC', 'CORPORATION', 'PARTNERSHIP']),
  description: z.string().min(10, 'Description must be at least 10 characters'),
})

const AdminReviewSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  rejectionReason: z.string().optional(),
})

export const vendorApplicationRoutes = async (app: FastifyInstance) => {
  // POST /vendor/apply - Create vendor application (authenticated users)
  app.post('/vendor/apply', {
    preHandler: [requireRole(['USER', 'VENDOR_PENDING'])],
  }, async (req, reply) => {
    try {
      const userId = req.user?.id
      if (!userId) {
        return VendorErrors.unauthorized(reply)
      }

      // Check if user already has an application
      const existing = await getVendorApplicationByUserId(userId)
      if (existing) {
        // Allow reapplication only if previous was REJECTED
        if (existing.status !== 'REJECTED') {
          return reply.code(400).send({ 
            error: 'Application already exists',
            status: existing.status 
          })
        }
      }

      const input = CreateVendorApplicationSchema.parse(req.body)
      const application = await createVendorApplication({
        ...input,
        userId,
      })

      // Update user role to VENDOR_PENDING
      await prisma.user.update({
        where: { id: userId },
        data: { role: 'VENDOR_PENDING' as Role }
      })

      return reply.code(201).send({ application })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation error', details: error.errors })
      }
      throw error
    }
  })

  // GET /vendor/application-status - Get current user's application status
  app.get('/vendor/application-status', {
    preHandler: [requireRole(['USER', 'VENDOR_PENDING', 'VENDOR'])],
  }, async (req, reply) => {
    try {
      const userId = req.user?.id
      if (!userId) {
        return VendorErrors.unauthorized(reply)
      }

      const application = await getVendorApplicationByUserId(userId)
      if (!application) {
        return reply.code(404).send({ error: 'No application found' })
      }

      return reply.code(200).send({ application })
    } catch (error) {
      throw error
    }
  })

  // Admin routes
  // GET /admin/vendor-applications - List all vendor applications
  app.get('/admin/vendor-applications', {
    preHandler: [requireRole(['ADMIN'])],
  }, async (req, reply) => {
    try {
      const query = req.query as { status?: string; limit?: string; offset?: string }
      const result = await listVendorApplications({
        status: query.status as 'PENDING' | 'APPROVED' | 'REJECTED' | undefined,
        limit: query.limit ? parseInt(query.limit) : undefined,
        offset: query.offset ? parseInt(query.offset) : undefined,
      })

      return reply.code(200).send(result)
    } catch (error) {
      throw error
    }
  })

  // POST /admin/vendor-applications/:id/approve - Approve vendor application
  app.post('/admin/vendor-applications/:id/approve', {
    preHandler: [requireRole(['ADMIN'])],
  }, async (req, reply) => {
    try {
      const params = req.params as { id: string }
      
      const approved = await approveVendorApplication(params.id)
      if (!approved) {
        return reply.code(404).send({ error: 'Application not found' })
      }

      return reply.code(200).send({ application: approved })
    } catch (error) {
      throw error
    }
  })

  // POST /admin/vendor-applications/:id/reject - Reject vendor application
  app.post('/admin/vendor-applications/:id/reject', {
    preHandler: [requireRole(['ADMIN'])],
  }, async (req, reply) => {
    try {
      const params = req.params as { id: string }
      const input = AdminReviewSchema.parse(req.body)
      
      const rejected = await rejectVendorApplication(params.id, {
        rejectionReason: input.rejectionReason,
      })
      
      if (!rejected) {
        return reply.code(404).send({ error: 'Application not found' })
      }

      return reply.code(200).send({ application: rejected })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation error', details: error.errors })
      }
      throw error
    }
  })
}
