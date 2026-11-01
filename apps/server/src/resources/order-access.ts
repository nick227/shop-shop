import type { HookContext } from '@packages/schemas'
import { getAccountCapabilities, prisma } from '@packages/db'

export type OrderAccessFields = Readonly<{
  id: string
  userId: string
  storeId: string
  assignedToUserId: string | null
}>

function parsePermissions(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((p): p is string => typeof p === 'string') : []
}

async function hasStorePermission(
  userId: string,
  storeId: string,
  permissions: readonly string[],
): Promise<boolean> {
  const access = await getAccountCapabilities(userId)
  if (!access.canAccessVendorPortal) return false
  if (access.canAdministerStores) return true
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: { ownerUserId: true },
  })
  if (store?.ownerUserId === userId) return true

  const member = await prisma.teamMember.findFirst({
    where: { storeId, userId, isActive: true },
    select: { permissionsJson: true },
  })
  const memberPermissions = parsePermissions(member?.permissionsJson)
  return memberPermissions.includes('FULL_ACCESS') || permissions.some((p) => memberPermissions.includes(p))
}

export async function assertOrderAccess(
  order: OrderAccessFields,
  context: HookContext | undefined,
  operation: 'read' | 'update' | 'delete'
): Promise<void> {
  const uid = context?.userId
  const role = context?.userRole
  if (operation === 'read' && !uid) {
    return
  }

  if (!uid || !role) {
    throw new Error('Forbidden')
  }

  if (order.userId === uid && operation !== 'delete') return
  if (role === 'RIDER' && order.assignedToUserId === uid) return
  if (await hasStorePermission(uid, order.storeId, operation === 'read'
    ? ['VIEW_ORDERS', 'MANAGE_ORDERS', 'VIEW_DELIVERIES', 'MANAGE_DELIVERIES', 'ASSIGN_DELIVERIES']
    : ['MANAGE_ORDERS', 'MANAGE_DELIVERIES', 'ASSIGN_DELIVERIES'])) return
  throw new Error('Forbidden')
}
