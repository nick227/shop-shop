export declare const PAYABLE_ORDER_STATUSES: readonly ["DELIVERED", "COMPLETED"];
export type PayableOrderStatus = typeof PAYABLE_ORDER_STATUSES[number];
export declare function isPayableOrder(input: {
    readonly status: string;
    readonly paymentStatus?: string | null;
}): boolean;
export declare function decimalToCents(value: unknown): number;
export type OrderSnapshotForPayout = {
    readonly id: string;
    readonly createdAt: Date;
    readonly status: string;
    readonly paymentStatus: string;
    readonly subtotal: unknown;
    readonly serviceFeeAmount: unknown;
    readonly tip: unknown;
    readonly netToVendor: unknown;
};
export type PayoutOrderSnapshotCents = {
    readonly orderId: string;
    readonly orderCreatedAt: Date;
    readonly orderStatus: string;
    readonly paymentStatus: string;
    readonly grossSalesCents: number;
    readonly discountsCents: number;
    readonly refundsCents: number;
    readonly tipsCents: number;
    readonly platformFeesCents: number;
    readonly processorFeesCents: number;
    readonly netContributionCents: number;
};
export declare function snapshotOrderForPayout(order: OrderSnapshotForPayout): PayoutOrderSnapshotCents;
export type PayoutAdjustmentSnapshot = {
    readonly type: 'CREDIT' | 'DEBIT';
    readonly amountCents: number;
};
export type PayoutBreakdownCents = {
    readonly grossSalesCents: number;
    readonly discountsCents: number;
    readonly refundsCents: number;
    readonly tipsCents: number;
    readonly platformFeesCents: number;
    readonly processorFeesCents: number;
    readonly adjustmentsCents: number;
    readonly netPayoutCents: number;
};
export declare function computePayoutBreakdownCents(input: {
    readonly orders: readonly PayoutOrderSnapshotCents[];
    readonly adjustments?: readonly PayoutAdjustmentSnapshot[];
}): PayoutBreakdownCents;
export declare function isInUtcPeriodInclusiveExclusive(input: {
    readonly at: Date;
    readonly periodStart: Date;
    readonly periodEnd: Date;
}): boolean;
//# sourceMappingURL=payout-calculation.service.d.ts.map