/**
 * Add store to favorites
 */
export declare function addFavoriteStore(userId: string, storeId: string): Promise<any>;
/**
 * Remove store from favorites
 */
export declare function removeFavoriteStore(userId: string, storeId: string): Promise<void>;
/**
 * Get user's favorite stores
 */
export declare function getUserFavoriteStores(userId: string): Promise<any>;
/**
 * Check if store is favorited
 */
export declare function isStoreFavorited(userId: string, storeId: string): Promise<boolean>;
/**
 * Add item to favorites
 */
export declare function addFavoriteItem(userId: string, itemId: string): Promise<any>;
/**
 * Remove item from favorites
 */
export declare function removeFavoriteItem(userId: string, itemId: string): Promise<void>;
/**
 * Get user's favorite items
 */
export declare function getUserFavoriteItems(userId: string): Promise<any>;
/**
 * Reorder - Recreate cart from a previous order
 */
export declare function reorderFromPreviousOrder(userId: string, orderId: string): Promise<({
    items: ({
        item: ({
            media: {
                id: string;
                createdAt: Date;
                storeId: string | null;
                sortIndex: number;
                url: string;
                kind: import("@packages/db/generated/client/index.js").$Enums.MediaKind;
                itemId: string | null;
                altText: string | null;
                metadata: import("@packages/db/generated/client/runtime/library.js").JsonValue | null;
                bundleId: string | null;
            }[];
        } & {
            description: string | null;
            title: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            storeId: string;
            imageUrl: string | null;
            price: import("@packages/db/generated/client/runtime/library.js").Decimal;
            isActive: boolean;
            isSoldOut: boolean;
            sortIndex: number;
            optionsJson: import("@packages/db/generated/client/runtime/library.js").JsonValue | null;
            stockQty: number | null;
            allergensJson: import("@packages/db/generated/client/runtime/library.js").JsonValue | null;
            spicyLevel: number | null;
            flagged: boolean;
            flaggedAt: Date | null;
            flaggedByAdminId: string | null;
            flaggedReason: string | null;
        }) | null;
    } & {
        id: string;
        createdAt: Date;
        cartId: string;
        optionsJson: import("@packages/db/generated/client/runtime/library.js").JsonValue | null;
        itemId: string | null;
        bundleId: string | null;
        quantity: number;
        notes: string | null;
        titleSnapshot: string;
        unitPrice: import("@packages/db/generated/client/runtime/library.js").Decimal;
    })[];
    store: {
        name: string;
        id: string;
        slug: string;
    };
} & {
    status: import("@packages/db/generated/client/index.js").$Enums.CartStatus;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    storeId: string;
    expiresAt: Date | null;
    note: string | null;
}) | null>;
/**
 * Get user's order history for reorder
 */
export declare function getUserOrderHistory(userId: string, options?: {
    limit?: number;
    offset?: number;
}): Promise<({
    items: {
        quantity: number;
        titleSnapshot: string;
    }[];
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
//# sourceMappingURL=favorites.service.d.ts.map