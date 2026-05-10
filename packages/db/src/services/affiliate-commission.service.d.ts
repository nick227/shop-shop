/**
 * Affiliate commission service — Phase 3A: rate resolution and candidate building.
 *
 * NOT wired into checkout, webhooks, or payout routes yet.
 * Call buildAffiliateCommissionCandidatesForOrder + upsertCommissionCandidate
 * from the stripe webhook / order-paid handler in Phase 3B.
 */
import type { CommissionSourceType, AffiliateRateSource } from '../generated/client/index.js';
import type { ExtendedPrismaClient } from '../client.js';
export interface RateResolutionResult {
    rateBps: number;
    rateSource: AffiliateRateSource;
    payoutGroupIdSnapshot: string | null;
}
export interface CommissionCandidate {
    affiliateId: string;
    orderId: string;
    storeId: string;
    sourceType: CommissionSourceType;
    /** Service-fee amount in integer cents — the base the rate is applied to. */
    commissionBaseCents: number;
    rateBps: number;
    amountCents: number;
    rateSource: AffiliateRateSource;
    payoutGroupIdSnapshot: string | null;
}
/**
 * 3-tier cascade: user override → payout group → platform system default.
 * A zero override (0 bps) is a valid intentional value — not a fallthrough.
 */
export declare function resolveRateFromValues(overrideBps: number | null, groupBps: number | null, systemDefaultBps: number, payoutGroupId: string | null): RateResolutionResult;
/** Commission amount in integer cents: round((base * rateBps) / 10000). */
export declare function calculateCommissionAmountCents(commissionBaseCents: number, rateBps: number): number;
/**
 * Cap total affiliate burden to platform.affiliate_max_burden_bps of the service fee.
 *
 * Sort order: CUSTOMER_PURCHASE is paid in full first; STORE_REVENUE gets the remainder.
 * Any other source types are treated as lower priority (paid after STORE_REVENUE).
 */
export declare function applyDualCommissionCap(candidates: CommissionCandidate[], serviceFeeAmountCents: number, maxBurdenBps: number): CommissionCandidate[];
/**
 * Resolve the effective rate bps for one affiliate + source type combination.
 * Reads the affiliate's override, payout group, and system settings in one call.
 */
export declare function resolveAffiliateRate(affiliateId: string, sourceType: CommissionSourceType, db?: ExtendedPrismaClient): Promise<RateResolutionResult>;
/**
 * Build commission candidates for a PAID order.
 *
 * Rules enforced here:
 * - Order must have paymentStatus === 'PAID'.
 * - CUSTOMER_PURCHASE: buyer must be attributed to an active affiliate that is NOT
 *   the buyer themselves (self-referral skip).
 * - STORE_REVENUE: store must be attributed to an active affiliate that is NOT
 *   the store owner (self-referral skip), AND must be a different affiliate than
 *   the buyer's (same-affiliate no double-dip rule).
 * - Cap applied via applyDualCommissionCap.
 *
 * Returns an empty array when no commissions should be created (unpaid, no attribution,
 * all self-referrals, etc.).
 */
export declare function buildAffiliateCommissionCandidatesForOrder(orderId: string, db?: ExtendedPrismaClient): Promise<CommissionCandidate[]>;
/**
 * Persist a commission candidate as a Commission row.
 *
 * Idempotent: upserts by (affiliateId, orderId, sourceType). Re-running on the same
 * candidate updates the rate/amount fields but does not change status or paidAt.
 *
 * Legacy Decimal fields (amount, rate, serviceFeeBase) are kept in sync so existing
 * code that reads them (calculateCommissionForOrder, payout reports) keeps working.
 */
export declare function upsertCommissionCandidate(candidate: CommissionCandidate, db?: ExtendedPrismaClient): Promise<void>;
//# sourceMappingURL=affiliate-commission.service.d.ts.map