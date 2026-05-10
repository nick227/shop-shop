import { prisma, canTransitionTo as checkTransition } from '@packages/db';
import { CHECKOUT_CART_INCLUDE, computeCheckoutTotals, placementFailureReason, } from '../order/checkout.js';
// ========================================
// Order Domain Service — orchestration + I/O at this boundary
// ========================================
export class OrderDomain {
    totalsConfig;
    constructor(config) {
        this.totalsConfig = {
            taxRate: config?.taxRate ?? 0.1,
            defaultDeliveryFee: config?.defaultDeliveryFee ?? 5.0,
            platformFeePercent: config?.platformFeePercent ??
                Number.parseFloat(process.env.PLATFORM_FEE_PERCENTAGE || '10.0'),
        };
    }
    /**
     * One DB read: validate cart ownership/state/items/store, then compute totals.
     * Prefer this over calling validateOrderPlacement + calculateOrderTotals separately.
     */
    async calculateOrderTotals(cartId, userId, deliveryType, tipAmount = 0) {
        const cart = await prisma.cart.findUnique({
            where: { id: cartId },
            include: CHECKOUT_CART_INCLUDE,
        });
        const reason = placementFailureReason(cart, userId);
        if (reason) {
            throw new Error(reason);
        }
        if (!cart) {
            throw new Error('Cart not found');
        }
        return computeCheckoutTotals(cart, deliveryType, tipAmount, this.totalsConfig);
    }
    /**
     * Soft validation (same rules as totals) without computing money — uses one cart read.
     */
    async validateOrderPlacement(cartId, userId) {
        const cart = await prisma.cart.findUnique({
            where: { id: cartId },
            include: CHECKOUT_CART_INCLUDE,
        });
        const reason = placementFailureReason(cart, userId);
        return reason ? { valid: false, reason } : { valid: true };
    }
    canTransitionTo(currentStatus, newStatus) {
        return checkTransition(currentStatus, newStatus);
    }
    async prepareForCreation(input, userId) {
        const data = input;
        const totals = await this.calculateOrderTotals(data.cartId, userId, data.deliveryType, 0);
        return {
            ...data,
            userId,
            storeId: totals.storeId,
            subtotal: totals.subtotal,
            fees: totals.fees,
            tax: totals.tax,
            tip: totals.tip,
            total: totals.total,
            serviceFeePercent: totals.serviceFeePercent,
            serviceFeeAmount: totals.serviceFeeAmount,
            netToVendor: totals.netToVendor,
        };
    }
}
