import { prisma } from '../client'
import { Decimal } from 'decimal.js'

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
  totalRevenue: number
  serviceFees: number
  netPayout: number
  isOnboarded: boolean
  canPayout: boolean
}

export interface PayoutResult {
  transferId: string
  amount: number
  currency: string
  status: string
  ordersUpdated: number
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

  const [orderCount, aggregates] = await Promise.all([
    prisma.order.count({
      where: {
        storeId,
        paymentStatus: 'PAID',
        createdAt: {
          gte: periodStart,
          lte: periodEnd,
        },
        stripeTransferId: null, // Not yet paid out
      },
    }),
    prisma.order.aggregate({
      where: {
        storeId,
        paymentStatus: 'PAID',
        createdAt: {
          gte: periodStart,
          lte: periodEnd,
        },
        stripeTransferId: null, // Not yet paid out
      },
      _sum: {
        total: true,
        serviceFeeAmount: true,
        netToVendor: true,
      },
    }),
  ])

  const totalRevenue = Number(aggregates._sum.total || 0)
  const serviceFees = Number(aggregates._sum.serviceFeeAmount || 0)
  const netPayout = Number(aggregates._sum.netToVendor || 0)

  return {
    storeId: store.id,
    storeName: store.name,
    stripeAccountId: store.stripeAccountId,
    orderCount,
    totalRevenue,
    serviceFees,
    netPayout,
    isOnboarded: store.stripeOnboarded,
    canPayout: Boolean(store.stripeAccountId && store.stripeOnboarded && orderCount > 0),
  }
}

/**
 * Process payout to vendor for a given period
 */
export async function processVendorPayout(
  input: ProcessVendorPayoutInput
): Promise<PayoutResult> {
  const summary = await getVendorPayoutSummary(
    input.storeId,
    input.periodStart,
    input.periodEnd
  )

  if (!summary.canPayout) {
    throw new Error(
      !summary.stripeAccountId
        ? 'Store has no Stripe account'
        : !summary.isOnboarded
        ? 'Store Stripe account not fully onboarded'
        : 'No orders to payout'
    )
  }

  if (summary.netPayout <= 0) {
    throw new Error('Net payout amount must be positive')
  }

  // Get first order's charge ID for transfer source
  const firstOrder = await prisma.order.findFirst({
    where: {
      storeId: input.storeId,
      paymentStatus: 'PAID',
      createdAt: {
        gte: input.periodStart,
        lte: input.periodEnd,
      },
      stripeTransferId: null,
      stripeChargeId: { not: null },
    },
    select: { stripeChargeId: true },
  })

  if (!firstOrder?.stripeChargeId) {
    throw new Error('No charge ID found for transfer')
  }

  // Create Stripe transfer using the payments adapter
  const { createTransfer } = await import('../adapters/payments.adapter')
  const transfer = await createTransfer({
    amount: new Decimal(summary.netPayout),
    destination: summary.stripeAccountId!,
    sourceTransaction: firstOrder.stripeChargeId,
    orderId: input.storeId, // Using storeId as metadata
  })

  // Get all unpaid orders for this period
  const orders = await prisma.order.findMany({
    where: {
      storeId: input.storeId,
      paymentStatus: 'PAID',
      createdAt: {
        gte: input.periodStart,
        lte: input.periodEnd,
      },
      stripeTransferId: null,
    },
    select: { id: true },
  })

  // Update all orders with transfer ID
  await prisma.order.updateMany({
    where: {
      id: { in: orders.map((o) => o.id) },
    },
    data: {
      stripeTransferId: transfer.transferId,
    },
  })

  return {
    transferId: transfer.transferId,
    amount: transfer.amount,
    currency: 'usd',
    status: transfer.status,
    ordersUpdated: orders.length,
  }
}

/**
 * Get all stores eligible for payout (optimized batch query)
 */
export async function getStoresReadyForPayout(
  periodStart: Date,
  periodEnd: Date
): Promise<VendorPayoutSummary[]> {
  // Single batch query with aggregations
  const storeData = await prisma.store.findMany({
    where: {
      stripeAccountId: { not: null },
      stripeOnboarded: true,
      orders: {
        some: {
          paymentStatus: 'PAID',
          stripeTransferId: null,
          createdAt: {
            gte: periodStart,
            lte: periodEnd,
          },
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
        paymentStatus: 'PAID',
        createdAt: { gte: periodStart, lte: periodEnd },
        stripeTransferId: null,
      },
      _count: { id: true },
    }),
    prisma.order.groupBy({
      by: ['storeId'],
      where: {
        storeId: { in: storeIds },
        paymentStatus: 'PAID',
        createdAt: { gte: periodStart, lte: periodEnd },
        stripeTransferId: null,
      },
      _sum: {
        total: true,
        serviceFeeAmount: true,
        netToVendor: true,
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
      const totalRevenue = Number(aggregates.total || 0)
      const serviceFees = Number(aggregates.serviceFeeAmount || 0)
      const netPayout = Number(aggregates.netToVendor || 0)

      summaries.push({
        storeId: store.id,
        storeName: store.name,
        stripeAccountId: store.stripeAccountId,
        orderCount,
        totalRevenue,
        serviceFees,
        netPayout,
        isOnboarded: store.stripeOnboarded,
        canPayout: Boolean(store.stripeAccountId && store.stripeOnboarded && orderCount > 0),
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
  const orders = await prisma.order.findMany({
    where: {
      storeId,
      paymentStatus: 'PAID',
      stripeTransferId: { not: null },
    },
    select: {
      stripeTransferId: true,
      netToVendor: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: options?.limit || 100,
    skip: options?.offset || 0,
  })

  // Group by transfer ID
  const transferGroups = new Map<string, typeof orders>()
  for (const order of orders) {
    if (order.stripeTransferId) {
      if (!transferGroups.has(order.stripeTransferId)) {
        transferGroups.set(order.stripeTransferId, [])
      }
      transferGroups.get(order.stripeTransferId)!.push(order)
    }
  }

  const payouts = Array.from(transferGroups.entries()).map(([transferId, transferOrders]) => ({
    transferId,
    orderCount: transferOrders.length,
    totalAmount: transferOrders.reduce((sum, o) => sum + Number(o.netToVendor), 0),
    date: transferOrders[0].createdAt,
  }))

  return {
    payouts,
    total: transferGroups.size,
  }
}

/**
 * Get pending payout amount for a store
 */
export async function getPendingPayoutAmount(storeId: string): Promise<number> {
  const result = await prisma.order.aggregate({
    where: {
      storeId,
      paymentStatus: 'PAID',
      stripeTransferId: null,
    },
    _sum: {
      netToVendor: true,
    },
  })

  return Number(result._sum.netToVendor || 0)
}

