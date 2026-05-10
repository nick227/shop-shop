import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '@packages/db'

export const adminFinanceRoutes = async (app: FastifyInstance) => {
  // ─── Finance Stats ─────────────────────────────────────────────────────────────

  app.get('/admin/finance/stats', async (_req, reply) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    const [
      totalGMV,
      paidOrders,
      failedPayments,
      platformFees,
      storesMissingStripe,
      ,
      pendingAffiliatePayouts,
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
      // Failed payments today (using REFUNDED status)
      prisma.order.count({
        where: { 
          paymentStatus: 'REFUNDED',
          createdAt: { gte: today }
        }
      }),
      // Platform fees today (service fee)
      prisma.order.aggregate({
        where: { paymentStatus: 'PAID', createdAt: { gte: today } },
        _sum: { serviceFeeAmount: true },
      }),
      // Stores missing Stripe setup
      prisma.store.count({ where: { stripeAccountId: null, status: 'ACTIVE' } }),
      // Pending vendor payouts (model not available — hardcoded 0)
      Promise.resolve(0),
      // Pending affiliate payouts
      prisma.affiliatePayout.count({ where: { status: 'PENDING' } }),
      // Refunds today
      prisma.order.count({ where: { paymentStatus: 'REFUNDED', createdAt: { gte: today } } }),
      // Orders stuck in PENDING_PAYMENT for > 30 minutes
      prisma.order.count({
        where: { status: 'PENDING_PAYMENT', createdAt: { lt: new Date(now.getTime() - 30 * 60 * 1000) } },
      }),
    ])

    return reply.send({
      gmvToday: Number(totalGMV._sum?.total ?? 0),
      paidOrdersToday: paidOrders,
      failedPaymentsToday: failedPayments,
      platformFeesToday: Number(platformFees._sum?.serviceFeeAmount ?? 0),
      storesMissingStripe,
      pendingVendorPayouts: 0,
      pendingAffiliatePayouts,
      refundsToday,
      ordersPendingPayment,
    })
  })

  // ─── Stripe Connect Status ─────────────────────────────────────────────────────

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
                createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
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

  // ─── Store Stripe Refresh ─────────────────────────────────────────────────────────────

  app.post('/admin/finance/stores/:storeId/stripe-refresh', async (req, reply) => {
    const { storeId } = req.params as { storeId: string }
    const adminId = req.user!.id

    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: {
        id: true,
        name: true,
        stripeAccountId: true,
        owner: { select: { id: true, name: true, email: true } }
      }
    })

    if (!store) {
      return reply.code(404).send({ error: 'Store not found' })
    }

    // Log the refresh action (actual Stripe refresh would be implemented here)
    await prisma.adminAuditLog.create({
      data: {
        adminId: req.user!.id,
        action: 'REFRESH_STORE_STRIPE',
        targetType: 'Store',
        targetId: storeId,
        payload: {
          storeName: store.name,
          previousStripeAccount: store.stripeAccountId,
        },
      }
    })

    return reply.send({ 
      success: true,
      message: 'Stripe refresh action logged',
      storeId,
      refreshedAt: new Date().toISOString()
    })
  })
}
