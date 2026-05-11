import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma, runRiverIngestion } from '@packages/db'
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
      activeDeliveries,
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
      prisma.deliveryJob.count({ where: { status: { in: ['REQUESTED', 'DISPATCHED'] } } }),
    ])

    return reply.send({
      totalUsers,
      totalStores,
      ordersToday,
      revenueToday: Number(revenueResult._sum?.total ?? 0),
      pendingVendorApplications,
      pendingAffiliateApplications,
      activeDeliveries,
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
    if (decision === 'reject' && !rejectionReason?.trim()) {
      return reply.code(400).send({ error: 'A rejection reason is required' })
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

  // ─── Orders ──────────────────────────────────────────────────────────────────

  app.get('/admin/orders', async (req, reply) => {
    const query = req.query as Record<string, string>
    const page = Math.max(1, parseInt(query.page || '1', 10))
    const status = query.status?.trim() || ''
    const paymentStatus = query.paymentStatus?.trim() || ''
    const storeId = query.storeId?.trim() || ''
    const search = query.search?.trim() || ''
    const from = query.from ? new Date(query.from) : undefined
    const to = query.to ? new Date(query.to) : undefined

    const where = {
      ...(status ? { status: status as never } : {}),
      ...(paymentStatus ? { paymentStatus: paymentStatus as never } : {}),
      ...(storeId ? { storeId } : {}),
      ...((from || to)
        ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } }
        : {}),
      ...(search
        ? {
            OR: [
              { id: { contains: search } },
              { user: { email: { contains: search } } },
              { user: { name: { contains: search } } },
            ],
          }
        : {}),
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: {
          id: true,
          status: true,
          paymentStatus: true,
          deliveryMode: true,
          total: true,
          createdAt: true,
          user: { select: { id: true, name: true, email: true } },
          store: { select: { id: true, name: true } },
          _count: { select: { items: true } },
        },
      }),
      prisma.order.count({ where }),
    ])

    return reply.send({ orders, total, pages: Math.ceil(total / PAGE_SIZE) })
  })

  app.get('/admin/orders/:orderId', async (req, reply) => {
    const { orderId } = req.params as { orderId: string }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        store: { select: { id: true, name: true, slug: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        items: {
          select: {
            id: true,
            titleSnapshot: true,
            quantity: true,
            unitPrice: true,
            optionsJson: true,
            notes: true,
          },
        },
        events: {
          orderBy: { createdAt: 'asc' },
          select: { id: true, status: true, note: true, createdAt: true },
        },
      },
    })

    if (!order) return reply.code(404).send({ error: 'Order not found' })
    return reply.send({ order })
  })

  // ─── Affiliate Payouts ───────────────────────────────────────────────────────

  app.get('/admin/affiliate-payouts', async (req, reply) => {
    const query = req.query as Record<string, string>
    const page = Math.max(1, parseInt(query.page || '1', 10))
    const status = query.status?.trim() || ''

    const where = status ? { status: status as never } : {}

    const [payouts, total] = await Promise.all([
      prisma.affiliatePayout.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        include: {
          affiliate: {
            select: {
              id: true,
              referralCode: true,
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
      }),
      prisma.affiliatePayout.count({ where }),
    ])

    return reply.send({ payouts, total, pages: Math.ceil(total / PAGE_SIZE) })
  })

  // ─── Settings ─────────────────────────────────────────────────────────────

  app.patch('/admin/settings', async (req, reply) => {
    const { settings } = SettingsUpdateSchema.parse(req.body)
    const adminId = req.user!.id

    if ('platform.commission_rate' in settings) {
      const rate = parseFloat(settings['platform.commission_rate'])
      if (isNaN(rate) || rate < 0 || rate > 100) {
        return reply.code(400).send({ error: 'platform.commission_rate must be a number between 0 and 100' })
      }
    }

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

  // ─── Delivery Operations ───────────────────────────────────────────────────────

  app.get('/admin/delivery/stats', async (_req, reply) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    const [
      activeDeliveries,
      failedDeliveries,
      stuckDeliveries,
      totalDeliveries,
      doordashDeliveries,
      inhouseDeliveries,
      readyNotDispatched,
      ,
    ] = await Promise.all([
      // Active deliveries (dispatched)
      prisma.deliveryJob.count({
        where: { status: 'DISPATCHED', createdAt: { gte: today } },
      }),
      // Failed deliveries today
      prisma.deliveryJob.count({
        where: { status: { in: ['FAILED', 'CANCELED'] }, createdAt: { gte: today } },
      }),
      // Stuck deliveries (dispatched > 2 hours ago)
      prisma.deliveryJob.count({
        where: {
          status: 'DISPATCHED',
          createdAt: { lt: new Date(now.getTime() - 2 * 60 * 60 * 1000) },
        },
      }),
      // Total deliveries today
      prisma.deliveryJob.count({ where: { createdAt: { gte: today } } }),
      // DoorDash deliveries
      prisma.deliveryJob.count({ where: { provider: 'DOORDASH_DRIVE', createdAt: { gte: today } } }),
      // In-house deliveries
      prisma.deliveryJob.count({ where: { provider: 'IN_HOUSE', createdAt: { gte: today } } }),
      // Orders ready for third-party delivery but not dispatched
      prisma.order.count({
        where: {
          status: 'READY',
          deliveryMode: { in: ['THIRD_PARTY_PROVIDER', 'PLATFORM_DRIVER'] },
          createdAt: { gte: today },
        },
      }),
      // No numeric aggregate field available on DeliveryJob
      Promise.resolve(null),
    ])

    return reply.send({
      activeDeliveries,
      failedDeliveries,
      stuckDeliveries,
      totalDeliveries,
      providerSplit: { doordash: doordashDeliveries, inhouse: inhouseDeliveries },
      readyNotDispatched,
      avgDeliveryTime: null,
      avgDeliveryFee: '0.00',
    })
  })

  // ─── Finance Operations ───────────────────────────────────────────────────────

  app.get('/admin/finance/stats', async (_req, reply) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    const [
      totalGMV,
      paidOrders,
      failedPayments,
      platformFees,
      storesMissingStripe,
      pendingAffiliatePayouts,
      ,
      refundsToday,
      ordersPendingPayment,
    ] = await Promise.all([
      // Total GMV today
      prisma.order.aggregate({
        where: { 
          paymentStatus: 'PAID',
          createdAt: { gte: today }
        },
        _sum: { total: true }
      }),
      // Paid orders today
      prisma.order.count({
        where: { 
          paymentStatus: 'PAID',
          createdAt: { gte: today }
        }
      }),
      // Failed payments today
      prisma.order.count({
        where: { 
          paymentStatus: 'REFUNDED',
          createdAt: { gte: today }
        }
      }),
      // Platform fees today (service fee)
      prisma.order.aggregate({
        where: {
          paymentStatus: 'PAID',
          createdAt: { gte: today },
        },
        _sum: { serviceFeeAmount: true },
      }),
      // Stores missing Stripe setup
      prisma.store.count({
        where: {
          stripeAccountId: null,
          status: 'ACTIVE',
        },
      }),
      // Pending affiliate payouts
      prisma.affiliatePayout.count({ where: { status: 'PENDING' } }),
      // Pending affiliate payouts (duplicate slot — vendor payout model not available)
      Promise.resolve(0),
      // Refunds today
      prisma.order.count({
        where: {
          paymentStatus: 'REFUNDED',
          createdAt: { gte: today },
        },
      }),
      // Orders stuck in PENDING_PAYMENT
      prisma.order.count({
        where: {
          status: 'PENDING_PAYMENT',
          createdAt: { lt: new Date(now.getTime() - 30 * 60 * 1000) },
        },
      }),
    ])

    return reply.send({
      gmvToday: Number(totalGMV._sum?.total ?? 0),
      paidOrdersToday: paidOrders,
      failedPaymentsToday: failedPayments,
      platformFeesToday: 0,
      storesMissingStripe,
      pendingVendorPayouts: 0,
      pendingAffiliatePayouts,
      refundsToday,
      ordersPendingPayment,
    })
  })

  app.get('/admin/finance/stripe-connect', async (_req, reply) => {
    const stores = await prisma.store.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        name: true,
        slug: true,
        stripeAccountId: true,
        stripeChargesEnabled: true,
        stripePayoutsEnabled: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            orders: {
              where: {
                paymentStatus: 'PAID',
                createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // last 7 days
              }
            }
          }
        }
      }
    })

    const storesWithStripe = stores.filter(s => s.stripeAccountId)
    const storesWithoutStripe = stores.filter(s => !s.stripeAccountId)

    return reply.send({
      storesWithStripe: storesWithStripe.map(s => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        stripeAccountId: s.stripeAccountId,
        stripeChargesEnabled: s.stripeChargesEnabled,
        stripePayoutsEnabled: s.stripePayoutsEnabled,
        owner: s.owner,
        recentOrders: s._count.orders
      })),
      storesWithoutStripe: storesWithoutStripe.map(s => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        owner: s.owner,
        recentOrders: s._count.orders
      })),
      summary: {
        totalActiveStores: stores.length,
        withStripeConnect: storesWithStripe.length,
        missingStripeConnect: storesWithoutStripe.length
      }
    })
  })

  app.get('/admin/finance/payments', async (req, reply) => {
    const query = req.query as Record<string, string>
    const page = Math.max(1, parseInt(query.page || '1', 10))
    const limit = Math.min(50, parseInt(query.limit || '20', 10))
    const status = query.status?.trim()
    const search = query.search?.trim()
    const from = query.from ? new Date(query.from) : undefined
    const to = query.to ? new Date(query.to) : undefined

    const where = {
      ...(status && status !== 'all' ? { paymentStatus: status as never } : {}),
      ...((from || to)
        ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } }
        : {}),
      ...(search
        ? {
            OR: [
              { id: { contains: search } },
              { user: { email: { contains: search } } },
              { user: { name: { contains: search } } },
            ],
          }
        : {}),
    }

    const [payments, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          paymentStatus: true,
          total: true,
          stripePaymentIntentId: true,
          createdAt: true,
          user: { select: { id: true, name: true, email: true } },
          store: { select: { id: true, name: true } },
        },
      }),
      prisma.order.count({ where }),
    ])

    return reply.send({ payments, total, pages: Math.ceil(total / limit) })
  })

  app.get('/admin/finance/payouts', async (req, reply) => {
    const query = req.query as Record<string, string>
    const page = Math.max(1, parseInt(query.page || '1', 10))
    const limit = Math.min(50, parseInt(query.limit || '20', 10))
    const status = query.status?.trim()

    const where = status ? { status: status as never } : {}

    const [payouts, total] = await Promise.all([
      prisma.affiliatePayout.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          affiliate: {
            select: {
              id: true,
              referralCode: true,
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
      }),
      prisma.affiliatePayout.count({ where }),
    ])

    return reply.send({ payouts, total, pages: Math.ceil(total / limit) })
  })

  app.post('/admin/finance/stores/:storeId/stripe-refresh', async (req, reply) => {
    const { storeId } = req.params as { storeId: string }
    const adminId = req.user!.id

    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: {
        id: true,
        name: true,
        stripeAccountId: true,
        owner: { select: { id: true, name: true, email: true } },
      },
    })

    if (!store) {
      return reply.code(404).send({ error: 'Store not found' })
    }

    await writeAuditLog(adminId, 'REFRESH_STORE_STRIPE', 'Store', storeId, {
      storeName: store.name,
      previousStripeAccount: store.stripeAccountId,
    })

    return reply.send({
      success: true,
      message: 'Stripe refresh action logged',
      storeId,
      refreshedAt: new Date().toISOString(),
    })
  })

  app.post('/admin/river/generate-initial', async (req, reply) => {
    try {
      const result = await runRiverIngestion(prisma)
      req.log.info({ event: 'river_initial_generation_completed', result })
      return reply.code(200).send({ success: true, result })
    } catch (error) {
      req.log.error({
        event: 'river_initial_generation_failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      return reply.code(500).send({
        success: false,
        error: 'Initial river generation failed',
      })
    }
  })
}
