import { Decimal } from '@prisma/client/runtime/library';
export interface BundlePriceResult {
    resolvedPrice: Decimal;
    itemSum: Decimal;
    savings: Decimal;
    pricingType: string;
}
/**
 * Compute the resolved purchase price for a bundle.
 *
 * FIXED_PRICE      — vendor sets an explicit price
 * DISCOUNT_PERCENT — itemSum * (1 - discountPercent/100)
 * DISCOUNT_AMOUNT  — itemSum - discountAmount
 * BEST_DEAL        — whichever strategy yields the lowest price
 */
export declare function computeBundlePrice(bundleId: string): Promise<BundlePriceResult>;
/**
 * Snapshot bundle contents at purchase time.
 * Stored on OrderItem.bundleSnapshot so order history survives bundle edits.
 */
export declare function snapshotBundle(bundleId: string): Promise<Record<string, unknown>>;
//# sourceMappingURL=bundlePricing.service.d.ts.map