import { prisma } from '../client.js'

import type { AccountCapabilities } from '@packages/schemas'
export type { AccountCapabilities } from '@packages/schemas'

export const NO_ACCOUNT_CAPABILITIES: AccountCapabilities = {
  platformRole: 'USER', vendorEnrollment: 'NONE', vendorAccessRevoked: false,
  canAccessVendorPortal: false, canCreateStore: false, canAdministerStores: false,
}

export function deriveAccountCapabilities(user: {
  role: string
  suspendedAt?: Date | null
  vendorAccessRevokedAt?: Date | null
  adminVendorWorkspace?: boolean
  adminCreateStores?: boolean
  vendorEnrollment?: { status: AccountCapabilities['vendorEnrollment'] } | null
  _count: { storesOwned: number; teamMemberships: number }
}): AccountCapabilities {
  const platformRole = user.role === 'ADMIN' ? 'ADMIN' : 'USER'
  const vendorEnrollment = user.vendorEnrollment?.status ?? 'NONE'
  const revoked = Boolean(user.vendorAccessRevokedAt || user.suspendedAt || vendorEnrollment === 'SUSPENDED')
  const canAdministerStores = !revoked && platformRole === 'ADMIN' && user.adminVendorWorkspace === true
  const canCreateStore = !revoked && (vendorEnrollment === 'APPROVED' ||
    (canAdministerStores && user.adminCreateStores === true))
  return {
    platformRole, vendorEnrollment, vendorAccessRevoked: revoked,
    canCreateStore, canAdministerStores,
    canAccessVendorPortal: !revoked && (canCreateStore || canAdministerStores ||
      user._count.storesOwned > 0 || user._count.teamMemberships > 0),
  }
}

/** Always read current authorities; JWT roles and client caches are not authorization. */
export async function getAccountCapabilities(userId: string): Promise<AccountCapabilities> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true, suspendedAt: true, vendorAccessRevokedAt: true,
      adminVendorWorkspace: true, adminCreateStores: true,
      vendorEnrollment: { select: { status: true } },
      _count: { select: { storesOwned: true, teamMemberships: { where: { isActive: true } } } },
    },
  })
  return user ? deriveAccountCapabilities(user) : { ...NO_ACCOUNT_CAPABILITIES }
}

/** Idempotent prototype opt-in. Rejected/suspended/revoked accounts cannot self-restore. */
export async function enrollVendor(userId: string) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId }, select: { vendorAccessRevokedAt: true, suspendedAt: true } })
    if (!user || user.vendorAccessRevokedAt || user.suspendedAt) throw new Error('Vendor access is revoked')
    return tx.vendorEnrollment.upsert({
      where: { userId }, update: {},
      create: { userId, status: 'APPROVED', source: 'PROTOTYPE_AUTO_APPROVAL', reviewedAt: new Date() },
    })
  })
}
