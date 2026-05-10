import { prisma } from '@packages/db';
// ========================================
// Promotion Authorization Policy
// Centralized authorization rules for promotions
// ========================================
export class PromotionPolicy {
    /**
     * Authorization: Can user create this promotion?
     */
    async canCreate(data, context) {
        const input = data;
        // Rule 1: Only admins can create global promotions (no storeId)
        if (!input.storeId && context.userRole !== 'ADMIN') {
            return 'Only admins can create global promotions';
        }
        // Rule 2: Vendors can only create promotions for stores they own
        if (input.storeId && context.userRole === 'VENDOR') {
            const store = await prisma.store.findUnique({
                where: { id: input.storeId },
                select: { ownerUserId: true }
            });
            if (!store) {
                return 'Store not found';
            }
            if (store.ownerUserId !== context.userId) {
                return 'You can only create promotions for your own stores';
            }
        }
        // Rule 3: Regular users cannot create promotions
        if (context.userRole === 'USER') {
            return 'Users cannot create promotions';
        }
        return true;
    }
    /**
     * Authorization: Can user read this promotion?
     */
    async canRead() {
        return true; // Promotions are public
    }
    /**
     * Authorization: Can user update this promotion?
     */
    async canUpdate(promotion, context) {
        // Admins can update anything
        if (context.userRole === 'ADMIN') {
            return true;
        }
        // Vendors can only update their store promotions
        if (context.userRole === 'VENDOR') {
            if (promotion.isGlobal) {
                return 'Only admins can update global promotions';
            }
            if (promotion.storeId) {
                const store = await prisma.store.findUnique({
                    where: { id: promotion.storeId },
                    select: { ownerUserId: true }
                });
                if (store?.ownerUserId === context.userId) {
                    return true;
                }
            }
            return 'You can only update your own store promotions';
        }
        return false;
    }
    /**
     * Authorization: Can user delete this promotion?
     */
    async canDelete(promotion, context) {
        return this.canUpdate(promotion, context);
    }
    /**
     * Authorization: Can user list promotions?
     */
    async canList() {
        return true; // Anyone can list promotions
    }
}
