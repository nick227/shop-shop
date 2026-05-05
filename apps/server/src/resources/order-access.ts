import type { HookContext } from '@packages/schemas'
import { prisma } from '@packages/db'

export type OrderAccessFields = Readonly<{
  id: string
  userId: string
  storeId: string
  assignedToUserId: string | null
}>

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

  if (role === 'ADMIN') {
    return
  }

  if (role === 'USER') {
    if (order.userId === uid) {
      return
    }
    throw new Error('Forbidden')
  }

  if (role === 'RIDER') {
    if (operation === 'read' && order.assignedToUserId === uid) {
      return
    }
    throw new Error('Forbidden')
  }

  if (role === 'VENDOR') {
    const store = await prisma.store.findUnique({
      where: { id: order.storeId },
      select: { ownerUserId: true },
    })
    if (store?.ownerUserId === uid) {
      return
    }
    throw new Error('Forbidden')
  }

  throw new Error('Forbidden')
}
