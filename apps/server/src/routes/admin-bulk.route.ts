import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '@packages/db'
import { requireAdmin } from '../middleware/rbac.js'

const IdsReasonSchema = z.object({
  reason: z.string().optional(),
})

const BulkUserIdsSchema = IdsReasonSchema.extend({
  userIds: z.array(z.string().min(1).max(36)).min(1).max(100),
})

const BulkAffiliateIdsSchema = IdsReasonSchema.extend({
  affiliateIds: z.array(z.string().min(1).max(36)).min(1).max(100),
})

const BulkItemIdsSchema = IdsReasonSchema.extend({
  itemIds: z.array(z.string().min(1).max(36)).min(1).max(100),
})

async function writeAuditLog(
  adminId: string,
  action: string,
  targetType: string,
  targetId: string | null,
  payload?: unknown,
) {
  await prisma.adminAuditLog.create({
    data: {
      adminId,
      action,
      targetType,
      targetId,
      payload: payload ? (payload as object) : undefined,
    },
  })
}

export async function adminBulkRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAdmin())

  app.delete('/users/bulk', async (request, reply) => {
    try {
      const { userIds, reason } = BulkUserIdsSchema.parse(request.body)
      const adminId = request.user!.id
      const uniqueIds = [...new Set(userIds)]

      if (uniqueIds.includes(adminId)) {
        return reply.code(400).send({ error: 'You cannot delete your own account in this operation' })
      }

      const users = await prisma.user.findMany({
        where: { id: { in: uniqueIds } },
        select: {
          id: true,
          email: true,
          role: true,
          _count: { select: { orders: true, storesOwned: true } },
        },
      })

      if (users.length === 0) {
        return reply.code(404).send({ error: 'No users found' })
      }
      if (users.length !== uniqueIds.length) {
        return reply.code(400).send({
          error: 'Some users not found',
          missing: uniqueIds.filter((id) => !users.some((u) => u.id === id)),
        })
      }

      const adminInSelection = users.filter((u) => u.role === 'ADMIN')
      if (adminInSelection.length > 0) {
        const totalAdmins = await prisma.user.count({ where: { role: 'ADMIN' } })
        if (totalAdmins - adminInSelection.length < 1) {
          return reply.code(400).send({ error: 'Cannot delete the last admin account' })
        }
      }

      const blockedOrders = users.filter((u) => u._count.orders > 0)
      if (blockedOrders.length > 0) {
        return reply.code(400).send({
          error: 'Cannot delete users who have placed orders',
          usersWithOrders: blockedOrders.map((u) => ({ id: u.id, email: u.email, orderCount: u._count.orders })),
        })
      }

      const blockedStores = users.filter((u) => u._count.storesOwned > 0)
      if (blockedStores.length > 0) {
        return reply.code(400).send({
          error: 'Cannot delete users who own stores — remove or transfer stores first',
          usersWithStores: blockedStores.map((u) => ({
            id: u.id,
            email: u.email,
            storeCount: u._count.storesOwned,
          })),
        })
      }

      const deleted = await prisma.$transaction(async (tx) => {
        await tx.adminAuditLog.deleteMany({ where: { adminId: { in: uniqueIds } } })
        return tx.user.deleteMany({ where: { id: { in: uniqueIds } } })
      })

      await writeAuditLog(adminId, 'BULK_DELETE_USERS', 'User', null, {
        userIds: uniqueIds,
        emails: users.map((u) => u.email),
        reason: reason ?? null,
        deletedCount: deleted.count,
      })

      return reply.send({ success: true, deletedCount: deleted.count })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Invalid request data', details: error.errors })
      }
      app.log.error(error, 'Failed to bulk delete users')
      return reply.code(500).send({ error: 'Failed to delete users' })
    }
  })

  app.delete('/affiliates/bulk', async (request, reply) => {
    try {
      const { affiliateIds, reason } = BulkAffiliateIdsSchema.parse(request.body)
      const adminId = request.user!.id
      const uniqueIds = [...new Set(affiliateIds)]

      const affiliates = await prisma.affiliate.findMany({
        where: { id: { in: uniqueIds } },
        select: {
          id: true,
          userId: true,
          referralCode: true,
          _count: { select: { commissions: true, payouts: true } },
        },
      })

      if (affiliates.length === 0) {
        return reply.code(404).send({ error: 'No affiliates found' })
      }
      if (affiliates.length !== uniqueIds.length) {
        return reply.code(400).send({
          error: 'Some affiliates not found',
          missing: uniqueIds.filter((id) => !affiliates.some((a) => a.id === id)),
        })
      }

      const blocked = affiliates.filter((a) => a._count.commissions > 0 || a._count.payouts > 0)
      if (blocked.length > 0) {
        return reply.code(400).send({
          error: 'Cannot delete affiliates with commissions or payout history',
          blocked: blocked.map((a) => ({
            id: a.id,
            referralCode: a.referralCode,
            commissions: a._count.commissions,
            payouts: a._count.payouts,
          })),
        })
      }

      const userIds = affiliates.map((a) => a.userId)

      const deleted = await prisma.$transaction(async (tx) => {
        const r = await tx.affiliate.deleteMany({ where: { id: { in: uniqueIds } } })
        await tx.user.updateMany({
          where: { id: { in: userIds }, role: 'AFFILIATE' },
          data: { role: 'USER' },
        })
        return r
      })

      await writeAuditLog(adminId, 'BULK_DELETE_AFFILIATES', 'Affiliate', null, {
        affiliateIds: uniqueIds,
        userIds,
        reason: reason ?? null,
        deletedCount: deleted.count,
      })

      return reply.send({ success: true, deletedCount: deleted.count })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Invalid request data', details: error.errors })
      }
      app.log.error(error, 'Failed to bulk delete affiliates')
      return reply.code(500).send({ error: 'Failed to delete affiliates' })
    }
  })

  app.delete('/catalog/bulk', async (request, reply) => {
    try {
      const { itemIds, reason } = BulkItemIdsSchema.parse(request.body)
      const adminId = request.user!.id
      const uniqueIds = [...new Set(itemIds)]

      const items = await prisma.item.findMany({
        where: { id: { in: uniqueIds } },
        select: { id: true, title: true, storeId: true },
      })

      if (items.length === 0) {
        return reply.code(404).send({ error: 'No catalog items found' })
      }
      if (items.length !== uniqueIds.length) {
        return reply.code(400).send({
          error: 'Some items not found',
          missing: uniqueIds.filter((id) => !items.some((it) => it.id === id)),
        })
      }

      const deleted = await prisma.$transaction(async (tx) => {
        await tx.cartItem.deleteMany({ where: { itemId: { in: uniqueIds } } })
        return tx.item.deleteMany({ where: { id: { in: uniqueIds } } })
      })

      await writeAuditLog(adminId, 'BULK_DELETE_CATALOG_ITEMS', 'Item', null, {
        itemIds: uniqueIds,
        titles: items.map((it) => it.title),
        storeIds: [...new Set(items.map((it) => it.storeId))],
        reason: reason ?? null,
        deletedCount: deleted.count,
      })

      return reply.send({ success: true, deletedCount: deleted.count })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Invalid request data', details: error.errors })
      }
      app.log.error(error, 'Failed to bulk delete catalog items')
      return reply.code(500).send({ error: 'Failed to delete catalog items' })
    }
  })
}
