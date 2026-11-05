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
    /** The shopper's service fee (platform policy), part of `total`. */
    serviceFeePercent: Decimal;
    serviceFeeAmount: Decimal;
    /** The vendor's commission, taken from the vendor's share; not part of `total`. */
    vendorCommissionPercent: Decimal;
    vendorCommissionAmount: Decimal;
    /** What the vendor keeps: total minus the shopper service fee and the commission. */
    netToVendor: Decimal;
    storeId: string;
    storeLatitude: number | null;
    storeLongitude: number | null;
}>;
export type CheckoutTotalsConfig = Readonly<{
    /** Used only when no tax amount is supplied (the server always supplies one from its tax provider). */
    taxRate: number;
    defaultDeliveryFee: number;
    /** Default vendor commission, when the store has no rate of its own. */
    platformFeePercent: number;
    /** The shopper service fee policy, as a percent of the subtotal. */
    shopperServiceFeePercent?: number;
    shopperServiceFeeMinimum?: number;
    shopperServiceFeeMaximum?: number;
}>;
/** Amounts the server works out before totals: delivery from the service area, tax from the provider. */
export type CheckoutTotalsOverrides = Readonly<{
    deliveryFee?: number;
    tax?: number;
}>;
export declare function placementFailureReason(cart: CheckoutCart | null, userId: string): string | null;
/** Pure: money lines from an already-validated cart row. */
export declare function computeCheckoutTotals(cart: CheckoutCart, deliveryType: 'DELIVERY' | 'PICKUP', tipAmount: number, config: CheckoutTotalsConfig, overrides?: CheckoutTotalsOverrides): CheckoutTotals;
//# sourceMappingURL=checkout.d.ts.map