import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '@packages/db'
import { requireAdmin } from '../middleware/rbac.js'
import { realtimeBroker } from '../services/realtime.broker.js'

const PAGE_SIZE = 30

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

export const adminCatalogRoutes = async (app: FastifyInstance) => {
  app.addHook('preHandler', requireAdmin())

  // ─── List ─────────────────────────────────────────────────────────────────

  app.get('/admin/catalog', async (req, reply) => {
    const query = req.query as Record<string, string>
    const search = query.search?.trim() || ''
    const storeId = query.storeId?.trim() || ''
    const statusFilter = query.status || '' // 'active' | 'disabled' | 'flagged'
    const page = Math.max(1, parseInt(query.page || '1', 10))

    const where = {
      ...(storeId ? { storeId } : {}),
      ...(search ? { title: { contains: search } } : {}),
      ...(statusFilter === 'active'
        ? { isActive: true, flagged: false }
        : statusFilter === 'disabled'
        ? { isActive: false }
        : statusFilter === 'flagged'
        ? { flagged: true }
        : {}),
    }

    const [items, total] = await Promise.all([
      prisma.item.findMany({
        where,
        orderBy: [{ flagged: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: {
          id: true,
          title: true,
          price: true,
          isActive: true,
          flagged: true,
          flaggedAt: true,
          flaggedReason: true,
          store: { select: { id: true, name: true } },
        },
      }),
      prisma.item.count({ where }),
    ])

    return reply.send({ items, total, pages: Math.ceil(total / PAGE_SIZE) })
  })

  // ─── Flag ─────────────────────────────────────────────────────────────────

  const FlagSchema = z.object({ reason: z.string().min(1) })

  app.patch('/admin/catalog/:id/flag', async (req, reply) => {
    const { id } = req.params as { id: string }
    const { reason } = FlagSchema.parse(req.body)
    const adminId = req.user!.id
    const now = new Date()

    const item = await prisma.item.findUnique({
      where: { id },
      select: { title: true, storeId: true, store: { select: { ownerUserId: true } } },
    })
    if (!item) return reply.code(404).send({ error: 'Item not found' })

    await prisma.item.update({
      where: { id },
      data: { flagged: true, flaggedAt: now, flaggedByAdminId: adminId, flaggedReason: reason },
    })

    await writeAuditLog(adminId, 'FLAG_ITEM', 'Item', id, { reason, storeId: item.storeId })

    // Notify the store owner via realtime push
    realtimeBroker.publish(`vendor:${item.storeId}`, {
      type: 'item_flagged',
      timestamp: now.toISOString(),
      payload: { itemId: id, itemTitle: item.title, reason },
    })

    return reply.send({ ok: true })
  })

  // ─── Unflag ───────────────────────────────────────────────────────────────

  app.patch('/admin/catalog/:id/unflag', async (req, reply) => {
    const { id } = req.params as { id: string }
    const adminId = req.user!.id

    const item = await prisma.item.findUnique({
      where: { id },
      select: { title: true, storeId: true },
    })
    if (!item) return reply.code(404).send({ error: 'Item not found' })

    await prisma.item.update({
      where: { id },
      data: { flagged: false, flaggedAt: null, flaggedByAdminId: null, flaggedReason: null },
    })

    await writeAuditLog(adminId, 'UNFLAG_ITEM', 'Item', id, { storeId: item.storeId })

    return reply.send({ ok: true })
  })

  // ─── Disable ──────────────────────────────────────────────────────────────

  const DisableSchema = z.object({ reason: z.string().optional() })

  app.patch('/admin/catalog/:id/disable', async (req, reply) => {
    const { id } = req.params as { id: string }
    const { reason } = DisableSchema.parse(req.body)
    const adminId = req.user!.id

    const item = await prisma.item.findUnique({
      where: { id },
      select: { isActive: true, title: true, storeId: true, store: { select: { ownerUserId: true } } },
    })
    if (!item) return reply.code(404).send({ error: 'Item not found' })

    await prisma.item.update({ where: { id }, data: { isActive: false } })

    await writeAuditLog(adminId, 'DISABLE_ITEM', 'Item', id, { reason, storeId: item.storeId })

    realtimeBroker.publish(`vendor:${item.storeId}`, {
      type: 'item_disabled',
      timestamp: new Date().toISOString(),
      payload: { itemId: id, itemTitle: item.title, reason },
    })

    return reply.send({ ok: true })
  })

  // ─── Enable ───────────────────────────────────────────────────────────────

  app.patch('/admin/catalog/:id/enable', async (req, reply) => {
    const { id } = req.params as { id: string }
    const adminId = req.user!.id

    const item = await prisma.item.findUnique({
      where: { id },
      select: { isActive: true, storeId: true },
    })
    if (!item) return reply.code(404).send({ error: 'Item not found' })

    await prisma.item.update({ where: { id }, data: { isActive: true } })
    await writeAuditLog(adminId, 'ENABLE_ITEM', 'Item', id, { storeId: item.storeId })

    return reply.send({ ok: true })
  })
}
