import { Decimal } from 'decimal.js';
// ========================================
// Promotion Domain Service
// Business operations for promotions
// ========================================
export class PromotionDomain {
    /**
     * Prepare promotion data for database creation
     */
    prepareForCreation(input, userId) {
        const data = input;
        return {
            ...data,
            code: data.code.toUpperCase(),
            isGlobal: !data.storeId,
            createdById: userId,
            validFrom: new Date(data.validFrom),
            validUntil: new Date(data.validUntil),
            value: new Decimal(data.value),
            minOrderValue: data.minOrderValue ? new Decimal(data.minOrderValue) : null,
            maxDiscount: data.maxDiscount ? new Decimal(data.maxDiscount) : null,
        };
    }
    /**
     * Check if promotion is currently active
     */
    isActive(promotion) {
        const now = new Date();
        return (promotion.status === 'ACTIVE' &&
            promotion.validFrom <= now &&
            promotion.validUntil >= now);
    }
    /**
     * Check if promotion can be redeemed
     */
    canBeRedeemed(promotion) {
        if (!this.isActive(promotion)) {
            return { valid: false, reason: 'Promotion is not active' };
        }
        if (promotion.usageLimit && promotion.usageCount >= promotion.usageLimit) {
            return { valid: false, reason: 'Promotion usage limit reached' };
        }
        return { valid: true };
    }
    /**
     * Calculate discount amount for an order subtotal
     */
    calculateDiscount(promotion, orderSubtotal) {
        const minOrder = parseFloat(promotion.minOrderValue?.toString() || '0');
        if (orderSubtotal < minOrder) {
            return 0;
        }
        let discount = 0;
        switch (promotion.type) {
            case 'PERCENTAGE':
                discount = orderSubtotal * (parseFloat(promotion.value.toString()) / 100);
                break;
            case 'FIXED_AMOUNT':
                discount = parseFloat(promotion.value.toString());
                break;
            case 'FREE_DELIVERY':
            case 'FREE_ITEM':
                // Handled separately in order logic
                discount = 0;
                break;
        }
        // Apply max discount cap
        const maxDiscount = promotion.maxDiscount ? parseFloat(promotion.maxDiscount.toString()) : Infinity;
        discount = Math.min(discount, maxDiscount);
        return discount;
    }
}
