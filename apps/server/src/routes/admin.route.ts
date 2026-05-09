import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '@packages/db'
import { requireAdmin } from '../middleware/rbac.js'

const PAGE_SIZE = 25

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

export const adminRoutes = async (app: FastifyInstance) => {
  // All admin routes require ADMIN role
  app.addHook('preHandler', requireAdmin())

  // ─── Stats ────────────────────────────────────────────────────────────────

  app.get('/admin/stats', async (_req, reply) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [
      totalUsers,
      totalStores,
      ordersToday,
      revenueResult,
      pendingVendorApplications,
      pendingAffiliateApplications,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.store.count({ where: { status: 'ACTIVE' } }),
      prisma.order.count({ where: { createdAt: { gte: today } } }),
      prisma.order.aggregate({
        where: { createdAt: { gte: today }, paymentStatus: 'PAID' },
        _sum: { total: true },
      }),
      prisma.vendorVerification.count({
        where: { status: { in: ['PENDING', 'SUBMITTED', 'UNDER_REVIEW'] } },
      }),
      prisma.affiliate.count({ where: { status: 'PENDING' } }),
    ])

    return reply.send({
      totalUsers,
      totalStores,
      ordersToday,
      revenueToday: Number(revenueResult._sum?.total ?? 0),
      pendingVendorApplications,
      pendingAffiliateApplications,
    })
  })

  // ─── Users ────────────────────────────────────────────────────────────────

  app.get('/admin/users', async (req, reply) => {
    const query = req.query as Record<string, string>
    const search = query.search?.trim() || ''
    const role = query.role || ''
    const page = Math.max(1, parseInt(query.page || '1', 10))

    const where = {
      ...(role ? { role: role as never } : {}),
      ...(search
        ? {
            OR: [
              { email: { contains: search } },
              { name: { contains: search } },
            ],
          }
        : {}),
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          suspendedAt: true,
          createdAt: true,
          _count: { select: { orders: true, storesOwned: true } },
        },
      }),
      prisma.user.count({ where }),
    ])

    return reply.send({ users, total, pages: Math.ceil(total / PAGE_SIZE) })
  })

  app.get('/admin/users/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        suspendedAt: true,
        createdAt: true,
        _count: { select: { orders: true, storesOwned: true } },
      },
    })
    if (!user) return reply.code(404).send({ error: 'User not found' })
    return reply.send(user)
  })

  const RoleSchema = z.object({
    role: z.enum(['USER', 'VENDOR_PENDING', 'VENDOR', 'ADMIN', 'AFFILIATE', 'RIDER', 'STAFF']),
  })

  app.patch('/admin/users/:id/role', async (req, reply) => {
    const { id } = req.params as { id: string }
    const { role } = RoleSchema.parse(req.body)
    const adminId = req.user!.id

    const existing = await prisma.user.findUnique({ where: { id }, select: { role: true } })
    if (!existing) return reply.code(404).send({ error: 'User not found' })

    // Prevent demoting the last admin
    if (existing.role === 'ADMIN' && role !== 'ADMIN') {
      const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } })
      if (adminCount <= 1) {
        return reply.code(400).send({ error: 'Cannot remove the last admin account' })
      }
    }

    const updated = await prisma.user.update({ where: { id }, data: { role } })
    await writeAuditLog(adminId, 'UPDATE_USER_ROLE', 'User', id, {
      from: existing.role,
      to: role,
    })

    return reply.send({ user: updated })
  })

  const SuspendSchema = z.object({ suspend: z.boolean() })

  app.patch('/admin/users/:id/suspend', async (req, reply) => {
    const { id } = req.params as { id: string }
    const { suspend } = SuspendSchema.parse(req.body)
    const adminId = req.user!.id

    const existing = await prisma.user.findUnique({ where: { id }, select: { role: true, suspendedAt: true } })
    if (!existing) return reply.code(404).send({ error: 'User not found' })

    // Prevent suspending admin accounts to avoid lockout
    if (existing.role === 'ADMIN') {
      return reply.code(400).send({ error: 'Admin accounts cannot be suspended' })
    }

    await prisma.user.update({
      where: { id },
      data: { suspendedAt: suspend ? new Date() : null },
    })
    await writeAuditLog(adminId, suspend ? 'SUSPEND_USER' : 'UNSUSPEND_USER', 'User', id, {})

    return reply.send({ ok: true })
  })

  // ─── Stores ───────────────────────────────────────────────────────────────

  app.get('/admin/stores', async (req, reply) => {
    const query = req.query as Record<string, string>
    const search = query.search?.trim() || ''
    const status = query.status || ''
    const page = Math.max(1, parseInt(query.page || '1', 10))

    const where = {
      ...(status ? { status: status as never } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { slug: { contains: search } },
            ],
          }
        : {}),
    }

    const [stores, total] = await Promise.all([
      prisma.store.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          storeType: true,
          isPublished: true,
          createdAt: true,
          owner: { select: { id: true, name: true, email: true } },
          _count: { select: { orders: true } },
        },
      }),
      prisma.store.count({ where }),
    ])

    return reply.send({ stores, total, pages: Math.ceil(total / PAGE_SIZE) })
  })

  app.get('/admin/stores/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const [store, kyc] = await Promise.all([
      prisma.store.findUnique({
        where: { id },
        include: {
          owner: { select: { id: true, name: true, email: true } },
          _count: { select: { orders: true, items: true } },
          teamMembers: {
            select: {
              id: true,
              permissionsJson: true,
              user: { select: { id: true, name: true, email: true } },
            },
            take: 20,
          },
        },
      }),
      prisma.vendorVerification.findFirst({
        where: { user: { storesOwned: { some: { id } } } },
        select: {
          id: true,
          status: true,
          businessName: true,
          businessType: true,
          submittedAt: true,
          reviewedAt: true,
          approvedAt: true,
          reviewNotes: true,
          rejectionReason: true,
        },
      }),
    ])
    if (!store) return reply.code(404).send({ error: 'Store not found' })
    return reply.send({ ...store, kyc })
  })

  const StoreStatusSchema = z.object({
    status: z.enum(['ACTIVE', 'PAUSED', 'DISABLED']),
    reason: z.string().optional(),
  })

  app.patch('/admin/stores/:id/status', async (req, reply) => {
    const { id } = req.params as { id: string }
    const { status, reason } = StoreStatusSchema.parse(req.body)
    const adminId = req.user!.id

    const existing = await prisma.store.findUnique({ where: { id }, select: { status: true } })
    if (!existing) return reply.code(404).send({ error: 'Store not found' })

    const now = new Date()
    const updated = await prisma.store.update({
      where: { id },
      data: {
        status,
        ...(status === 'DISABLED'
          ? { disabledAt: now, disabledByUserId: adminId, disabledReason: reason ?? null }
          : status === 'ACTIVE'
          ? { disabledAt: null, disabledByUserId: null, disabledReason: null }
          : {}),
      },
    })
    await writeAuditLog(adminId, 'UPDATE_STORE_STATUS', 'Store', id, {
      from: existing.status,
      to: status,
      reason,
    })

    return reply.send({ store: updated })
  })

  // ─── Vendor Applications ──────────────────────────────────────────────────

  app.get('/admin/vendor-applications', async (_req, reply) => {
    const applications = await prisma.vendorVerification.findMany({
      where: { status: { in: ['PENDING', 'SUBMITTED', 'UNDER_REVIEW'] } },
      orderBy: { createdAt: 'asc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    })
    return reply.send({ applications })
  })

  const DecisionSchema = z.object({
    decision: z.enum(['approve', 'reject']),
    rejectionReason: z.string().optional(),
  })

  app.patch('/admin/vendor-applications/:id/decision', async (req, reply) => {
    const { id } = req.params as { id: string }
    const { decision, rejectionReason } = DecisionSchema.parse(req.body)
    const adminId = req.user!.id
    const now = new Date()

    const application = await prisma.vendorVerification.findUnique({
      where: { id },
      select: { userId: true, status: true },
    })
    if (!application) return reply.code(404).send({ error: 'Application not found' })
    if (!['PENDING', 'SUBMITTED', 'UNDER_REVIEW'].includes(application.status)) {
      return reply.code(400).send({ error: 'Application is not awaiting review' })
    }

    await prisma.$transaction(async (tx) => {
      if (decision === 'approve') {
        await tx.vendorVerification.update({
          where: { id },
          data: { status: 'APPROVED', reviewedAt: now, approvedAt: now },
        })
        await tx.user.update({
          where: { id: application.userId },
          data: { role: 'VENDOR' },
        })
      } else {
        await tx.vendorVerification.update({
          where: { id },
          data: {
            status: 'REJECTED',
            reviewedAt: now,
            rejectionReason: rejectionReason ?? null,
          },
        })
      }
    })

    await writeAuditLog(
      adminId,
      `VENDOR_APPLICATION_${decision.toUpperCase()}`,
      'VendorVerification',
      id,
      { userId: application.userId, rejectionReason },
    )

    return reply.send({ ok: true })
  })

  // ─── Audit Log ────────────────────────────────────────────────────────────

  app.get('/admin/audit', async (req, reply) => {
    const query = req.query as Record<string, string>
    const page = Math.max(1, parseInt(query.page || '1', 10))
    const action = query.action?.trim() || ''
    const adminId = query.adminId?.trim() || ''
    const from = query.from ? new Date(query.from) : undefined
    const to = query.to ? new Date(query.to) : undefined

    const where = {
      ...(action ? { action } : {}),
      ...(adminId ? { adminId } : {}),
      ...((from || to)
        ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } }
        : {}),
    }

    const [logs, total, distinctActions, adminUsers] = await Promise.all([
      prisma.adminAuditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        include: {
          admin: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.adminAuditLog.count({ where }),
      prisma.adminAuditLog.findMany({
        select: { action: true },
        distinct: ['action'],
        orderBy: { action: 'asc' },
      }),
      prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true, name: true, email: true },
        orderBy: { name: 'asc' },
      }),
    ])

    return reply.send({
      logs,
      total,
      pages: Math.ceil(total / PAGE_SIZE),
      filterOptions: {
        actions: distinctActions.map((a) => a.action),
        admins: adminUsers,
      },
    })
  })

  // ─── Settings ─────────────────────────────────────────────────────────────

  app.get('/admin/settings', async (_req, reply) => {
    const rows = await prisma.systemSetting.findMany()
    const settings = Object.fromEntries(rows.map((r) => [r.key, r.value]))
    return reply.send({ settings })
  })

  const SettingsUpdateSchema = z.object({
    settings: z.record(z.string()),
  })

  app.patch('/admin/settings', async (req, reply) => {
    const { settings } = SettingsUpdateSchema.parse(req.body)
    const adminId = req.user!.id

    await Promise.all(
      Object.entries(settings).map(([key, value]) =>
        prisma.systemSetting.upsert({
          where: { key },
          create: { key, value },
          update: { value },
        })
      )
    )

    await writeAuditLog(adminId, 'UPDATE_SETTINGS', 'SystemSetting', null, {
      keys: Object.keys(settings),
    })

    return reply.send({ ok: true })
  })
}
