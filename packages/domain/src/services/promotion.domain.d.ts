import type { Promotion } from '@packages/db/generated/client';
export declare class PromotionDomain {
    /**
     * Prepare promotion data for database creation
     */
    prepareForCreation(input: unknown, userId: string): Record<string, unknown>;
    /**
     * Check if promotion is currently active
     */
    isActive(promotion: Promotion): boolean;
    /**
     * Check if promotion can be redeemed
     */
    canBeRedeemed(promotion: Promotion): {
        valid: boolean;
        reason?: string;
    };
    /**
     * Calculate discount amount for an order subtotal
     */
    calculateDiscount(promotion: Promotion, orderSubtotal: number): number;
}
//# sourceMappingURL=promotion.domain.d.ts.map