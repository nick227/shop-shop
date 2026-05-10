export interface CreateVendorApplicationInput {
    userId: string;
    businessName: string;
    contactName: string;
    email: string;
    phone: string;
    businessType: string;
    description: string;
}
export interface UpdateVendorApplicationInput {
    businessName?: string;
    contactName?: string;
    email?: string;
    phone?: string;
    businessType?: string;
    description?: string;
}
export interface AdminReviewInput {
    status: 'APPROVED' | 'REJECTED';
    rejectionReason?: string;
}
export declare function createVendorApplication(input: CreateVendorApplicationInput): Promise<any>;
export declare function getVendorApplicationByUserId(userId: string): Promise<any | null>;
export declare function updateVendorApplication(applicationId: string, input: UpdateVendorApplicationInput): Promise<any>;
export declare function listVendorApplications(options?: {
    status?: string;
    limit?: number;
    offset?: number;
}): Promise<{
    applications: ({
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
export declare function approveVendorApplication(applicationId: string): Promise<any>;
export declare function rejectVendorApplication(applicationId: string, input: {
    rejectionReason?: string;
}): Promise<any>;
//# sourceMappingURL=vendor-application.service.d.ts.map