export type TeamMemberPermission = 'VIEW_ORDERS' | 'MANAGE_ORDERS' | 'VIEW_ITEMS' | 'MANAGE_ITEMS' | 'VIEW_DELIVERIES' | 'MANAGE_DELIVERIES' | 'ASSIGN_DELIVERIES' | 'VIEW_ANALYTICS' | 'VIEW_FINANCE' | 'MANAGE_STORE_SETTINGS' | 'FULL_ACCESS';
export interface CreateInvitationInput {
    storeId: string;
    senderUserId: string;
    recipientEmail: string;
    permissions: TeamMemberPermission[];
    message?: string;
    expiryDays?: number;
    actorRole?: string;
}
export interface AcceptInvitationInput {
    token: string;
    userId: string;
}
export interface UpdateTeamMemberInput {
    permissions?: TeamMemberPermission[];
    isActive?: boolean;
    actorRole?: string;
}
/**
 * Create and send team invitation
 */
export declare function createInvitation(input: CreateInvitationInput): Promise<{
    store: {
        name: string;
        slug: string;
    };
    sender: {
        name: string | null;
        email: string;
    };
} & {
    message: string | null;
    status: import("@packages/db/generated/client/index.js").$Enums.InvitationStatus;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    storeId: string;
    expiresAt: Date;
    token: string;
    permissionsJson: import("@packages/db/generated/client/runtime/library.js").JsonValue;
    senderUserId: string;
    recipientEmail: string;
    recipientUserId: string | null;
    acceptedAt: Date | null;
    declinedAt: Date | null;
    revokedAt: Date | null;
}>;
/**
 * Get invitation by token
 */
export declare function getInvitationByToken(token: string): Promise<({
    store: {
        name: string;
        id: string;
        slug: string;
    };
    sender: {
        name: string | null;
        email: string;
    };
} & {
    message: string | null;
    status: import("@packages/db/generated/client/index.js").$Enums.InvitationStatus;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    storeId: string;
    expiresAt: Date;
    token: string;
    permissionsJson: import("@packages/db/generated/client/runtime/library.js").JsonValue;
    senderUserId: string;
    recipientEmail: string;
    recipientUserId: string | null;
    acceptedAt: Date | null;
    declinedAt: Date | null;
    revokedAt: Date | null;
}) | null>;
/**
 * Accept team invitation
 */
export declare function acceptInvitation(input: AcceptInvitationInput): Promise<{
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
} & {
    id: string;
    updatedAt: Date;
    userId: string;
    storeId: string;
    isActive: boolean;
    permissionsJson: import("@packages/db/generated/client/runtime/library.js").JsonValue;
    addedAt: Date;
}>;
/**
 * Decline team invitation
 */
export declare function declineInvitation(token: string): Promise<{
    message: string | null;
    status: import("@packages/db/generated/client/index.js").$Enums.InvitationStatus;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    storeId: string;
    expiresAt: Date;
    token: string;
    permissionsJson: import("@packages/db/generated/client/runtime/library.js").JsonValue;
    senderUserId: string;
    recipientEmail: string;
    recipientUserId: string | null;
    acceptedAt: Date | null;
    declinedAt: Date | null;
    revokedAt: Date | null;
}>;
/**
 * Revoke invitation (by sender)
 */
export declare function revokeInvitation(invitationId: string, userId: string, actorRole?: string): Promise<{
    message: string | null;
    status: import("@packages/db/generated/client/index.js").$Enums.InvitationStatus;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    storeId: string;
    expiresAt: Date;
    token: string;
    permissionsJson: import("@packages/db/generated/client/runtime/library.js").JsonValue;
    senderUserId: string;
    recipientEmail: string;
    recipientUserId: string | null;
    acceptedAt: Date | null;
    declinedAt: Date | null;
    revokedAt: Date | null;
}>;
/**
 * Get team members for a store
 */
export declare function getStoreTeamMembers(storeId: string): Promise<({
    user: {
        name: string | null;
        id: string;
        email: string;
        phone: string | null;
    };
} & {
    id: string;
    updatedAt: Date;
    userId: string;
    storeId: string;
    isActive: boolean;
    permissionsJson: import("@packages/db/generated/client/runtime/library.js").JsonValue;
    addedAt: Date;
})[]>;
/**
 * Get active team members who can receive delivery assignments for a store.
 */
export declare function getStoreDeliveryDrivers(storeId: string): Promise<({
    user: {
        name: string | null;
        id: string;
        email: string;
        phone: string | null;
    };
} & {
    id: string;
    updatedAt: Date;
    userId: string;
    storeId: string;
    isActive: boolean;
    permissionsJson: import("@packages/db/generated/client/runtime/library.js").JsonValue;
    addedAt: Date;
})[]>;
/**
 * Stores the user can act on: owned stores plus stores where they are an active team member.
 * Owners often have no TeamMember row; include owned stores so vendor dashboards resolve stores.
 */
export declare function getUserStoreAccess(userId: string): Promise<{
    storeId: string;
    store: {
        name: string;
        id: string;
        slug: string;
        isPublished: boolean;
    };
    permissions: TeamMemberPermission[];
    addedAt: Date;
}[]>;
/**
 * Update team member permissions
 */
export declare function updateTeamMember(memberId: string, userId: string, input: UpdateTeamMemberInput): Promise<{
    id: string;
    updatedAt: Date;
    userId: string;
    storeId: string;
    isActive: boolean;
    permissionsJson: import("@packages/db/generated/client/runtime/library.js").JsonValue;
    addedAt: Date;
}>;
/**
 * Remove team member
 */
export declare function removeTeamMember(memberId: string, userId: string, actorRole?: string): Promise<void>;
/**
 * Get pending invitations for a store
 */
export declare function getStorePendingInvitations(storeId: string): Promise<({
    sender: {
        name: string | null;
        email: string;
    };
} & {
    message: string | null;
    status: import("@packages/db/generated/client/index.js").$Enums.InvitationStatus;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    storeId: string;
    expiresAt: Date;
    token: string;
    permissionsJson: import("@packages/db/generated/client/runtime/library.js").JsonValue;
    senderUserId: string;
    recipientEmail: string;
    recipientUserId: string | null;
    acceptedAt: Date | null;
    declinedAt: Date | null;
    revokedAt: Date | null;
})[]>;
/**
 * Get invitations received by a user
 */
export declare function getUserInvitations(email: string): Promise<({
    store: {
        name: string;
        id: string;
        slug: string;
    };
    sender: {
        name: string | null;
        email: string;
    };
} & {
    message: string | null;
    status: import("@packages/db/generated/client/index.js").$Enums.InvitationStatus;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    storeId: string;
    expiresAt: Date;
    token: string;
    permissionsJson: import("@packages/db/generated/client/runtime/library.js").JsonValue;
    senderUserId: string;
    recipientEmail: string;
    recipientUserId: string | null;
    acceptedAt: Date | null;
    declinedAt: Date | null;
    revokedAt: Date | null;
})[]>;
/**
 * Check if user has permission for a store
 */
export declare function hasStorePermission(userId: string, storeId: string, requiredPermission: TeamMemberPermission): Promise<boolean>;
//# sourceMappingURL=team.service.d.ts.map