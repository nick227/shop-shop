import { notifyAccountAccessChanged } from '../services/realtime.broker.js'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { enrollVendor, getAccountCapabilities, prisma } from '@packages/db'
import { requireAuth, requireAdmin } from '../middleware/rbac.js'

export async function accountAccessRoutes(app: FastifyInstance) {
  // General account payload: the shopper never needs to probe merchant APIs.
  app.get('/auth/v1/capabilities', { preHandler: [requireAuth] }, async (req) =>
    getAccountCapabilities(req.user!.id))

  app.post('/account/vendor-enrollment', { preHandler: [requireAuth] }, async (req, reply) => {
    try {
      await enrollVendor(req.user!.id)
      notifyAccountAccessChanged(req.user!.id)
      return getAccountCapabilities(req.user!.id)
    } catch (error) {
      if (error instanceof Error && error.message === 'Vendor access is revoked') {
        return reply.code(403).send({ error: error.message })
      }
      throw error
    }
  })

  const UpdateAccess = z.object({
    enrollmentStatus: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED']).optional(),
    workspaceRevoked: z.boolean().optional(),
    adminVendorWorkspace: z.boolean().optional(),
    adminCreateStores: z.boolean().optional(),
  }).strict()

  app.patch('/admin/users/:id/vendor-access', { preHandler: [requireAdmin()] }, async (req, reply) => {
    const input = UpdateAccess.safeParse(req.body)
    if (!input.success) return reply.code(400).send({ error: 'Invalid access change' })
    const { id } = req.params as { id: string }
    const user = await prisma.user.findUnique({ where: { id }, select: { role: true } })
    if (!user) return reply.code(404).send({ error: 'User not found' })
    const { enrollmentStatus, workspaceRevoked, ...grants } = input.data
    if ((grants.adminVendorWorkspace || grants.adminCreateStores) && user.role !== 'ADMIN') {
      return reply.code(400).send({ error: 'Administrative grants require a platform administrator' })
    }
    await prisma.$transaction(async (tx) => {
      // Suspending enrollment also revokes workspace access, without changing ownership or membership.
      const revoke = enrollmentStatus === 'SUSPENDED' ? true : workspaceRevoked
      await tx.user.update({ where: { id }, data: {
        ...grants, ...(revoke !== undefined ? { vendorAccessRevokedAt: revoke ? new Date() : null } : {}),
      } })
      if (enrollmentStatus) await tx.vendorEnrollment.upsert({
        where: { userId: id },
        create: { userId: id, status: enrollmentStatus, source: 'ADMIN', reviewedAt: new Date(), reviewedByUserId: req.user!.id },
        update: { status: enrollmentStatus, reviewedAt: new Date(), reviewedByUserId: req.user!.id },
      })
      await tx.adminAuditLog.create({ data: {
        adminId: req.user!.id, action: 'VENDOR_ACCESS_UPDATED', targetType: 'User', targetId: id,
        payload: input.data,
      } })
    })
    notifyAccountAccessChanged(id)
    return getAccountCapabilities(id)
  })
}
