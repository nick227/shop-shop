import { nanoid } from 'nanoid';
import { prisma } from '../client.js';
async function canManageStoreMembers(userId, storeId, actorRole) {
    if (actorRole === 'ADMIN')
        return true;
    return hasStorePermission(userId, storeId, 'MANAGE_STORE_SETTINGS');
}
/**
 * Create and send team invitation
 */
export async function createInvitation(input) {
    // Verify store ownership
    const store = await prisma.store.findUnique({
        where: { id: input.storeId },
        select: { id: true, ownerUserId: true },
    });
    if (!store) {
        throw new Error('Store not found');
    }
    if (!(await canManageStoreMembers(input.senderUserId, input.storeId, input.actorRole))) {
        throw new Error('Only store managers can send invitations');
    }
    // Check if user is already a team member
    const existingMember = await prisma.teamMember.findFirst({
        where: {
            storeId: input.storeId,
            user: { email: input.recipientEmail },
            isActive: true,
        },
    });
    if (existingMember) {
        throw new Error('User is already a team member');
    }
    // Check for pending invitation to same email
    const existingInvitation = await prisma.invitation.findFirst({
        where: {
            storeId: input.storeId,
            recipientEmail: input.recipientEmail,
            status: 'PENDING',
            expiresAt: { gt: new Date() },
        },
    });
    if (existingInvitation) {
        throw new Error('Pending invitation already exists for this email');
    }
    // Generate unique token
    const token = nanoid(32);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (input.expiryDays || 7));
    return prisma.invitation.create({
        data: {
            storeId: input.storeId,
            senderUserId: input.senderUserId,
            recipientEmail: input.recipientEmail,
            token,
            permissionsJson: input.permissions,
            message: input.message,
            expiresAt,
        },
        include: {
            store: {
                select: {
                    name: true,
                    slug: true,
                },
            },
            sender: {
                select: {
                    name: true,
                    email: true,
                },
            },
        },
    });
}
/**
 * Get invitation by token
 */
export async function getInvitationByToken(token) {
    return prisma.invitation.findUnique({
        where: { token },
        include: {
            store: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                },
            },
            sender: {
                select: {
                    name: true,
                    email: true,
                },
            },
        },
    });
}
/**
 * Accept team invitation
 */
export async function acceptInvitation(input) {
    const invitation = await prisma.invitation.findUnique({
        where: { token: input.token },
    });
    if (!invitation) {
        throw new Error('Invitation not found');
    }
    if (invitation.status !== 'PENDING') {
        throw new Error('Invitation is no longer valid');
    }
    if (invitation.expiresAt < new Date()) {
        await prisma.invitation.update({
            where: { id: invitation.id },
            data: { status: 'EXPIRED' },
        });
        throw new Error('Invitation has expired');
    }
    // Check if user email matches invitation
    const user = await prisma.user.findUnique({
        where: { id: input.userId },
        select: { email: true },
    });
    if (!user || user.email !== invitation.recipientEmail) {
        throw new Error('Email mismatch - this invitation was sent to a different email');
    }
    // Check if already a member
    const existingMember = await prisma.teamMember.findUnique({
        where: {
            storeId_userId: {
                storeId: invitation.storeId,
                userId: input.userId,
            },
        },
    });
    if (existingMember) {
        throw new Error('You are already a member of this store');
    }
    // Create team member and update invitation
    const [teamMember] = await prisma.$transaction([
        prisma.teamMember.create({
            data: {
                storeId: invitation.storeId,
                userId: input.userId,
                permissionsJson: invitation.permissionsJson,
            },
            include: {
                store: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    },
                },
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                    },
                },
            },
        }),
        prisma.invitation.update({
            where: { id: invitation.id },
            data: {
                status: 'ACCEPTED',
                acceptedAt: new Date(),
                recipientUserId: input.userId,
            },
        }),
    ]);
    return teamMember;
}
/**
 * Decline team invitation
 */
export async function declineInvitation(token) {
    const invitation = await prisma.invitation.findUnique({
        where: { token },
    });
    if (!invitation) {
        throw new Error('Invitation not found');
    }
    if (invitation.status !== 'PENDING') {
        throw new Error('Invitation is no longer valid');
    }
    return prisma.invitation.update({
        where: { id: invitation.id },
        data: {
            status: 'DECLINED',
            declinedAt: new Date(),
        },
    });
}
/**
 * Revoke invitation (by sender)
 */
export async function revokeInvitation(invitationId, userId, actorRole) {
    const invitation = await prisma.invitation.findUnique({
        where: { id: invitationId },
        include: {
            store: { select: { ownerUserId: true } },
        },
    });
    if (!invitation) {
        throw new Error('Invitation not found');
    }
    if (!(await canManageStoreMembers(userId, invitation.storeId, actorRole))) {
        throw new Error('Only store managers can revoke invitations');
    }
    if (invitation.status !== 'PENDING') {
        throw new Error('Can only revoke pending invitations');
    }
    return prisma.invitation.update({
        where: { id: invitationId },
        data: {
            status: 'REVOKED',
            revokedAt: new Date(),
        },
    });
}
/**
 * Get team members for a store
 */
export async function getStoreTeamMembers(storeId) {
    return prisma.teamMember.findMany({
        where: { storeId, isActive: true },
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    name: true,
                    phone: true,
                },
            },
        },
        orderBy: { addedAt: 'desc' },
    });
}
/**
 * Get active team members who can receive delivery assignments for a store.
 */
export async function getStoreDeliveryDrivers(storeId) {
    const members = await prisma.teamMember.findMany({
        where: { storeId, isActive: true },
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    name: true,
                    phone: true,
                },
            },
        },
        orderBy: { addedAt: 'desc' },
    });
    return members.filter((member) => {
        const permissions = Array.isArray(member.permissionsJson)
            ? member.permissionsJson.filter((permission) => typeof permission === 'string')
            : [];
        return (permissions.includes('FULL_ACCESS') ||
            permissions.includes('VIEW_DELIVERIES') ||
            permissions.includes('MANAGE_DELIVERIES') ||
            permissions.includes('ASSIGN_DELIVERIES'));
    });
}
/**
 * Stores the user can act on: owned stores plus stores where they are an active team member.
 * Owners often have no TeamMember row; include owned stores so vendor dashboards resolve stores.
 */
export async function getUserStoreAccess(userId) {
    const storeSelect = {
        id: true,
        name: true,
        slug: true,
        isPublished: true,
    };
    const [memberships, ownedStores] = await Promise.all([
        prisma.teamMember.findMany({
            where: { userId, isActive: true },
            include: {
                store: { select: storeSelect },
            },
        }),
        prisma.store.findMany({
            where: { ownerUserId: userId },
            select: storeSelect,
            orderBy: { name: 'asc' },
        }),
    ]);
    const byStoreId = new Map();
    for (const store of ownedStores) {
        byStoreId.set(store.id, {
            storeId: store.id,
            store,
            permissions: ['FULL_ACCESS'],
            addedAt: new Date(0),
        });
    }
    for (const m of memberships) {
        if (byStoreId.has(m.storeId))
            continue;
        byStoreId.set(m.storeId, {
            storeId: m.storeId,
            store: m.store,
            permissions: m.permissionsJson,
            addedAt: m.addedAt,
        });
    }
    return [...byStoreId.values()].sort((a, b) => String(a.store.name ?? '').localeCompare(String(b.store.name ?? '')));
}
/**
 * Update team member permissions
 */
export async function updateTeamMember(memberId, userId, input) {
    const member = await prisma.teamMember.findUnique({
        where: { id: memberId },
        include: {
            store: { select: { ownerUserId: true } },
        },
    });
    if (!member) {
        throw new Error('Team member not found');
    }
    if (!(await canManageStoreMembers(userId, member.storeId, input.actorRole))) {
        throw new Error('Only store managers can update team members');
    }
    const data = {};
    if (input.permissions !== undefined)
        data.permissionsJson = input.permissions;
    if (input.isActive !== undefined)
        data.isActive = input.isActive;
    return prisma.teamMember.update({
        where: { id: memberId },
        data,
    });
}
/**
 * Remove team member
 */
export async function removeTeamMember(memberId, userId, actorRole) {
    const member = await prisma.teamMember.findUnique({
        where: { id: memberId },
        include: {
            store: { select: { ownerUserId: true } },
        },
    });
    if (!member) {
        throw new Error('Team member not found');
    }
    if (!(await canManageStoreMembers(userId, member.storeId, actorRole))) {
        throw new Error('Only store managers can remove team members');
    }
    await prisma.teamMember.update({
        where: { id: memberId },
        data: { isActive: false },
    });
}
/**
 * Get pending invitations for a store
 */
export async function getStorePendingInvitations(storeId) {
    return prisma.invitation.findMany({
        where: {
            storeId,
            status: 'PENDING',
            expiresAt: { gt: new Date() },
        },
        include: {
            sender: {
                select: {
                    name: true,
                    email: true,
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });
}
/**
 * Get invitations received by a user
 */
export async function getUserInvitations(email) {
    return prisma.invitation.findMany({
        where: {
            recipientEmail: email,
            status: 'PENDING',
            expiresAt: { gt: new Date() },
        },
        include: {
            store: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                },
            },
            sender: {
                select: {
                    name: true,
                    email: true,
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });
}
/**
 * Check if user has permission for a store
 */
export async function hasStorePermission(userId, storeId, requiredPermission) {
    // Check if user is owner
    const store = await prisma.store.findUnique({
        where: { id: storeId },
        select: { ownerUserId: true },
    });
    if (store?.ownerUserId === userId) {
        return true; // Owners have all permissions
    }
    // Check team member permissions
    const member = await prisma.teamMember.findUnique({
        where: {
            storeId_userId: { storeId, userId },
        },
        select: {
            isActive: true,
            permissionsJson: true,
        },
    });
    if (!member || !member.isActive) {
        return false;
    }
    const permissions = member.permissionsJson;
    return permissions.includes('FULL_ACCESS') || permissions.includes(requiredPermission);
}
