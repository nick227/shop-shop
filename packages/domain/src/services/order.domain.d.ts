import { type CheckoutTotalsConfig } from '../order/checkout.js';
export type { CheckoutCart, CheckoutTotals } from '../order/checkout.js';
export declare class OrderDomain {
    private readonly totalsConfig;
    constructor(config?: Partial<CheckoutTotalsConfig>);
    /**
     * One DB read: validate cart ownership/state/items/store, then compute totals.
     * Prefer this over calling validateOrderPlacement + calculateOrderTotals separately.
     */
    calculateOrderTotals(cartId: string, userId: string, deliveryType: 'DELIVERY' | 'PICKUP', tipAmount?: number): Promise<Readonly<{
        subtotal: import("decimal.js").Decimal;
        fees: import("decimal.js").Decimal;
        tax: import("decimal.js").Decimal;
        tip: import("decimal.js").Decimal;
        total: import("decimal.js").Decimal;
        serviceFeePercent: import("decimal.js").Decimal;
        serviceFeeAmount: import("decimal.js").Decimal;
        netToVendor: import("decimal.js").Decimal;
        storeId: string;
        storeLatitude: number | null;
        storeLongitude: number | null;
    }>>;
    /**
     * Soft validation (same rules as totals) without computing money — uses one cart read.
     */
    validateOrderPlacement(cartId: string, userId: string): Promise<{
        valid: boolean;
        reason?: string;
    }>;
    canTransitionTo(currentStatus: string, newStatus: string): {
        valid: boolean;
        reason?: string;
    };
    prepareForCreation(input: unknown, userId: string): Promise<Record<string, unknown>>;
}
//# sourceMappingURL=order.domain.d.ts.map