export interface CancelOrderInput {
    orderId: string;
    userId: string;
    reason: string;
    shouldRefund?: boolean;
}
export interface CancelOrderResult {
    orderId: string;
    status: string;
    canceledAt: Date;
    refunded: boolean;
    refundAmount?: number;
}
export declare const CANCELLATION_REASONS: {
    readonly CUSTOMER_REQUEST: "Customer requested cancellation";
    readonly OUT_OF_STOCK: "Items out of stock";
    readonly KITCHEN_CAPACITY: "Kitchen at capacity";
    readonly DELIVERY_UNAVAILABLE: "Delivery unavailable";
    readonly PAYMENT_FAILED: "Payment processing failed";
    readonly FRAUD_SUSPECTED: "Suspected fraudulent order";
    readonly CUSTOMER_NO_SHOW: "Customer no-show for pickup";
    readonly OTHER: "Other reason";
};
/**
 * Cancel an order with optional refund
 */
export declare function cancelOrder(input: CancelOrderInput): Promise<CancelOrderResult>;
/**
 * Get cancellation statistics for a store
 */
export declare function getStoreCancellationStats(storeId: string, startDate?: Date, endDate?: Date): Promise<{
    totalCancellations: number;
    refundedOrders: number;
    refundRate: number;
    byReason: {
        reason: string;
        count: number;
    }[];
}>;
/**
 * Get recent cancellations for review
 */
export declare function getRecentCancellations(options?: {
    storeId?: string;
    limit?: number;
    offset?: number;
}): Promise<({
    user: {
        name: string | null;
        id: string;
        email: string;
    };
    store: {
        name: string;
        id: string;
        slug: string;
    };
} & {
    status: import("@packages/db/generated/client/index.js").$Enums.OrderStatus;
    deliveryType: import("@packages/db/generated/client/index.js").$Enums.DeliveryType;
    deliveryLatitude: import("@packages/db/generated/client/runtime/library.js").Decimal | null;
    deliveryLongitude: import("@packages/db/generated/client/runtime/library.js").Decimal | null;
    tip: import("@packages/db/generated/client/runtime/library.js").Decimal;
    id: string;
    referredByReferralCode: string | null;
    affiliateAttributionSource: import("@packages/db/generated/client/index.js").$Enums.AffiliateAttributionSource | null;
    deliveryMode: import("@packages/db/generated/client/index.js").$Enums.DeliveryMode;
    paymentStatus: import("@packages/db/generated/client/index.js").$Enums.PaymentStatus;
    subtotal: import("@packages/db/generated/client/runtime/library.js").Decimal;
    fees: import("@packages/db/generated/client/runtime/library.js").Decimal;
    tax: import("@packages/db/generated/client/runtime/library.js").Decimal;
    total: import("@packages/db/generated/client/runtime/library.js").Decimal;
    serviceFeePercent: import("@packages/db/generated/client/runtime/library.js").Decimal;
    serviceFeeAmount: import("@packages/db/generated/client/runtime/library.js").Decimal;
    netToVendor: import("@packages/db/generated/client/runtime/library.js").Decimal;
    stripePaymentIntentId: string | null;
    stripeChargeId: string | null;
    stripeTransferId: string | null;
    stripeApplicationFeeId: string | null;
    stripeRefundId: string | null;
    addressSnapshot: import("@packages/db/generated/client/runtime/library.js").JsonValue | null;
    deliveryDistanceMiles: import("@packages/db/generated/client/runtime/library.js").Decimal | null;
    estimatedDeliveryAt: Date | null;
    cancelReason: string | null;
    canceledBy: string | null;
    canceledAt: Date | null;
    refundReason: string | null;
    refundedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    storeId: string;
    cartId: string | null;
    referredByAffiliateId: string | null;
    assignedToUserId: string | null;
    addressId: string | null;
})[]>;
/**
 * Check if order is eligible for cancellation
 */
export declare function canCancelOrder(orderId: string, userId: string): Promise<{
    canCancel: boolean;
    reason?: string;
    requiresRefund: boolean;
}>;
//# sourceMappingURL=order-cancellation.service.d.ts.map