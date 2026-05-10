import { Decimal } from '@prisma/client/runtime/library';
/**
 * Cart Domain Service
 * Handles shopping cart business logic
 */
export declare class CartDomain {
    /**
     * Ensure user has an active cart for a specific store
     */
    ensureActiveCart(userId: string, storeId: string): Promise<string>;
    /**
     * Add item to cart with snapshot data
     */
    addItemToCart(userId: string, itemId: string, quantity: number, optionsJson?: Record<string, unknown>, notes?: string): Promise<{
        cartId: string;
        cartItemId: string;
    }>;
    /**
     * Add a bundle to cart as a single line (quantity always 1).
     * unitPrice is resolved from BundlePricingService and snapshotted at add-time.
     */
    addBundleToCart(userId: string, bundleId: string, notes?: string): Promise<{
        cartId: string;
        cartItemId: string;
    }>;
    /**
     * Update cart item quantity
     */
    updateCartItem(cartItemId: string, userId: string, quantity: number, optionsJson?: Record<string, unknown>, notes?: string): Promise<void>;
    /**
     * Calculate cart totals
     */
    calculateCartTotals(cartId: string): Promise<{
        itemCount: number;
        subtotal: Decimal;
    }>;
    /**
     * Clear cart
     */
    clearCart(cartId: string, userId: string): Promise<void>;
    /**
     * Validate cart can be submitted.
     * Checks both regular item lines and bundle constituent items.
     */
    validateCartForCheckout(cartId: string): Promise<{
        valid: boolean;
        reason?: string;
    }>;
}
export declare const cartDomain: CartDomain;
//# sourceMappingURL=cart.domain.d.ts.map