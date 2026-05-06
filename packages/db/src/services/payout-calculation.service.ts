import Decimal from 'decimal.js'

export const PAYABLE_ORDER_STATUSES = ['DELIVERED', 'COMPLETED'] as const

export type PayableOrderStatus = typeof PAYABLE_ORDER_STATUSES[number]

export function isPayableOrder(input: {
  readonly status: string
  readonly paymentStatus?: string | null
}): boolean {
  return (
    (PAYABLE_ORDER_STATUSES as readonly string[]).includes(input.status) &&
    input.paymentStatus === 'PAID'
  )
}

export function decimalToCents(value: unknown): number {
  // Prisma Decimal and decimal.js both stringify cleanly.
  const d = new Decimal(String(value))
  return d.mul(100).toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber()
}

export type OrderSnapshotForPayout = {
  readonly id: string
  readonly createdAt: Date
  readonly status: string
  readonly paymentStatus: string
  readonly subtotal: unknown
  readonly serviceFeeAmount: unknown
  readonly tip: unknown
  readonly netToVendor: unknown
}

export type PayoutOrderSnapshotCents = {
  readonly orderId: string
  readonly orderCreatedAt: Date
  readonly orderStatus: string
  readonly paymentStatus: string
  readonly grossSalesCents: number
  readonly discountsCents: number
  readonly refundsCents: number
  readonly tipsCents: number
  readonly platformFeesCents: number
  readonly processorFeesCents: number
  readonly netContributionCents: number
}

export function snapshotOrderForPayout(order: OrderSnapshotForPayout): PayoutOrderSnapshotCents {
  const grossSalesCents = decimalToCents(order.subtotal)
  const platformFeesCents = decimalToCents(order.serviceFeeAmount)
  const tipsCents = decimalToCents(order.tip)
  const processorFeesCents = 0
  const discountsCents = 0
  const refundsCents = 0

  // v1: use `netToVendor` (already computed in the order) plus tips.
  // This remains consistent with the payout waterfall where tips are added back.
  const netContributionCents = decimalToCents(order.netToVendor) + tipsCents

  return {
    orderId: order.id,
    orderCreatedAt: order.createdAt,
    orderStatus: order.status,
    paymentStatus: order.paymentStatus,
    grossSalesCents,
    discountsCents,
    refundsCents,
    tipsCents,
    platformFeesCents,
    processorFeesCents,
    netContributionCents,
  }
}

export type PayoutAdjustmentSnapshot = {
  readonly type: 'CREDIT' | 'DEBIT'
  readonly amountCents: number
}

export type PayoutBreakdownCents = {
  readonly grossSalesCents: number
  readonly discountsCents: number
  readonly refundsCents: number
  readonly tipsCents: number
  readonly platformFeesCents: number
  readonly processorFeesCents: number
  readonly adjustmentsCents: number
  readonly netPayoutCents: number
}

export function computePayoutBreakdownCents(input: {
  readonly orders: readonly PayoutOrderSnapshotCents[]
  readonly adjustments?: readonly PayoutAdjustmentSnapshot[]
}): PayoutBreakdownCents {
  const adjustmentsCents =
    input.adjustments?.reduce(
      (sum, a) => sum + (a.type === 'CREDIT' ? a.amountCents : -a.amountCents),
      0,
    ) ?? 0

  const totals = input.orders.reduce(
    (acc, o) => ({
      grossSalesCents: acc.grossSalesCents + o.grossSalesCents,
      discountsCents: acc.discountsCents + o.discountsCents,
      refundsCents: acc.refundsCents + o.refundsCents,
      tipsCents: acc.tipsCents + o.tipsCents,
      platformFeesCents: acc.platformFeesCents + o.platformFeesCents,
      processorFeesCents: acc.processorFeesCents + o.processorFeesCents,
      netContributionCents: acc.netContributionCents + o.netContributionCents,
    }),
    {
      grossSalesCents: 0,
      discountsCents: 0,
      refundsCents: 0,
      tipsCents: 0,
      platformFeesCents: 0,
      processorFeesCents: 0,
      netContributionCents: 0,
    },
  )

  return {
    grossSalesCents: totals.grossSalesCents,
    discountsCents: totals.discountsCents,
    refundsCents: totals.refundsCents,
    tipsCents: totals.tipsCents,
    platformFeesCents: totals.platformFeesCents,
    processorFeesCents: totals.processorFeesCents,
    adjustmentsCents,
    netPayoutCents: totals.netContributionCents + adjustmentsCents,
  }
}

export function isInUtcPeriodInclusiveExclusive(input: {
  readonly at: Date
  readonly periodStart: Date
  readonly periodEnd: Date
}): boolean {
  return input.at.getTime() >= input.periodStart.getTime() && input.at.getTime() < input.periodEnd.getTime()
}

