import { nanoid } from 'nanoid'
import { prisma } from '../client'

export type TeamMemberPermission =
  | 'VIEW_ORDERS'
  | 'MANAGE_ORDERS'
  | 'VIEW_ITEMS'
  | 'MANAGE_ITEMS'
  | 'VIEW_DELIVERIES'
  | 'MANAGE_DELIVERIES'
  | 'ASSIGN_DELIVERIES'
  | 'VIEW_ANALYTICS'
  | 'MANAGE_STORE_SETTINGS'
  | 'FULL_ACCESS'

export interface CreateInvitationInput {
  storeId: string
  senderUserId: string
  recipientEmail: string
  permissions: TeamMemberPermission[]
  message?: string
  expiryDays?: number
  actorRole?: string
}

export interface AcceptInvitationInput {
  token: string
  userId: string
}

export interface UpdateTeamMemberInput {
  permissions?: TeamMemberPermission[]
  isActive?: boolean
  actorRole?: string
}

async function canManageStoreMembers(userId: string, storeId: string, actorRole?: string): Promise<boolean> {
  if (actorRole === 'ADMIN') return true
  return hasStorePermission(userId, storeId, 'MANAGE_STORE_SETTINGS')
}

/**
 * Create and send team invitation
 */
export async function createInvitation(input: CreateInvitationInput) {
  // Verify store ownership
  const store = await prisma.store.findUnique({
    where: { id: input.storeId },
    select: { id: true, ownerUserId: true },
  })

  if (!store) {
    throw new Error('Store not found')
  }

  if (!(await canManageStoreMembers(input.senderUserId, input.storeId, input.actorRole))) {
    throw new Error('Only store managers can send invitations')
  }

  // Check if user is already a team member
  const existingMember = await prisma.teamMember.findFirst({
    where: {
      storeId: input.storeId,
      user: { email: input.recipientEmail },
      isActive: true,
    },
  })

  if (existingMember) {
    throw new Error('User is already a team member')
  }

  // Check for pending invitation to same email
  const existingInvitation = await prisma.invitation.findFirst({
    where: {
      storeId: input.storeId,
      recipientEmail: input.recipientEmail,
      status: 'PENDING',
      expiresAt: { gt: new Date() },
    },
  })

  if (existingInvitation) {
    throw new Error('Pending invitation already exists for this email')
  }

  // Generate unique token
  const token = nanoid(32)
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + (input.expiryDays || 7))

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
  })
}

/**
 * Get invitation by token
 */
export async function getInvitationByToken(token: string) {
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
  })
}

/**
 * Accept team invitation
 */
export async function acceptInvitation(input: AcceptInvitationInput) {
  const invitation = await prisma.invitation.findUnique({
    where: { token: input.token },
  })

  if (!invitation) {
    throw new Error('Invitation not found')
  }

  if (invitation.status !== 'PENDING') {
    throw new Error('Invitation is no longer valid')
  }

  if (invitation.expiresAt < new Date()) {
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: 'EXPIRED' },
    })
    throw new Error('Invitation has expired')
  }

  // Check if user email matches invitation
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { email: true },
  })

  if (!user || user.email !== invitation.recipientEmail) {
    throw new Error('Email mismatch - this invitation was sent to a different email')
  }

  // Check if already a member
  const existingMember = await prisma.teamMember.findUnique({
    where: {
      storeId_userId: {
        storeId: invitation.storeId,
        userId: input.userId,
      },
    },
  })

  if (existingMember) {
    throw new Error('You are already a member of this store')
  }

  // Create team member and update invitation
  const [teamMember] = await prisma.$transaction([
    prisma.teamMember.create({
      data: {
        storeId: invitation.storeId,
        userId: input.userId,
        permissionsJson: invitation.permissionsJson as object,
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
  ])

  return teamMember
}

/**
 * Decline team invitation
 */
export async function declineInvitation(token: string) {
  const invitation = await prisma.invitation.findUnique({
    where: { token },
  })

  if (!invitation) {
    throw new Error('Invitation not found')
  }

  if (invitation.status !== 'PENDING') {
    throw new Error('Invitation is no longer valid')
  }

  return prisma.invitation.update({
    where: { id: invitation.id },
    data: {
      status: 'DECLINED',
      declinedAt: new Date(),
    },
  })
}

/**
 * Revoke invitation (by sender)
 */
export async function revokeInvitation(invitationId: string, userId: string, actorRole?: string) {
  const invitation = await prisma.invitation.findUnique({
    where: { id: invitationId },
    include: {
      store: { select: { ownerUserId: true } },
    },
  })

  if (!invitation) {
    throw new Error('Invitation not found')
  }

  if (!(await canManageStoreMembers(userId, invitation.storeId, actorRole))) {
    throw new Error('Only store managers can revoke invitations')
  }

  if (invitation.status !== 'PENDING') {
    throw new Error('Can only revoke pending invitations')
  }

  return prisma.invitation.update({
    where: { id: invitationId },
    data: {
      status: 'REVOKED',
      revokedAt: new Date(),
    },
  })
}

/**
 * Get team members for a store
 */
export async function getStoreTeamMembers(storeId: string) {
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
  })
}

/**
 * Get active team members who can receive delivery assignments for a store.
 */
export async function getStoreDeliveryDrivers(storeId: string) {
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
  })

  return members.filter((member) => {
    const permissions = Array.isArray(member.permissionsJson)
      ? member.permissionsJson.filter((permission): permission is string => typeof permission === 'string')
      : []
    return (
      permissions.includes('FULL_ACCESS') ||
      permissions.includes('VIEW_DELIVERIES') ||
      permissions.includes('MANAGE_DELIVERIES') ||
      permissions.includes('ASSIGN_DELIVERIES')
    )
  })
}

/**
 * Get stores for a team member
 */
export async function getUserStoreAccess(userId: string) {
  const memberships = await prisma.teamMember.findMany({
    where: { userId, isActive: true },
    include: {
      store: {
        select: {
          id: true,
          name: true,
          slug: true,
          isPublished: true,
        },
      },
    },
  })

  return memberships.map((m) => ({
    storeId: m.storeId,
    store: m.store,
    permissions: m.permissionsJson as TeamMemberPermission[],
    addedAt: m.addedAt,
  }))
}

/**
 * Update team member permissions
 */
export async function updateTeamMember(
  memberId: string,
  userId: string,
  input: UpdateTeamMemberInput
) {
  const member = await prisma.teamMember.findUnique({
    where: { id: memberId },
    include: {
      store: { select: { ownerUserId: true } },
    },
  })

  if (!member) {
    throw new Error('Team member not found')
  }

  if (!(await canManageStoreMembers(userId, member.storeId, input.actorRole))) {
    throw new Error('Only store managers can update team members')
  }

  const data: Record<string, unknown> = {}
  if (input.permissions !== undefined) data.permissionsJson = input.permissions as object
  if (input.isActive !== undefined) data.isActive = input.isActive

  return prisma.teamMember.update({
    where: { id: memberId },
    data,
  })
}

/**
 * Remove team member
 */
export async function removeTeamMember(
  memberId: string,
  userId: string,
  actorRole?: string
): Promise<void> {
  const member = await prisma.teamMember.findUnique({
    where: { id: memberId },
    include: {
      store: { select: { ownerUserId: true } },
    },
  })

  if (!member) {
    throw new Error('Team member not found')
  }

  if (!(await canManageStoreMembers(userId, member.storeId, actorRole))) {
    throw new Error('Only store managers can remove team members')
  }

  await prisma.teamMember.update({
    where: { id: memberId },
    data: { isActive: false },
  })
}

/**
 * Get pending invitations for a store
 */
export async function getStorePendingInvitations(storeId: string) {
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
  })
}

/**
 * Get invitations received by a user
 */
export async function getUserInvitations(email: string) {
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
  })
}

/**
 * Check if user has permission for a store
 */
export async function hasStorePermission(
  userId: string,
  storeId: string,
  requiredPermission: TeamMemberPermission
): Promise<boolean> {
  // Check if user is owner
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: { ownerUserId: true },
  })

  if (store?.ownerUserId === userId) {
    return true // Owners have all permissions
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
  })

  if (!member || !member.isActive) {
    return false
  }

  const permissions = member.permissionsJson as TeamMemberPermission[]

  return permissions.includes('FULL_ACCESS') || permissions.includes(requiredPermission)
}
