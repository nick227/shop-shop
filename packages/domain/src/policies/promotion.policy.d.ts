import type { Promotion } from '@packages/db/generated/client';
import type { BasePolicy, PolicyContext } from './base.policy.js';
export declare class PromotionPolicy implements BasePolicy<Promotion> {
    /**
     * Authorization: Can user create this promotion?
     */
    canCreate(data: unknown, context: PolicyContext): Promise<boolean | string>;
    /**
     * Authorization: Can user read this promotion?
     */
    canRead(): Promise<boolean>;
    /**
     * Authorization: Can user update this promotion?
     */
    canUpdate(promotion: Promotion, context: PolicyContext): Promise<boolean | string>;
    /**
     * Authorization: Can user delete this promotion?
     */
    canDelete(promotion: Promotion, context: PolicyContext): Promise<boolean | string>;
    /**
     * Authorization: Can user list promotions?
     */
    canList(): Promise<boolean>;
}
//# sourceMappingURL=promotion.policy.d.ts.map