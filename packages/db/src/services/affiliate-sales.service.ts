import { Prisma } from '../generated/client/index.js'
import { prisma } from '../client.js'

type AffiliateSalesSummary = {
  revenue: number
  orders: number
  customers: number
  averageOrderValue: number
}

export type AffiliateSalesRow = {
  affiliateId: string
  affiliateName: string
  referralCode: string
  website?: string | null
  orders: number
  revenue: number
  customers: number
  averageOrderValue: number
  lastOrderAt: string | null
}

export type AffiliateRecentOrder = {
  orderId: string
  customerName?: string | null
  total: number
  affiliateName: string
  referralCode: string
  createdAt: string
  status: string
}

function toNumber(v: unknown): number {
  if (typeof v === 'number') return v
  if (typeof v === 'string') {
    const n = Number(v)
    return Number.isFinite(n) ? n : 0
  }
  return 0
}

export async function getStoreAffiliateSalesSummary(storeId: string): Promise<AffiliateSalesSummary> {
  const rows = await prisma.$queryRaw<Array<{ revenue: unknown; orders: unknown; customers: unknown }>>(Prisma.sql`
    SELECT
      COALESCE(SUM(o.total), 0) AS revenue,
      COUNT(DISTINCT o.id)      AS orders,
      COUNT(DISTINCT o.userId)  AS customers
    FROM \`Order\` o
    WHERE o.storeId = ${storeId}
      AND o.paymentStatus = 'PAID'
      AND o.refundedAt IS NULL
      AND o.canceledAt IS NULL
      AND o.referredByAffiliateId IS NOT NULL
  `)

  const row = rows[0] ?? { revenue: 0, orders: 0, customers: 0 }
  const revenue = toNumber(row.revenue)
  const orders = toNumber(row.orders)
  const customers = toNumber(row.customers)
  const averageOrderValue = orders > 0 ? revenue / orders : 0

  return { revenue, orders, customers, averageOrderValue }
}

export async function getStoreAffiliateSalesByAffiliate(storeId: string): Promise<AffiliateSalesRow[]> {
  const rows = await prisma.$queryRaw<Array<{
    affiliateId: string
    affiliateName: string | null
    referralCode: string
    website: string | null
    orders: unknown
    revenue: unknown
    customers: unknown
    lastOrderAt: string | null
  }>>(Prisma.sql`
    SELECT
      a.id AS affiliateId,
      COALESCE(u.name, u.email) AS affiliateName,
      a.referralCode AS referralCode,
      a.website AS website,
      COUNT(DISTINCT o.id) AS orders,
      COALESCE(SUM(o.total), 0) AS revenue,
      COUNT(DISTINCT o.userId) AS customers,
      MAX(o.createdAt) AS lastOrderAt
    FROM \`Order\` o
    JOIN \`Affiliate\` a ON a.id = o.referredByAffiliateId
    JOIN \`User\` u ON u.id = a.userId
    WHERE o.storeId = ${storeId}
      AND o.paymentStatus = 'PAID'
      AND o.refundedAt IS NULL
      AND o.canceledAt IS NULL
      AND o.referredByAffiliateId IS NOT NULL
    GROUP BY a.id, u.name, u.email, a.referralCode, a.website
    ORDER BY revenue DESC, orders DESC
  `)

  return rows.map((r) => {
    const revenue = toNumber(r.revenue)
    const orders = toNumber(r.orders)
    const customers = toNumber(r.customers)
    return {
      affiliateId: r.affiliateId,
      affiliateName: r.affiliateName ?? 'Affiliate',
      referralCode: r.referralCode,
      website: r.website,
      orders,
      revenue,
      customers,
      averageOrderValue: orders > 0 ? revenue / orders : 0,
      lastOrderAt: r.lastOrderAt,
    }
  })
}

export async function getStoreAffiliateRecentOrders(storeId: string, limit = 25): Promise<AffiliateRecentOrder[]> {
  const take = Math.max(1, Math.min(100, Math.floor(limit)))
  const rows = await prisma.$queryRaw<Array<{
    orderId: string
    customerName: string | null
    total: unknown
    createdAt: string
    status: string
    affiliateName: string | null
    referralCode: string
  }>>(Prisma.sql`
    SELECT
      o.id AS orderId,
      cu.name AS customerName,
      o.total AS total,
      o.createdAt AS createdAt,
      o.status AS status,
      COALESCE(au.name, au.email) AS affiliateName,
      a.referralCode AS referralCode
    FROM \`Order\` o
    JOIN \`Affiliate\` a ON a.id = o.referredByAffiliateId
    JOIN \`User\` au ON au.id = a.userId
    JOIN \`User\` cu ON cu.id = o.userId
    WHERE o.storeId = ${storeId}
      AND o.paymentStatus = 'PAID'
      AND o.refundedAt IS NULL
      AND o.canceledAt IS NULL
      AND o.referredByAffiliateId IS NOT NULL
    ORDER BY o.createdAt DESC
    LIMIT ${take}
  `)

  return rows.map((r) => ({
    orderId: r.orderId,
    customerName: r.customerName,
    total: toNumber(r.total),
    affiliateName: r.affiliateName ?? 'Affiliate',
    referralCode: r.referralCode,
    createdAt: r.createdAt,
    status: r.status,
  }))
}

