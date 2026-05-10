import type { Prisma } from '@packages/db';
import { Decimal } from 'decimal.js';
/** Prisma include shared by placement validation and totals (single source of truth). */
export declare const CHECKOUT_CART_INCLUDE: {
    readonly items: {
        readonly include: {
            readonly item: true;
            readonly bundle: {
                readonly include: {
                    readonly items: {
                        readonly include: {
                            readonly item: {
                                readonly select: {
                                    readonly id: true;
                                    readonly title: true;
                                    readonly price: true;
                                    readonly isActive: true;
                                    readonly isSoldOut: true;
                                };
                            };
                        };
                    };
                    readonly pricing: true;
                };
            };
        };
    };
    readonly store: {
        readonly select: {
            readonly id: true;
            readonly isPublished: true;
            readonly commissionRate: true;
            readonly deliveryCharge: true;
            readonly latitude: true;
            readonly longitude: true;
        };
    };
};
export type CheckoutCart = Prisma.CartGetPayload<{
    include: typeof CHECKOUT_CART_INCLUDE;
}>;
export type CheckoutTotals = Readonly<{
    subtotal: Decimal;
    fees: Decimal;
    tax: Decimal;
    tip: Decimal;
    total: Decimal;
    serviceFeePercent: Decimal;
    serviceFeeAmount: Decimal;
    netToVendor: Decimal;
    storeId: string;
    storeLatitude: number | null;
    storeLongitude: number | null;
}>;
export type CheckoutTotalsConfig = Readonly<{
    taxRate: number;
    defaultDeliveryFee: number;
    platformFeePercent: number;
}>;
export declare function placementFailureReason(cart: CheckoutCart | null, userId: string): string | null;
/** Pure: money lines from an already-validated cart row. */
export declare function computeCheckoutTotals(cart: CheckoutCart, deliveryType: 'DELIVERY' | 'PICKUP', tipAmount: number, config: CheckoutTotalsConfig): CheckoutTotals;
//# sourceMappingURL=checkout.d.ts.map