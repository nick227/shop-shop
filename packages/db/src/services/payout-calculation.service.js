import Decimal from 'decimal.js';
export const PAYABLE_ORDER_STATUSES = ['DELIVERED', 'COMPLETED'];
export function isPayableOrder(input) {
    return (PAYABLE_ORDER_STATUSES.includes(input.status) &&
        input.paymentStatus === 'PAID');
}
export function decimalToCents(value) {
    // Prisma Decimal and decimal.js both stringify cleanly.
    const d = new Decimal(String(value));
    return d.mul(100).toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber();
}
export function snapshotOrderForPayout(order) {
    const grossSalesCents = decimalToCents(order.subtotal);
    const platformFeesCents = decimalToCents(order.serviceFeeAmount);
    const tipsCents = decimalToCents(order.tip);
    const processorFeesCents = 0;
    const discountsCents = 0;
    const refundsCents = 0;
    // v1: use `netToVendor` (already computed in the order) plus tips.
    // This remains consistent with the payout waterfall where tips are added back.
    const netContributionCents = decimalToCents(order.netToVendor) + tipsCents;
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
    };
}
export function computePayoutBreakdownCents(input) {
    const adjustmentsCents = input.adjustments?.reduce((sum, a) => sum + (a.type === 'CREDIT' ? a.amountCents : -a.amountCents), 0) ?? 0;
    const totals = input.orders.reduce((acc, o) => ({
        grossSalesCents: acc.grossSalesCents + o.grossSalesCents,
        discountsCents: acc.discountsCents + o.discountsCents,
        refundsCents: acc.refundsCents + o.refundsCents,
        tipsCents: acc.tipsCents + o.tipsCents,
        platformFeesCents: acc.platformFeesCents + o.platformFeesCents,
        processorFeesCents: acc.processorFeesCents + o.processorFeesCents,
        netContributionCents: acc.netContributionCents + o.netContributionCents,
    }), {
        grossSalesCents: 0,
        discountsCents: 0,
        refundsCents: 0,
        tipsCents: 0,
        platformFeesCents: 0,
        processorFeesCents: 0,
        netContributionCents: 0,
    });
    return {
        grossSalesCents: totals.grossSalesCents,
        discountsCents: totals.discountsCents,
        refundsCents: totals.refundsCents,
        tipsCents: totals.tipsCents,
        platformFeesCents: totals.platformFeesCents,
        processorFeesCents: totals.processorFeesCents,
        adjustmentsCents,
        netPayoutCents: totals.netContributionCents + adjustmentsCents,
    };
}
export function isInUtcPeriodInclusiveExclusive(input) {
    return input.at.getTime() >= input.periodStart.getTime() && input.at.getTime() < input.periodEnd.getTime();
}
