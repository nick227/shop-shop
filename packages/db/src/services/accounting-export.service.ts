import { prisma } from '../client.js'

export interface ExportCommissionsOptions {
  startDate?: Date
  endDate?: Date
  affiliateId?: string
  status?: 'PENDING' | 'APPROVED' | 'PAID' | 'REVERSED'
}

export interface ExportPayoutsOptions {
  startDate?: Date
  endDate?: Date
  status?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
}

export interface ExportOrdersOptions {
  startDate?: Date
  endDate?: Date
  storeId?: string
  status?: 'PLACED' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELED'
}

export interface ExportTaxesOptions {
  startDate?: Date
  endDate?: Date
  storeId?: string
}

/**
 * Convert array of objects to CSV string
 */
function toCSV(data: Record<string, unknown>[]): string {
  if (data.length === 0) return ''

  const headers = Object.keys(data[0])
  const rows = data.map((row) =>
    headers.map((header) => {
      const value = row[header]
      if (value === null || value === undefined) return ''
      if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`
      return String(value)
    }).join(',')
  )

  return [headers.join(','), ...rows].join('\n')
}

/**
 * Streaming CSV generator for large datasets
 */
async function* streamToCSV<T>(
  dataGenerator: AsyncGenerator<T>,
  headers: string[],
  transform: (item: T) => Record<string, unknown>
): AsyncGenerator<string> {
  // Yield headers first
  yield headers.join(',') + '\n'
  
  // Stream data rows
  for await (const item of dataGenerator) {
    const row = transform(item)
    const csvRow = headers.map((header) => {
      const value = row[header]
      if (value === null || value === undefined) return ''
      if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`
      return String(value)
    }).join(',')
    
    yield csvRow + '\n'
  }
}

/**
 * Batch data fetcher with cursor-based pagination
 */
async function* batchFetchOrders(
  where: Record<string, unknown>,
  batchSize: number = 1000
): AsyncGenerator<any[]> {
  let cursor: string | undefined
  
  while (true) {
    const orders = await prisma.order.findMany({
      where: cursor ? { ...where, id: { gt: cursor } } : where,
      take: batchSize,
      orderBy: { id: 'asc' },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
        store: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
    })
    
    if (orders.length === 0) break
    
    yield orders
    
    if (orders.length < batchSize) break
    cursor = orders[orders.length - 1].id
  }
}

/**
 * Export affiliate commissions to CSV
 */
export async function exportCommissionsToCSV(
  options: ExportCommissionsOptions = {}
): Promise<string> {
  const where: Record<string, unknown> = {}

  if (options.affiliateId) {
    where.affiliateId = options.affiliateId
  }

  if (options.status) {
    where.status = options.status
  }

  if (options.startDate || options.endDate) {
    where.createdAt = {}
    if (options.startDate) {
      (where.createdAt as Record<string, unknown>).gte = options.startDate
    }
    if (options.endDate) {
      (where.createdAt as Record<string, unknown>).lte = options.endDate
    }
  }

  const commissions = await prisma.commission.findMany({
    where,
    include: {
      affiliate: {
        select: {
          id: true,
          referralCode: true,
          user: {
            select: {
              email: true,
              name: true,
            },
          },
        },
      },
      order: {
        select: {
          id: true,
          total: true,
          serviceFeeAmount: true,
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const csvData = commissions.map((c) => ({
    commission_id: c.id,
    affiliate_id: c.affiliateId,
    affiliate_code: c.affiliate.referralCode,
    affiliate_email: c.affiliate.user.email,
    affiliate_name: c.affiliate.user.name || '',
    order_id: c.orderId,
    order_total: Number(c.order.total),
    service_fee_base: Number(c.serviceFeeBase),
    commission_rate: Number(c.rate),
    commission_amount: Number(c.amount),
    status: c.status,
    approved_at: c.approvedAt?.toISOString() || '',
    paid_at: c.paidAt?.toISOString() || '',
    created_at: c.createdAt.toISOString(),
  }))

  return toCSV(csvData)
}

/**
 * Export affiliate payouts to CSV
 */
export async function exportPayoutsToCSV(
  options: ExportPayoutsOptions = {}
): Promise<string> {
  const where: Record<string, unknown> = {}

  if (options.status) {
    where.status = options.status
  }

  if (options.startDate || options.endDate) {
    where.periodEnd = {}
    if (options.startDate) {
      (where.periodEnd as Record<string, unknown>).gte = options.startDate
    }
    if (options.endDate) {
      (where.periodEnd as Record<string, unknown>).lte = options.endDate
    }
  }

  const payouts = await prisma.affiliatePayout.findMany({
    where,
    include: {
      affiliate: {
        select: {
          id: true,
          referralCode: true,
          user: {
            select: {
              email: true,
              name: true,
            },
          },
        },
      },
      _count: {
        select: {
          commissions: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const csvData = payouts.map((p) => ({
    payout_id: p.id,
    affiliate_id: p.affiliateId,
    affiliate_code: p.affiliate.referralCode,
    affiliate_email: p.affiliate.user.email,
    affiliate_name: p.affiliate.user.name || '',
    amount: Number(p.amount),
    method: p.method,
    status: p.status,
    commissions_count: p._count.commissions,
    period_start: p.periodStart.toISOString(),
    period_end: p.periodEnd.toISOString(),
    reference_id: p.referenceId || '',
    failure_reason: p.failureReason || '',
    paid_at: p.paidAt?.toISOString() || '',
    created_at: p.createdAt.toISOString(),
  }))

  return toCSV(csvData)
}

/**
 * Export orders with financial breakdown to CSV
 */
export async function exportOrdersToCSV(
  options: ExportOrdersOptions = {}
): Promise<string> {
  const where: Record<string, unknown> = {}

  if (options.storeId) {
    where.storeId = options.storeId
  }

  if (options.status) {
    where.status = options.status
  }

  if (options.startDate || options.endDate) {
    where.createdAt = {}
    if (options.startDate) {
      (where.createdAt as Record<string, unknown>).gte = options.startDate
    }
    if (options.endDate) {
      (where.createdAt as Record<string, unknown>).lte = options.endDate
    }
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      user: {
        select: {
          email: true,
          name: true,
        },
      },
      store: {
        select: {
          name: true,
          slug: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const csvData = orders.map((o) => ({
    order_id: o.id,
    store_name: o.store.name,
    store_slug: o.store.slug,
    customer_email: o.user.email,
    customer_name: o.user.name || '',
    status: o.status,
    payment_status: o.paymentStatus,
    delivery_type: o.deliveryType,
    subtotal: Number(o.subtotal),
    fees: Number(o.fees),
    tax: Number(o.tax),
    tip: Number(o.tip),
    total: Number(o.total),
    service_fee_percent: Number(o.serviceFeePercent),
    service_fee_amount: Number(o.serviceFeeAmount),
    net_to_vendor: Number(o.netToVendor),
    stripe_payment_intent_id: o.stripePaymentIntentId || '',
    stripe_transfer_id: o.stripeTransferId || '',
    created_at: o.createdAt.toISOString(),
  }))

  return toCSV(csvData)
}

/**
 * Stream orders export for large datasets (memory-efficient)
 */
export async function* streamOrdersToCSV(
  options: ExportOrdersOptions = {}
): AsyncGenerator<string> {
  const where: Record<string, unknown> = {}

  if (options.storeId) {
    where.storeId = options.storeId
  }

  if (options.status) {
    where.status = options.status
  }

  if (options.startDate || options.endDate) {
    where.createdAt = {}
    if (options.startDate) {
      (where.createdAt as Record<string, unknown>).gte = options.startDate
    }
    if (options.endDate) {
      (where.createdAt as Record<string, unknown>).lte = options.endDate
    }
  }

  const headers = [
    'order_id', 'store_name', 'store_slug', 'customer_email', 'customer_name',
    'status', 'payment_status', 'delivery_type', 'subtotal', 'fees', 'tax',
    'tip', 'total', 'service_fee_percent', 'service_fee_amount', 'net_to_vendor',
    'stripe_payment_intent_id', 'stripe_transfer_id', 'created_at'
  ]

  const transform = (order: any) => ({
    order_id: order.id,
    store_name: order.store.name,
    store_slug: order.store.slug,
    customer_email: order.user.email,
    customer_name: order.user.name || '',
    status: order.status,
    payment_status: order.paymentStatus,
    delivery_type: order.deliveryType,
    subtotal: Number(order.subtotal),
    fees: Number(order.fees),
    tax: Number(order.tax),
    tip: Number(order.tip),
    total: Number(order.total),
    service_fee_percent: Number(order.serviceFeePercent),
    service_fee_amount: Number(order.serviceFeeAmount),
    net_to_vendor: Number(order.netToVendor),
    stripe_payment_intent_id: order.stripePaymentIntentId || '',
    stripe_transfer_id: order.stripeTransferId || '',
    created_at: order.createdAt.toISOString(),
  })

  // Stream data in batches
  for await (const orders of batchFetchOrders(where)) {
    for (const order of orders) {
      yield* streamToCSV(
        (async function* () { yield order })(),
        headers,
        transform
      )
    }
  }
}

/**
 * Export tax summary by store to CSV
 */
export async function exportTaxSummaryToCSV(
  options: ExportTaxesOptions = {}
): Promise<string> {
  const where: Record<string, unknown> = {}

  if (options.storeId) {
    where.storeId = options.storeId
  }

  if (options.startDate || options.endDate) {
    where.createdAt = {}
    if (options.startDate) {
      (where.createdAt as Record<string, unknown>).gte = options.startDate
    }
    if (options.endDate) {
      (where.createdAt as Record<string, unknown>).lte = options.endDate
    }
  }

  const orders = await prisma.order.findMany({
    where,
    select: {
      id: true,
      storeId: true,
      store: {
        select: {
          name: true,
          slug: true,
          taxId: true,
        },
      },
      subtotal: true,
      tax: true,
      total: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  // Single-pass grouping AND aggregation
  const storeGroups = new Map<string, {
    orders: typeof orders,
    totalSubtotal: number,
    totalTax: number,
    totalSales: number,
    storeName: string,
    storeSlug: string,
    taxId: string | null
  }>()

  for (const order of orders) {
    const existing = storeGroups.get(order.storeId)
    if (existing) {
      existing.orders.push(order)
      existing.totalSubtotal += Number(order.subtotal)
      existing.totalTax += Number(order.tax)
      existing.totalSales += Number(order.total)
    } else {
      storeGroups.set(order.storeId, {
        orders: [order],
        totalSubtotal: Number(order.subtotal),
        totalTax: Number(order.tax),
        totalSales: Number(order.total),
        storeName: order.store.name,
        storeSlug: order.store.slug,
        taxId: order.store.taxId
      })
    }
  }

  const csvData: Record<string, unknown>[] = []
  
  for (const [storeId, group] of storeGroups) {
    csvData.push({
      store_id: storeId,
      store_name: group.storeName,
      store_slug: group.storeSlug,
      tax_id: group.taxId || '',
      order_count: group.orders.length,
      total_subtotal: group.totalSubtotal.toFixed(2),
      total_tax: group.totalTax.toFixed(2),
      total_sales: group.totalSales.toFixed(2),
    })
  }

  return toCSV(csvData)
}

/**
 * Export service fees summary to CSV
 */
export async function exportServiceFeesToCSV(
  startDate?: Date,
  endDate?: Date
): Promise<string> {
  const where: Record<string, unknown> = {}

  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) {
      (where.createdAt as Record<string, unknown>).gte = startDate
    }
    if (endDate) {
      (where.createdAt as Record<string, unknown>).lte = endDate
    }
  }

  const orders = await prisma.order.findMany({
    where,
    select: {
      id: true,
      storeId: true,
      store: {
        select: {
          name: true,
          slug: true,
        },
      },
      serviceFeePercent: true,
      serviceFeeAmount: true,
      total: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  const csvData = orders.map((o) => ({
    order_id: o.id,
    store_name: o.store.name,
    store_slug: o.store.slug,
    order_total: Number(o.total),
    service_fee_percent: Number(o.serviceFeePercent),
    service_fee_amount: Number(o.serviceFeeAmount),
    created_at: o.createdAt.toISOString(),
  }))

  return toCSV(csvData)
}

/**
 * Export complete financial summary (all fees breakdown)
 */
export async function exportFinancialSummaryToCSV(
  startDate?: Date,
  endDate?: Date
): Promise<string> {
  const where: Record<string, unknown> = {}

  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) {
      (where.createdAt as Record<string, unknown>).gte = startDate
    }
    if (endDate) {
      (where.createdAt as Record<string, unknown>).lte = endDate
    }
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      store: {
        select: {
          name: true,
          slug: true,
          referredByAffiliateId: true,
        },
      },
      commissions: {
        select: {
          amount: true,
          affiliateId: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const csvData = orders.map((o) => ({
    order_id: o.id,
    store_name: o.store.name,
    store_slug: o.store.slug,
    order_date: o.createdAt.toISOString(),
    subtotal: Number(o.subtotal),
    tax: Number(o.tax),
    fees: Number(o.fees),
    tip: Number(o.tip),
    total: Number(o.total),
    service_fee_percent: Number(o.serviceFeePercent),
    service_fee_amount: Number(o.serviceFeeAmount),
    net_to_vendor: Number(o.netToVendor),
    affiliate_commission: o.commissions.reduce((sum, c) => sum + Number(c.amount), 0),
    has_affiliate: o.store.referredByAffiliateId ? 'YES' : 'NO',
    payment_status: o.paymentStatus,
    stripe_payment_intent: o.stripePaymentIntentId || '',
    stripe_transfer: o.stripeTransferId || '',
  }))

  return toCSV(csvData)
}

/**
 * Export vendor payout summary
 */
export async function exportVendorPayoutsToCSV(
  startDate?: Date,
  endDate?: Date
): Promise<string> {
  const where: Record<string, unknown> = {}

  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) {
      (where.createdAt as Record<string, unknown>).gte = startDate
    }
    if (endDate) {
      (where.createdAt as Record<string, unknown>).lte = endDate
    }
  }

  // Get all completed orders with transfer info
  const orders = await prisma.order.findMany({
    where: {
      ...where,
      paymentStatus: 'PAID',
      stripeTransferId: { not: null },
    },
    include: {
      store: {
        select: {
          id: true,
          name: true,
          slug: true,
          ownerUserId: true,
          owner: {
            select: {
              email: true,
              name: true,
            },
          },
          stripeAccountId: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Single-pass grouping AND aggregation
  const storePayouts = new Map<string, {
    orders: typeof orders,
    totalPaidOut: number,
    storeName: string,
    storeSlug: string,
    ownerEmail: string,
    ownerName: string,
    stripeAccountId: string | null
  }>()

  for (const order of orders) {
    const existing = storePayouts.get(order.storeId)
    if (existing) {
      existing.orders.push(order)
      existing.totalPaidOut += Number(order.netToVendor)
    } else {
      storePayouts.set(order.storeId, {
        orders: [order],
        totalPaidOut: Number(order.netToVendor),
        storeName: order.store.name,
        storeSlug: order.store.slug,
        ownerEmail: order.store.owner.email,
        ownerName: order.store.owner.name || '',
        stripeAccountId: order.store.stripeAccountId
      })
    }
  }

  const csvData: Record<string, unknown>[] = []

  for (const [storeId, group] of storePayouts) {
    csvData.push({
      store_id: storeId,
      store_name: group.storeName,
      store_slug: group.storeSlug,
      owner_email: group.ownerEmail,
      owner_name: group.ownerName,
      stripe_account_id: group.stripeAccountId || '',
      order_count: group.orders.length,
      total_paid_out: group.totalPaidOut.toFixed(2),
    })
  }

  return toCSV(csvData)
}

