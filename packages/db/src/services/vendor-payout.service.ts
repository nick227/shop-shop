import { prisma } from '../client'
import {
  computePayoutBreakdownCents,
  decimalToCents,
  isInUtcPeriodInclusiveExclusive,
  isPayableOrder,
  snapshotOrderForPayout,
} from './payout-calculation.service.js'

export interface ProcessVendorPayoutInput {
  storeId: string
  periodStart: Date
  periodEnd: Date
}

export interface VendorPayoutSummary {
  storeId: string
  storeName: string
  stripeAccountId: string | null
  orderCount: number
  grossSalesCents: number
  platformFeesCents: number
  tipsCents: number
  netPayoutCents: number
  isOnboarded: boolean
  canPayout: boolean
}

export interface PayoutResult {
  currency: string
  status: string
  payoutId: string
  netPayoutCents: number
  orderCount: number
}

/**
 * Get payout summary for a store for a given period
 */
export async function getVendorPayoutSummary(
  storeId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<VendorPayoutSummary> {
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: {
      id: true,
      name: true,
      stripeAccountId: true,
      stripeOnboarded: true,
    },
  })

  if (!store) {
    throw new Error('Store not found')
  }

  const orders = await prisma.order.findMany({
    where: {
      storeId,
      payoutOrder: { is: null },
      createdAt: { gte: periodStart, lt: periodEnd },
      paymentStatus: 'PAID',
      status: { in: ['DELIVERED', 'COMPLETED'] },
    },
    select: {
      id: true,
      createdAt: true,
      status: true,
      paymentStatus: true,
      subtotal: true,
      serviceFeeAmount: true,
      tip: true,
      netToVendor: true,
    },
  })

  const payableSnapshots = orders
    .filter((o) => isPayableOrder({ status: o.status, paymentStatus: o.paymentStatus }))
    .filter((o) => isInUtcPeriodInclusiveExclusive({ at: o.createdAt, periodStart, periodEnd }))
    .map(snapshotOrderForPayout)

  const breakdown = computePayoutBreakdownCents({ orders: payableSnapshots })

  return {
    storeId: store.id,
    storeName: store.name,
    stripeAccountId: store.stripeAccountId,
    orderCount: payableSnapshots.length,
    grossSalesCents: breakdown.grossSalesCents,
    platformFeesCents: breakdown.platformFeesCents,
    tipsCents: breakdown.tipsCents,
    netPayoutCents: breakdown.netPayoutCents,
    isOnboarded: store.stripeOnboarded,
    canPayout: payableSnapshots.length > 0,
  }
}

/**
 * Process payout to vendor for a given period
 */
export async function processVendorPayout(
  input: ProcessVendorPayoutInput
): Promise<PayoutResult> {
  const store = await prisma.store.findUnique({
    where: { id: input.storeId },
    select: { id: true, ownerUserId: true },
  })
  if (!store) throw new Error('Store not found')

  const orders = await prisma.order.findMany({
    where: {
      storeId: input.storeId,
      payoutOrder: { is: null },
      createdAt: { gte: input.periodStart, lt: input.periodEnd },
      paymentStatus: 'PAID',
      status: { in: ['DELIVERED', 'COMPLETED'] },
    },
    select: {
      id: true,
      createdAt: true,
      status: true,
      paymentStatus: true,
      subtotal: true,
      serviceFeeAmount: true,
      tip: true,
      netToVendor: true,
    },
    orderBy: { createdAt: 'asc' },
  })

  const payableSnapshots = orders
    .filter((o) => isPayableOrder({ status: o.status, paymentStatus: o.paymentStatus }))
    .filter((o) =>
      isInUtcPeriodInclusiveExclusive({ at: o.createdAt, periodStart: input.periodStart, periodEnd: input.periodEnd }),
    )
    .map(snapshotOrderForPayout)

  if (payableSnapshots.length === 0) {
    throw new Error('No orders to payout')
  }

  const breakdown = computePayoutBreakdownCents({ orders: payableSnapshots })

  const payout = await prisma.$transaction(async (tx) => {
    const created = await tx.payout.create({
      data: {
        vendorUserId: store.ownerUserId,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        status: 'PENDING',
        grossSalesCents: breakdown.grossSalesCents,
        discountsCents: breakdown.discountsCents,
        refundsCents: breakdown.refundsCents,
        tipsCents: breakdown.tipsCents,
        platformFeesCents: breakdown.platformFeesCents,
        processorFeesCents: breakdown.processorFeesCents,
        netPayoutCents: breakdown.netPayoutCents,
        currency: 'USD',
        orders: {
          create: payableSnapshots.map((s) => ({
            order: { connect: { id: s.orderId } },
            orderCreatedAt: s.orderCreatedAt,
            orderStatus: s.orderStatus as never,
            paymentStatus: s.paymentStatus as never,
            grossSalesCents: s.grossSalesCents,
            discountsCents: s.discountsCents,
            refundsCents: s.refundsCents,
            tipsCents: s.tipsCents,
            platformFeesCents: s.platformFeesCents,
            processorFeesCents: s.processorFeesCents,
            netContributionCents: s.netContributionCents,
          })),
        },
      },
      select: { id: true, status: true, currency: true, netPayoutCents: true, orders: { select: { id: true } } },
    })

    return created
  })

  return {
    payoutId: payout.id,
    currency: payout.currency,
    status: payout.status,
    netPayoutCents: payout.netPayoutCents,
    orderCount: payout.orders.length,
  }
}

/**
 * Get all stores eligible for payout (optimized batch query)
 */
export async function getStoresReadyForPayout(
  periodStart: Date,
  periodEnd: Date
): Promise<VendorPayoutSummary[]> {
  const storeData = await prisma.store.findMany({
    where: {
      orders: {
        some: {
          payoutOrder: { is: null },
          paymentStatus: 'PAID',
          status: { in: ['DELIVERED', 'COMPLETED'] },
          createdAt: { gte: periodStart, lt: periodEnd },
        },
      },
    },
    select: {
      id: true,
      name: true,
      stripeAccountId: true,
      stripeOnboarded: true,
    },
  })

  if (storeData.length === 0) {
    return []
  }

  const storeIds = storeData.map(s => s.id)

  // Batch aggregation for all stores at once
  const [orderCounts, orderAggregates] = await Promise.all([
    prisma.order.groupBy({
      by: ['storeId'],
      where: {
        storeId: { in: storeIds },
        payoutOrder: { is: null },
        paymentStatus: 'PAID',
        status: { in: ['DELIVERED', 'COMPLETED'] },
        createdAt: { gte: periodStart, lt: periodEnd },
      },
      _count: { id: true },
    }),
    prisma.order.groupBy({
      by: ['storeId'],
      where: {
        storeId: { in: storeIds },
        payoutOrder: { is: null },
        paymentStatus: 'PAID',
        status: { in: ['DELIVERED', 'COMPLETED'] },
        createdAt: { gte: periodStart, lt: periodEnd },
      },
      _sum: {
        subtotal: true,
        serviceFeeAmount: true,
        netToVendor: true,
        tip: true,
      },
    }),
  ])

  // Create lookup maps for O(1) access
  const countMap = new Map(orderCounts.map(c => [c.storeId, c._count.id]))
  const aggregateMap = new Map(orderAggregates.map(a => [a.storeId, a._sum]))

  // Build summaries in single pass
  const summaries: VendorPayoutSummary[] = []
  
  for (const store of storeData) {
    const orderCount = countMap.get(store.id) || 0
    const aggregates = aggregateMap.get(store.id)
    
    if (orderCount > 0 && aggregates) {
      const grossSalesCents = decimalToCents(aggregates.subtotal || 0)
      const platformFeesCents = decimalToCents(aggregates.serviceFeeAmount || 0)
      const tipsCents = decimalToCents(aggregates.tip || 0)
      const netPayoutCents = decimalToCents(aggregates.netToVendor || 0) + tipsCents

      summaries.push({
        storeId: store.id,
        storeName: store.name,
        stripeAccountId: store.stripeAccountId,
        orderCount,
        grossSalesCents,
        platformFeesCents,
        tipsCents,
        netPayoutCents,
        isOnboarded: store.stripeOnboarded,
        canPayout: orderCount > 0,
      })
    }
  }

  return summaries
}

/**
 * Process payouts for all eligible stores (batch operation)
 */
export async function processAllVendorPayouts(
  periodStart: Date,
  periodEnd: Date
): Promise<{ success: PayoutResult[]; failed: Array<{ storeId: string; error: string }> }> {
  const eligible = await getStoresReadyForPayout(periodStart, periodEnd)

  const results = await Promise.allSettled(
    eligible.map((summary) =>
      processVendorPayout({
        storeId: summary.storeId,
        periodStart,
        periodEnd,
      })
    )
  )

  const success: PayoutResult[] = []
  const failed: Array<{ storeId: string; error: string }> = []

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      success.push(result.value)
    } else {
      failed.push({
        storeId: eligible[index].storeId,
        error: result.reason?.message || 'Unknown error',
      })
    }
  })

  return { success, failed }
}

/**
 * Get payout history for a store
 */
export async function getVendorPayoutHistory(
  storeId: string,
  options?: {
    limit?: number
    offset?: number
  }
) {
  const payouts = await prisma.payout.findMany({
    where: {
      orders: {
        some: {
          order: { storeId },
        },
      },
    },
    select: {
      id: true,
      status: true,
      currency: true,
      periodStart: true,
      periodEnd: true,
      netPayoutCents: true,
      createdAt: true,
      completedAt: true,
      orders: {
        where: { order: { storeId } },
        select: { id: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: options?.limit || 100,
    skip: options?.offset || 0,
  })

  return {
    payouts: payouts.map((p) => ({
      payoutId: p.id,
      status: p.status,
      currency: p.currency,
      periodStart: p.periodStart,
      periodEnd: p.periodEnd,
      netPayoutCents: p.netPayoutCents,
      orderCount: p.orders.length,
      createdAt: p.createdAt,
      completedAt: p.completedAt,
    })),
    total: payouts.length,
  }
}

/**
 * Get pending payout amount for a store
 */
export async function getPendingPayoutAmount(storeId: string): Promise<number> {
  const result = await prisma.order.aggregate({
    where: {
      storeId,
      payoutOrder: { is: null },
      paymentStatus: 'PAID',
      status: { in: ['DELIVERED', 'COMPLETED'] },
    },
    _sum: {
      netToVendor: true,
      tip: true,
    },
  })

  const netToVendorCents = decimalToCents(result._sum.netToVendor || 0)
  const tipsCents = decimalToCents(result._sum.tip || 0)
  return netToVendorCents + tipsCents
}

export async function updateVendorPayoutStatus(input: {
  payoutId: string
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  failureReason?: string
}) {
  return prisma.$transaction(async (tx) => {
    const current = await tx.payout.findUnique({
      where: { id: input.payoutId },
      select: { id: true, status: true },
    })
    if (!current) throw new Error('Payout not found')

    if (current.status === 'COMPLETED') {
      throw new Error('Completed payouts are immutable')
    }

    if (input.status === 'FAILED') {
      // Release orders so they can be included in a future (non-failed) payout.
      await tx.payoutOrder.deleteMany({ where: { payoutId: input.payoutId } })
    }

    const now = new Date()
    return tx.payout.update({
      where: { id: input.payoutId },
      data: {
        status: input.status,
        completedAt: input.status === 'COMPLETED' ? now : undefined,
        failedAt: input.status === 'FAILED' ? now : undefined,
        failureReason: input.status === 'FAILED' ? input.failureReason ?? null : null,
      },
    })
  })
}

export async function getVendorPayoutDetailForStore(input: {
  payoutId: string
  storeId: string
}) {
  const payout = await prisma.payout.findFirst({
    where: {
      id: input.payoutId,
      orders: { some: { order: { storeId: input.storeId } } },
    },
    select: {
      id: true,
      vendorUserId: true,
      status: true,
      currency: true,
      periodStart: true,
      periodEnd: true,
      grossSalesCents: true,
      discountsCents: true,
      refundsCents: true,
      tipsCents: true,
      platformFeesCents: true,
      processorFeesCents: true,
      netPayoutCents: true,
      createdAt: true,
      completedAt: true,
      failedAt: true,
      failureReason: true,
      orders: {
        where: { order: { storeId: input.storeId } },
        select: {
          orderId: true,
          orderCreatedAt: true,
          orderStatus: true,
          paymentStatus: true,
          grossSalesCents: true,
          discountsCents: true,
          refundsCents: true,
          tipsCents: true,
          platformFeesCents: true,
          processorFeesCents: true,
          netContributionCents: true,
        },
        orderBy: { orderCreatedAt: 'asc' },
      },
      adjustments: {
        select: { id: true, type: true, amountCents: true, reason: true, note: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!payout) throw new Error('Payout not found')
  return payout
}

export async function createPayoutAdjustment(input: {
  payoutId: string
  type: 'CREDIT' | 'DEBIT'
  amountCents: number
  reason: string
  note?: string
  createdByUserId?: string
}) {
  const payout = await prisma.payout.findUnique({
    where: { id: input.payoutId },
    select: { id: true, status: true },
  })
  if (!payout) throw new Error('Payout not found')
  if (payout.status === 'COMPLETED') {
    throw new Error('Completed payouts are immutable')
  }

  return prisma.payoutAdjustment.create({
    data: {
      payoutId: input.payoutId,
      type: input.type,
      amountCents: input.amountCents,
      reason: input.reason,
      note: input.note,
      createdByUserId: input.createdByUserId,
    },
  })
}

