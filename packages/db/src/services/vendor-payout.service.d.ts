export interface ProcessVendorPayoutInput {
    storeId: string;
    periodStart: Date;
    periodEnd: Date;
}
export interface VendorPayoutSummary {
    storeId: string;
    storeName: string;
    stripeAccountId: string | null;
    orderCount: number;
    grossSalesCents: number;
    platformFeesCents: number;
    tipsCents: number;
    netPayoutCents: number;
    isOnboarded: boolean;
    canPayout: boolean;
}
export interface PayoutResult {
    currency: string;
    status: string;
    payoutId: string;
    netPayoutCents: number;
    orderCount: number;
}
/**
 * Get payout summary for a store for a given period
 */
export declare function getVendorPayoutSummary(storeId: string, periodStart: Date, periodEnd: Date): Promise<VendorPayoutSummary>;
/**
 * Process payout to vendor for a given period
 */
export declare function processVendorPayout(input: ProcessVendorPayoutInput): Promise<PayoutResult>;
/**
 * Get all stores eligible for payout (optimized batch query)
 */
export declare function getStoresReadyForPayout(periodStart: Date, periodEnd: Date): Promise<VendorPayoutSummary[]>;
/**
 * Process payouts for all eligible stores (batch operation)
 */
export declare function processAllVendorPayouts(periodStart: Date, periodEnd: Date): Promise<{
    success: PayoutResult[];
    failed: Array<{
        storeId: string;
        error: string;
    }>;
}>;
/**
 * Get payout history for a store
 */
export declare function getVendorPayoutHistory(storeId: string, options?: {
    limit?: number;
    offset?: number;
}): Promise<{
    payouts: {
        payoutId: string;
        status: import("@packages/db/generated/client/index.js").$Enums.PayoutStatus;
        currency: string;
        periodStart: Date;
        periodEnd: Date;
        netPayoutCents: number;
        orderCount: number;
        createdAt: Date;
        completedAt: Date | null;
    }[];
    total: number;
}>;
/**
 * Get pending payout amount for a store
 */
export declare function getPendingPayoutAmount(storeId: string): Promise<number>;
export declare function updateVendorPayoutStatus(input: {
    payoutId: string;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    failureReason?: string;
}): Promise<{
    status: import("@packages/db/generated/client/index.js").$Enums.PayoutStatus;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    grossSalesCents: number;
    discountsCents: number;
    refundsCents: number;
    tipsCents: number;
    platformFeesCents: number;
    processorFeesCents: number;
    periodStart: Date;
    periodEnd: Date;
    failureReason: string | null;
    currency: string;
    completedAt: Date | null;
    netPayoutCents: number;
    vendorUserId: string;
    providerPayoutId: string | null;
    providerTransferId: string | null;
    arrivalAt: Date | null;
    createdByUserId: string | null;
    failedAt: Date | null;
}>;
export declare function getVendorPayoutDetailForStore(input: {
    payoutId: string;
    storeId: string;
}): Promise<{
    status: import("@packages/db/generated/client/index.js").$Enums.PayoutStatus;
    id: string;
    createdAt: Date;
    orders: {
        paymentStatus: import("@packages/db/generated/client/index.js").$Enums.PaymentStatus;
        orderId: string;
        orderCreatedAt: Date;
        orderStatus: import("@packages/db/generated/client/index.js").$Enums.OrderStatus;
        grossSalesCents: number;
        discountsCents: number;
        refundsCents: number;
        tipsCents: number;
        platformFeesCents: number;
        processorFeesCents: number;
        netContributionCents: number;
    }[];
    grossSalesCents: number;
    discountsCents: number;
    refundsCents: number;
    tipsCents: number;
    platformFeesCents: number;
    processorFeesCents: number;
    periodStart: Date;
    periodEnd: Date;
    failureReason: string | null;
    currency: string;
    completedAt: Date | null;
    netPayoutCents: number;
    vendorUserId: string;
    failedAt: Date | null;
    adjustments: {
        type: import("@packages/db/generated/client/index.js").$Enums.PayoutAdjustmentType;
        id: string;
        createdAt: Date;
        note: string | null;
        amountCents: number;
        reason: string;
    }[];
}>;
export declare function createPayoutAdjustment(input: {
    payoutId: string;
    type: 'CREDIT' | 'DEBIT';
    amountCents: number;
    reason: string;
    note?: string;
    createdByUserId?: string;
}): Promise<{
    type: import("@packages/db/generated/client/index.js").$Enums.PayoutAdjustmentType;
    id: string;
    createdAt: Date;
    note: string | null;
    payoutId: string;
    amountCents: number;
    reason: string;
    createdByUserId: string | null;
}>;
//# sourceMappingURL=vendor-payout.service.d.ts.map