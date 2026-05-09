import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import {
  createInvitation,
  getInvitationByToken,
  acceptInvitation,
  declineInvitation,
  revokeInvitation,
  getStoreTeamMembers,
  getUserStoreAccess,
  updateTeamMember,
  removeTeamMember,
  getStorePendingInvitations,
  getStoreDeliveryDrivers,
  getUserInvitations,
  hasStorePermission,
  prisma,
} from '@packages/db'
import { requireRole } from '../middleware/rbac'
import { userHasStoreAccess } from '../middleware/storeAccess'

const PermissionSchema = z.enum([
  'VIEW_ORDERS',
  'MANAGE_ORDERS',
  'VIEW_ITEMS',
  'MANAGE_ITEMS',
  'VIEW_DELIVERIES',
  'MANAGE_DELIVERIES',
  'ASSIGN_DELIVERIES',
  'VIEW_ANALYTICS',
  'VIEW_FINANCE',
  'MANAGE_STORE_SETTINGS',
  'FULL_ACCESS',
])

const CreateInvitationSchema = z.object({
  storeId: z.string().uuid(),
  recipientEmail: z.string().email(),
  permissions: z.array(PermissionSchema).min(1),
  message: z.string().optional(),
  expiryDays: z.number().int().positive().optional(),
})

const AcceptInvitationSchema = z.object({
  token: z.string(),
})

const UpdateTeamMemberSchema = z.object({
  permissions: z.array(PermissionSchema).min(1).optional(),
  isActive: z.boolean().optional(),
})

export const teamRoutes = async (app: FastifyInstance) => {
  async function canManageTeam(userId: string, userRole: string, storeId: string) {
    return userHasStoreAccess(userId, userRole, storeId, 'team')
  }

  async function canAssignDeliveries(userId: string, userRole: string, storeId: string) {
    return userHasStoreAccess(userId, userRole, storeId, 'dispatch')
  }

  // POST /team/invitations - Send team invitation
  app.post('/team/invitations', {
    preHandler: [requireRole(['USER', 'VENDOR', 'ADMIN', 'STAFF'])],
  }, async (req, reply) => {
    try {
      const userId = req.user?.id
      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' })
      }

      const input = CreateInvitationSchema.parse(req.body)
      if (!(await canManageTeam(userId, req.user!.role, input.storeId))) {
        return reply.code(403).send({ error: 'You cannot manage access for this store' })
      }

      const invitation = await createInvitation({
        ...input,
        senderUserId: userId,
        actorRole: req.user!.role,
      })

      // TODO: Send email notification to recipient

      return reply.code(201).send({ invitation })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation error', details: error.errors })
      }
      if (error instanceof Error) {
        if (
          error.message.includes('not found') ||
          error.message.includes('owner') ||
          error.message.includes('already')
        ) {
          return reply.code(400).send({ error: error.message })
        }
      }
      throw error
    }
  })

  // GET /team/invitations/token/:token - Get invitation details (public)
  app.get('/team/invitations/token/:token', async (req, reply) => {
    try {
      const params = req.params as { token: string }
      const invitation = await getInvitationByToken(params.token)

      if (!invitation) {
        return reply.code(404).send({ error: 'Invitation not found' })
      }

      if (invitation.expiresAt < new Date()) {
        return reply.code(400).send({ error: 'Invitation has expired' })
      }

      if (invitation.status !== 'PENDING') {
        return reply.code(400).send({ error: 'Invitation is no longer valid' })
      }

      return reply.code(200).send({ invitation })
    } catch (error) {
      throw error
    }
  })

  // POST /team/invitations/accept - Accept invitation
  app.post('/team/invitations/accept', {
    preHandler: [requireRole(['USER', 'STAFF'])],
  }, async (req, reply) => {
    try {
      const userId = req.user?.id
      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' })
      }

      const input = AcceptInvitationSchema.parse(req.body)

      const teamMember = await acceptInvitation({
        token: input.token,
        userId,
      })

      return reply.code(200).send({ teamMember })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation error', details: error.errors })
      }
      if (error instanceof Error) {
        if (
          error.message.includes('not found') ||
          error.message.includes('expired') ||
          error.message.includes('mismatch') ||
          error.message.includes('already')
        ) {
          return reply.code(400).send({ error: error.message })
        }
      }
      throw error
    }
  })

  // POST /team/invitations/:id/decline - Decline invitation
  app.post('/team/invitations/:id/decline', async (req, reply) => {
    try {
      const params = req.params as { id: string }

      const invitation = await declineInvitation(params.id)

      return reply.code(200).send({ invitation })
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found') || error.message.includes('valid')) {
          return reply.code(400).send({ error: error.message })
        }
      }
      throw error
    }
  })

  // DELETE /team/invitations/:id - Revoke invitation
  app.delete('/team/invitations/:id', {
    preHandler: [requireRole(['USER', 'VENDOR', 'ADMIN', 'STAFF'])],
  }, async (req, reply) => {
    try {
      const userId = req.user?.id
      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' })
      }

      const params = req.params as { id: string }

      await revokeInvitation(params.id, userId, req.user!.role)

      return reply.code(204).send()
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found') || error.message.includes('owner') || error.message.includes('only')) {
          return reply.code(400).send({ error: error.message })
        }
      }
      throw error
    }
  })

  // GET /team/stores/:storeId/members - Get store team members
  app.get('/team/stores/:storeId/members', {
    preHandler: [requireRole(['USER', 'VENDOR', 'ADMIN', 'STAFF'])],
  }, async (req, reply) => {
    try {
      const params = req.params as { storeId: string }
      if (!req.user || !(await canManageTeam(req.user.id, req.user.role, params.storeId))) {
        return reply.code(403).send({ error: 'You cannot manage access for this store' })
      }

      const members = await getStoreTeamMembers(params.storeId)

      return reply.code(200).send({ members })
    } catch (error) {
      throw error
    }
  })

  // GET /team/stores/:storeId/invitations - Get pending invitations for store
  app.get('/team/stores/:storeId/invitations', {
    preHandler: [requireRole(['USER', 'VENDOR', 'ADMIN', 'STAFF'])],
  }, async (req, reply) => {
    try {
      const params = req.params as { storeId: string }
      if (!req.user || !(await canManageTeam(req.user.id, req.user.role, params.storeId))) {
        return reply.code(403).send({ error: 'You cannot manage access for this store' })
      }

      const invitations = await getStorePendingInvitations(params.storeId)

      return reply.code(200).send({ invitations })
    } catch (error) {
      throw error
    }
  })

  // GET /team/stores/:storeId/drivers - Get active delivery assignment targets
  app.get('/team/stores/:storeId/drivers', {
    preHandler: [requireRole(['USER', 'VENDOR', 'ADMIN', 'STAFF'])],
  }, async (req, reply) => {
    try {
      const params = req.params as { storeId: string }
      if (!req.user || !(await canAssignDeliveries(req.user.id, req.user.role, params.storeId))) {
        return reply.code(403).send({ error: 'You cannot assign deliveries for this store' })
      }

      const drivers = await getStoreDeliveryDrivers(params.storeId)

      return reply.code(200).send({ drivers })
    } catch (error) {
      throw error
    }
  })

  // GET /team/me/stores - Owned stores + stores where user is an active team member (admin: all stores)
  app.get('/team/me/stores', {
    preHandler: [requireRole(['USER', 'STAFF', 'VENDOR', 'ADMIN'])],
  }, async (req, reply) => {
    try {
      const userId = req.user?.id
      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' })
      }

      if (req.user!.role === 'ADMIN') {
        const allStores = await prisma.store.findMany({
          select: { id: true, name: true, slug: true, isPublished: true },
          orderBy: { name: 'asc' },
          take: 500,
        })
        const stores = allStores.map((store) => ({
          storeId: store.id,
          store,
          permissions: ['FULL_ACCESS'] as const,
          addedAt: new Date(),
        }))
        return reply.code(200).send({ stores })
      }

      const stores = await getUserStoreAccess(userId)

      return reply.code(200).send({ stores })
    } catch (error) {
      throw error
    }
  })

  // GET /team/me/invitations - Get invitations for current user
  app.get('/team/me/invitations', {
    preHandler: [requireRole(['USER', 'STAFF'])],
  }, async (req, reply) => {
    try {
      const email = req.user?.email
      if (!email) {
        return reply.code(401).send({ error: 'Unauthorized' })
      }

      const invitations = await getUserInvitations(email)

      return reply.code(200).send({ invitations })
    } catch (error) {
      throw error
    }
  })

  // PATCH /team/members/:id - Update team member
  app.patch('/team/members/:id', {
    preHandler: [requireRole(['USER', 'VENDOR', 'ADMIN', 'STAFF'])],
  }, async (req, reply) => {
    try {
      const userId = req.user?.id
      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' })
      }

      const params = req.params as { id: string }
      const input = UpdateTeamMemberSchema.parse(req.body)

      const member = await updateTeamMember(params.id, userId, {
        ...input,
        actorRole: req.user!.role,
      })

      return reply.code(200).send({ member })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation error', details: error.errors })
      }
      if (error instanceof Error) {
        if (error.message.includes('not found') || error.message.includes('owner')) {
          return reply.code(400).send({ error: error.message })
        }
      }
      throw error
    }
  })

  // DELETE /team/members/:id - Remove team member
  app.delete('/team/members/:id', {
    preHandler: [requireRole(['USER', 'VENDOR', 'ADMIN', 'STAFF'])],
  }, async (req, reply) => {
    try {
      const userId = req.user?.id
      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' })
      }

      const params = req.params as { id: string }

      await removeTeamMember(params.id, userId, req.user!.role)

      return reply.code(204).send()
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found') || error.message.includes('owner')) {
          return reply.code(400).send({ error: error.message })
        }
      }
      throw error
    }
  })
}
