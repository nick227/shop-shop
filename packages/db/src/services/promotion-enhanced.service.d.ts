export interface ValidatePromotionInput {
    code: string;
    userId: string;
    storeId?: string;
    orderSubtotal: number;
    appliedPromotions?: string[];
}
export interface ValidatePromotionResult {
    valid: boolean;
    promotion?: {
        id: string;
        code: string;
        type: string;
        value: number;
        discountAmount: number;
    };
    error?: string;
}
export interface RedeemPromotionInput {
    promotionId: string;
    userId: string;
    orderId?: string;
    discountAmount: number;
}
/**
 * Validate if a promotion code can be applied to an order
 */
export declare function validatePromotionCode(input: ValidatePromotionInput): Promise<ValidatePromotionResult>;
/**
 * Redeem a promotion code (record usage)
 */
export declare function redeemPromotion(input: RedeemPromotionInput): Promise<{
    id: string;
    userId: string;
    orderId: string | null;
    promotionId: string;
    discountAmount: import("@packages/db/generated/client/runtime/library.js").Decimal;
    redeemedAt: Date;
}>;
/**
 * Get user's promotion redemption history
 */
export declare function getUserPromotionHistory(userId: string): Promise<({
    promotion: {
        code: string;
        type: import("@packages/db/generated/client/index.js").$Enums.PromotionType;
        name: string;
    };
} & {
    id: string;
    userId: string;
    orderId: string | null;
    promotionId: string;
    discountAmount: import("@packages/db/generated/client/runtime/library.js").Decimal;
    redeemedAt: Date;
})[]>;
/**
 * Get promotion redemption analytics
 */
export declare function getPromotionAnalytics(promotionId: string): Promise<{
    promotion: {
        id: string;
        code: string;
        name: string;
        type: import("@packages/db/generated/client/index.js").$Enums.PromotionType;
        status: import("@packages/db/generated/client/index.js").$Enums.PromotionStatus;
        usageLimit: number | null;
        usageCount: number;
    };
    analytics: {
        totalRedemptions: number;
        uniqueUsers: number;
        totalDiscount: number;
        averageDiscount: number;
    };
}>;
/**
 * Check if user can use specific promotion
 */
export declare function canUserUsePromotion(promotionId: string, userId: string): Promise<{
    canUse: boolean;
    reason?: string;
    usageCount: number;
}>;
/**
 * Get active promotions for a store
 */
export declare function getActivePromotionsForStore(storeId?: string): Promise<{
    code: string;
    type: import("@packages/db/generated/client/index.js").$Enums.PromotionType;
    description: string | null;
    value: import("@packages/db/generated/client/runtime/library.js").Decimal;
    name: string;
    id: string;
    minOrderValue: import("@packages/db/generated/client/runtime/library.js").Decimal | null;
    maxDiscount: import("@packages/db/generated/client/runtime/library.js").Decimal | null;
    usageLimit: number | null;
    usageCount: number;
    usageLimitPerUser: number | null;
    allowStacking: boolean;
    validUntil: Date;
}[]>;
//# sourceMappingURL=promotion-enhanced.service.d.ts.map