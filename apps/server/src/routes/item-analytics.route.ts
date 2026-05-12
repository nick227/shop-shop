import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { prisma } from '@packages/db'
import { Prisma } from '@packages/db/generated/client'
import { z } from 'zod'
import { requireRole } from '../middleware/rbac.js'
import { userHasStoreAccess } from '../middleware/storeAccess.js'
import { VendorErrors } from './vendor/vendorHelpers.js'

const QuerySchema = z.object({
  storeId: z.string().uuid(),
  period: z.enum(['7d', '30d', '90d', 'all']).default('30d'),
  sortBy: z
    .enum(['revenue', 'unitsSold', 'orders', 'lastSale', 'title', 'price'])
    .default('revenue'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
})

function periodCutoff(period: z.infer<typeof QuerySchema>['period']): Date | undefined {
  const now = new Date()
  switch (period) {
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    case '90d':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    case 'all':
      return undefined
  }
}

function inPeriodSql(dateFilter: Date | undefined): Prisma.Sql {
  if (!dateFilter) return Prisma.sql`TRUE`
  return Prisma.sql`(o.createdAt IS NOT NULL AND o.createdAt >= ${dateFilter})`
}

function orderBySql(
  sortBy: z.infer<typeof QuerySchema>['sortBy'],
  sortOrder: z.infer<typeof QuerySchema>['sortOrder'],
): Prisma.Sql {
  const col =
    sortBy === 'revenue'
      ? 'periodRevenue'
      : sortBy === 'unitsSold'
        ? 'periodUnitsSold'
        : sortBy === 'orders'
          ? 'periodOrderCount'
          : sortBy === 'lastSale'
            ? 'lastSale'
            : sortBy === 'title'
              ? 'title'
              : 'price'
  const dir = sortOrder === 'asc' ? 'ASC' : 'DESC'
  return Prisma.sql`ORDER BY ${Prisma.raw(`\`${col}\``)} ${Prisma.raw(dir)}`
}

/** Registered before `/items/:id` so `analytics` is never captured as an id param. */
async function handleItemAnalytics(request: FastifyRequest, reply: FastifyReply) {
  try {
    const query = QuerySchema.parse(request.query)
    const { storeId, period, sortBy, sortOrder, limit, offset } = query
    const dateFilter = periodCutoff(period)
    const pred = inPeriodSql(dateFilter)

    type AnalyticsRow = {
      itemId: string
      title: string
      description: string | null
      price: string
      imageUrl: string | null
      isActive: boolean
      isSoldOut: boolean
      unitsSold: bigint
      revenue: string
      orderCount: bigint
      lastSale: Date | string | null
      avgOrderValue: string
      periodUnitsSold: bigint
      periodRevenue: string
      periodOrderCount: bigint
      trend: string
    }

    // Avoid `HAVING unitsSold` — some MySQL modes reject aggregate aliases in HAVING.
    const analytics = await prisma.$queryRaw<AnalyticsRow[]>(Prisma.sql`
      SELECT
        i.id AS itemId,
        i.title,
        i.description,
        i.price,
        (
          SELECT m.url
          FROM MediaAsset m
          WHERE m.itemId = i.id AND m.kind = 'IMAGE'
          ORDER BY m.sortIndex ASC, m.createdAt ASC
          LIMIT 1
        ) AS imageUrl,
        i.isActive,
        i.isSoldOut,
        COALESCE(SUM(oi.quantity), 0) AS unitsSold,
        COALESCE(SUM(oi.unitPrice * oi.quantity), 0) AS revenue,
        COALESCE(COUNT(DISTINCT oi.orderId), 0) AS orderCount,
        MAX(o.createdAt) AS lastSale,
        CASE
          WHEN COUNT(DISTINCT oi.orderId) > 0
          THEN COALESCE(SUM(oi.unitPrice * oi.quantity), 0) / COUNT(DISTINCT oi.orderId)
          ELSE 0
        END AS avgOrderValue,
        COALESCE(SUM(CASE WHEN ${pred} THEN oi.quantity ELSE 0 END), 0) AS periodUnitsSold,
        COALESCE(SUM(CASE WHEN ${pred} THEN oi.unitPrice * oi.quantity ELSE 0 END), 0) AS periodRevenue,
        COALESCE(COUNT(DISTINCT CASE WHEN ${pred} THEN oi.orderId END), 0) AS periodOrderCount,
        'stable' AS trend
      FROM Item i
      LEFT JOIN OrderItem oi ON i.id = oi.itemId
      LEFT JOIN \`Order\` o ON oi.orderId = o.id AND o.status != 'CANCELED'
      WHERE i.storeId = ${storeId}
      GROUP BY i.id, i.title, i.description, i.price, i.isActive, i.isSoldOut
      HAVING COALESCE(SUM(oi.quantity), 0) > 0 OR i.isActive = TRUE
      ${orderBySql(sortBy, sortOrder)}
      LIMIT ${limit} OFFSET ${offset}
    `)

    const summary = await prisma.$queryRaw<
      Array<{
        totalItems: bigint
        activeItems: bigint
        totalUnitsSold: bigint
        totalRevenue: string
        totalOrders: bigint
        avgOrderValue: string
      }>
    >(Prisma.sql`
      SELECT
        COUNT(DISTINCT i.id) AS totalItems,
        COUNT(DISTINCT CASE WHEN i.isActive = true AND i.isSoldOut = false THEN i.id END) AS activeItems,
        COALESCE(SUM(oi.quantity), 0) AS totalUnitsSold,
        COALESCE(SUM(oi.unitPrice * oi.quantity), 0) AS totalRevenue,
        COALESCE(COUNT(DISTINCT oi.orderId), 0) AS totalOrders,
        CASE
          WHEN COUNT(DISTINCT oi.orderId) > 0
          THEN COALESCE(SUM(oi.unitPrice * oi.quantity), 0) / COUNT(DISTINCT oi.orderId)
          ELSE 0
        END AS avgOrderValue
      FROM Item i
      LEFT JOIN OrderItem oi ON i.id = oi.itemId
      LEFT JOIN \`Order\` o ON oi.orderId = o.id AND o.status != 'CANCELED'
      WHERE i.storeId = ${storeId}
    `)

    return reply.send({
      success: true,
      data: {
        items: analytics.map((item) => ({
          ...item,
          price: Number(item.price),
          unitsSold: Number(item.unitsSold),
          revenue: Number(item.revenue),
          orderCount: Number(item.orderCount),
          avgOrderValue: Number(item.avgOrderValue),
          periodUnitsSold: Number(item.periodUnitsSold),
          periodRevenue: Number(item.periodRevenue),
          periodOrderCount: Number(item.periodOrderCount),
          trend: item.trend === 'up' || item.trend === 'down' ? item.trend : 'stable',
        })),
        summary: {
          totalItems: Number(summary[0]?.totalItems ?? 0),
          activeItems: Number(summary[0]?.activeItems ?? 0),
          totalUnitsSold: Number(summary[0]?.totalUnitsSold ?? 0),
          totalRevenue: Number(summary[0]?.totalRevenue ?? 0),
          totalOrders: Number(summary[0]?.totalOrders ?? 0),
          avgOrderValue: Number(summary[0]?.avgOrderValue ?? 0),
        },
        meta: {
          period,
          sortBy,
          sortOrder,
          limit,
          offset,
          hasMore: analytics.length === limit,
        },
      },
    })
  } catch (error) {
    request.log.error({ err: error }, 'Item analytics failed')
    const message = error instanceof Error ? error.message : 'Unknown error'
    return reply.status(500).send({
      success: false,
      error: 'Failed to fetch item analytics',
      // Always include a message in dev/local to unblock debugging.
      // If you want to hide details in production, gate it at the API gateway / edge.
      detail: message,
    })
  }
}

export async function itemAnalyticsRoutes(app: FastifyInstance) {
  app.get('/items/analytics', {
    preHandler: [requireRole(['USER', 'VENDOR', 'ADMIN', 'STAFF'])],
  }, async (req, reply) => {
    const { storeId } = QuerySchema.parse(req.query)
    const userId = req.user?.id
    const role = req.user?.role
    
    if (!userId || !role) {
      return VendorErrors.unauthorized(reply)
    }
    
    if (!(await userHasStoreAccess(userId, role, storeId, 'analytics'))) {
      return VendorErrors.forbidden(reply, 'You cannot access analytics for this store')
    }
    
    return handleItemAnalytics(req, reply)
  })

  app.log.info(
    {
      routes: ['/api/items/analytics'],
    },
    'Item analytics routes registered',
  )
}
