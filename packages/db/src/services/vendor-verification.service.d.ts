import type { VendorVerification, VerificationStatus } from '../generated/client';
export interface CreateVerificationInput {
    userId: string;
    businessName: string;
    businessType: string;
    taxId: string;
    documentsJson?: unknown;
}
export interface UpdateVerificationInput {
    businessName?: string;
    businessType?: string;
    taxId?: string;
    documentsJson?: unknown;
}
export interface ReviewVerificationInput {
    status: Extract<VerificationStatus, 'APPROVED' | 'REJECTED'>;
    reviewNotes?: string;
    rejectionReason?: string;
    expiresAt?: Date;
    stripeAccountId?: string;
}
export declare function createVerification(input: CreateVerificationInput): Promise<VendorVerification>;
export declare function getVerificationByUserId(userId: string): Promise<VendorVerification | null>;
export declare function getVerification(verificationId: string): Promise<VendorVerification | null>;
export declare function updateVerification(verificationId: string, input: UpdateVerificationInput): Promise<VendorVerification>;
export declare function submitVerification(verificationId: string): Promise<VendorVerification>;
export declare function reviewVerification(verificationId: string, input: ReviewVerificationInput): Promise<VendorVerification>;
export declare function listVerifications(options?: {
    status?: VerificationStatus;
    limit?: number;
    offset?: number;
}): Promise<{
    verifications: ({
        user: {
            name: string | null;
            id: string;
            role: import("../generated/client").$Enums.Role;
            email: string;
        };
    } & {
        status: import("../generated/client").$Enums.VerificationStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        taxId: string;
        businessName: string;
        businessType: string;
        documentsJson: import("@packages/db/generated/client/runtime/library.js").JsonValue | null;
        submittedAt: Date | null;
        reviewedAt: Date | null;
        approvedAt: Date | null;
        expiresAt: Date | null;
        reviewNotes: string | null;
        rejectionReason: string | null;
        stripeAccountId: string | null;
    })[];
    total: number;
}>;
export declare function checkVerificationExpiry(verificationId: string): Promise<VendorVerification | null>;
export declare function isVendorVerified(userId: string): Promise<boolean>;
export declare function getVerificationStats(): Promise<{
    pending: number;
    submitted: number;
    underReview: number;
    approved: number;
    rejected: number;
    expired: number;
    total: number;
}>;
//# sourceMappingURL=vendor-verification.service.d.ts.map