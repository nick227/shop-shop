import type { TeamMemberPermission } from '@packages/db'
import { prisma } from '@packages/db'

export type StoreAccessScope = 'settings' | 'orders' | 'content' | 'analytics'

const SCOPE_PERMS: Record<StoreAccessScope, readonly TeamMemberPermission[]> = {
  settings: ['MANAGE_SETTINGS', 'FULL_ACCESS'],
  orders: ['MANAGE_ORDERS', 'FULL_ACCESS'],
  content: ['MANAGE_ITEMS', 'FULL_ACCESS'],
  analytics: ['VIEW_ANALYTICS', 'MANAGE_SETTINGS', 'FULL_ACCESS'],
}

function parseTeamPermissions(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((p): p is string => typeof p === 'string')
}

/**
 * True if the user is ADMIN, store owner, or an active team member with a permission
 * that matches the given scope.
 */
export async function userHasStoreAccess(
  userId: string,
  userRole: string,
  storeId: string,
  scope: StoreAccessScope
): Promise<boolean> {
  if (userRole === 'ADMIN') return true

  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: { ownerUserId: true },
  })
  if (!store) return false
  if (store.ownerUserId === userId) return true

  const member = await prisma.teamMember.findFirst({
    where: { storeId, userId, isActive: true },
    select: { permissionsJson: true },
  })
  if (!member) return false

  const perms = parseTeamPermissions(member.permissionsJson)
  const required = SCOPE_PERMS[scope]
  return required.some((p) => perms.includes(p))
}
