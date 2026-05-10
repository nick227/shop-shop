import type { Affiliate, Commission, AffiliatePayout, AffiliateStatus, CommissionStatus, PayoutStatus } from '../generated/client';
export interface CreateAffiliateInput {
    userId: string;
    bio?: string;
    website?: string;
    paypalEmail?: string;
    taxId?: string;
}
export interface UpdateAffiliateInput {
    bio?: string;
    website?: string;
    paypalEmail?: string;
    taxId?: string;
    bankAccountJson?: unknown;
}
export interface CreateCommissionInput {
    affiliateId: string;
    orderId: string;
    storeId: string;
    amount: number;
    rate: number;
    serviceFeeBase: number;
}
export interface ProcessPayoutInput {
    affiliateId: string;
    periodStart: Date;
    periodEnd: Date;
    method: string;
    adminUserId?: string;
}
export declare function createAffiliate(input: CreateAffiliateInput): Promise<Affiliate>;
export declare function getAffiliateByUserId(userId: string): Promise<Affiliate | null>;
export declare function getAffiliateByReferralCode(referralCode: string): Promise<Affiliate | null>;
/**
 * Resolves an affiliate from a public referral token.
 * Tries `referralSlug` first (vanity URL), falls back to `referralCode` (canonical).
 */
export declare function getAffiliateBySlugOrCode(token: string): Promise<Affiliate | null>;
export declare function updateAffiliate(affiliateId: string, input: UpdateAffiliateInput): Promise<Affiliate>;
export declare function updateAffiliateStatus(affiliateId: string, status: AffiliateStatus): Promise<Affiliate>;
export declare function getAffiliateStats(affiliateId: string): Promise<{
    affiliate: {
        status: import("../generated/client").$Enums.AffiliateStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        referralCode: string;
        referralSlug: string | null;
        commissionRate: import("@packages/db/generated/client/runtime/library.js").Decimal;
        payoutGroupId: string | null;
        customerRateBpsOverride: number | null;
        storeRateBpsOverride: number | null;
        payoutProvider: import("../generated/client").$Enums.AffiliatePayoutProvider;
        payoutProviderAccountId: string | null;
        payoutProviderStatus: import("../generated/client").$Enums.AffiliateProviderStatus;
        paypalEmail: string | null;
        bankAccountJson: import("@packages/db/generated/client/runtime/library.js").JsonValue | null;
        taxId: string | null;
        bio: string | null;
        website: string | null;
    } | null;
    stats: {
        totalEarnings: number | import("@packages/db/generated/client/runtime/library.js").Decimal;
        paidEarnings: number | import("@packages/db/generated/client/runtime/library.js").Decimal;
        pendingEarnings: number | import("@packages/db/generated/client/runtime/library.js").Decimal;
        totalCommissions: number;
        referredStores: number;
    };
}>;
export declare function createCommission(input: CreateCommissionInput): Promise<Commission>;
export declare function approveCommission(commissionId: string): Promise<Commission>;
export declare function getCommissionsByAffiliate(affiliateId: string, options?: {
    status?: CommissionStatus;
    limit?: number;
    offset?: number;
}): Promise<{
    commissions: ({
        order: {
            id: string;
            total: import("@packages/db/generated/client/runtime/library.js").Decimal;
            createdAt: Date;
        };
    } & {
        status: import("../generated/client").$Enums.CommissionStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        approvedAt: Date | null;
        orderId: string;
        amount: import("@packages/db/generated/client/runtime/library.js").Decimal;
        payoutId: string | null;
        rateBps: number | null;
        rateSource: import("../generated/client").$Enums.AffiliateRateSource | null;
        payoutGroupIdSnapshot: string | null;
        affiliateId: string;
        rate: import("@packages/db/generated/client/runtime/library.js").Decimal;
        serviceFeeBase: import("@packages/db/generated/client/runtime/library.js").Decimal;
        sourceType: import("../generated/client").$Enums.CommissionSourceType | null;
        commissionBaseCents: number | null;
        amountCents: number | null;
        paidAt: Date | null;
    })[];
    total: number;
}>;
export declare function processPayout(input: ProcessPayoutInput): Promise<AffiliatePayout>;
export declare function updatePayoutStatus(payoutId: string, status: PayoutStatus, referenceId?: string, failureReason?: string, adminUserId?: string): Promise<AffiliatePayout>;
export declare function getAffiliatePayouts(affiliateId: string, options?: {
    status?: PayoutStatus;
    limit?: number;
    offset?: number;
}): Promise<{
    payouts: ({
        _count: {
            commissions: number;
        };
    } & {
        status: import("../generated/client").$Enums.PayoutStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        method: string;
        amount: import("@packages/db/generated/client/runtime/library.js").Decimal;
        affiliateId: string;
        paidAt: Date | null;
        periodStart: Date;
        periodEnd: Date;
        referenceId: string | null;
        failureReason: string | null;
    })[];
    total: number;
}>;
export declare function calculateCommissionForOrder(orderId: string): Promise<void>;
export interface CreatePayoutWithReviewInput {
    affiliateId: string;
    periodStart: string;
    periodEnd: string;
    method: string;
    reviewNotes?: string;
    autoApprove?: boolean;
}
export declare function checkPayoutEligibility(affiliateId: string): Promise<{
    eligible: boolean;
    affiliateStatus: AffiliateStatus | null;
    eligibleCommissionCount: number;
    estimatedAmount: number;
    reason?: string;
}>;
export declare function approvePayout(payoutId: string, adminUserId: string, notes?: string): Promise<AffiliatePayout>;
export declare function createPayoutWithReview(input: CreatePayoutWithReviewInput, adminUserId: string): Promise<string>;
export declare function markPayoutAsPaid(payoutId: string, adminUserId: string, paymentReference?: string): Promise<AffiliatePayout>;
export declare function reversePayout(payoutId: string, adminUserId: string, reason: string): Promise<AffiliatePayout>;
export declare function getPayoutAuditLogs(affiliateId?: string, limit?: number): Promise<({
    affiliate: {
        user: {
            name: string | null;
            id: string;
            email: string;
        };
        id: string;
    };
} & {
    id: string;
    createdAt: Date;
    affiliateId: string;
    affiliatePayoutId: string;
    action: import("../generated/client").$Enums.PayoutAuditAction;
    performedBy: string | null;
    performedAt: Date;
    details: import("@packages/db/generated/client/runtime/library.js").JsonValue | null;
    ipAddress: string | null;
})[]>;
export declare function exportAffiliatePayoutsToCSV(affiliateId?: string, dateRange?: {
    start: Date;
    end: Date;
}): Promise<string>;
export declare function listAffiliates(options?: {
    status?: AffiliateStatus;
    limit?: number;
    offset?: number;
}): Promise<{
    affiliates: ({
        user: {
            name: string | null;
            id: string;
            email: string;
        };
        _count: {
            commissions: number;
            referredStores: number;
        };
    } & {
        status: import("../generated/client").$Enums.AffiliateStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        referralCode: string;
        referralSlug: string | null;
        commissionRate: import("@packages/db/generated/client/runtime/library.js").Decimal;
        payoutGroupId: string | null;
        customerRateBpsOverride: number | null;
        storeRateBpsOverride: number | null;
        payoutProvider: import("../generated/client").$Enums.AffiliatePayoutProvider;
        payoutProviderAccountId: string | null;
        payoutProviderStatus: import("../generated/client").$Enums.AffiliateProviderStatus;
        paypalEmail: string | null;
        bankAccountJson: import("@packages/db/generated/client/runtime/library.js").JsonValue | null;
        taxId: string | null;
        bio: string | null;
        website: string | null;
    })[];
    total: number;
}>;
export declare function getReferralEvents(affiliateId: string, options?: {
    eventType?: 'STORE_SIGNUP' | 'USER_SIGNUP';
    limit?: number;
    offset?: number;
}): Promise<{
    events: {
        id: string;
        createdAt: Date;
        referralCode: string | null;
        referralSlug: string | null;
        metadata: import("@packages/db/generated/client/runtime/library.js").JsonValue | null;
        affiliateId: string;
        eventType: import("../generated/client").$Enums.ReferralEventType;
        referredUserId: string | null;
        referredStoreId: string | null;
    }[];
    total: number;
}>;
export declare function getReferredUsers(affiliateId: string): Promise<{
    name: string | null;
    id: string;
    createdAt: Date;
    email: string;
    _count: {
        orders: number;
    };
}[]>;
export declare function getReferredStores(affiliateId: string): Promise<{
    name: string;
    id: string;
    createdAt: Date;
    _count: {
        items: number;
        orders: number;
    };
    slug: string;
    isPublished: boolean;
    owner: {
        name: string | null;
        id: string;
        email: string;
    };
}[]>;
export declare function getReferredOrders(affiliateId: string): Promise<{
    status: import("../generated/client").$Enums.OrderStatus;
    user: {
        name: string | null;
        id: string;
        email: string;
    };
    store: {
        name: string;
        id: string;
        slug: string;
    };
    id: string;
    affiliateAttributionSource: import("../generated/client").$Enums.AffiliateAttributionSource | null;
    total: import("@packages/db/generated/client/runtime/library.js").Decimal;
    createdAt: Date;
}[]>;
//# sourceMappingURL=affiliate.service.d.ts.map