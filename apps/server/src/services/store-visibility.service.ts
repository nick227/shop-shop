import { getAccountCapabilities, hasStorePermission, prisma } from '@packages/db'

/**
 * Who may see a store, and how much of it.
 *
 * - Public: published and ACTIVE. Anyone, signed in or not, gets the public shape.
 * - Private (draft, unpublished, suspended, disabled): only the owner, store administrators,
 *   and the store's own active team. Everyone else gets the same "not found" a missing id gets,
 *   so a private store's existence never leaks through a different status or message.
 * - Full record: the owner, store administrators, and team members who manage store settings.
 */

export interface StoreViewer {
  readonly userId?: string
  readonly userRole?: string
}

export interface StoreVisibilityFacts {
  readonly id: string
  readonly ownerUserId?: unknown
  readonly isPublished?: unknown
  readonly status?: unknown
}

export function isPublicStore(store: { readonly isPublished?: unknown; readonly status?: unknown }): boolean {
  return store.isPublished === true && store.status === 'ACTIVE'
}

async function administersStores(userId: string): Promise<boolean> {
  return (await getAccountCapabilities(userId)).canAdministerStores
}

/** Owner, store administrator, or an active member of this store's team. */
export async function canSeePrivateStore(viewer: StoreViewer | undefined, store: StoreVisibilityFacts): Promise<boolean> {
  const userId = viewer?.userId
  if (!userId) return false
  if (store.ownerUserId === userId) return true
  if (await administersStores(userId)) return true
  const member = await prisma.teamMember.findFirst({ where: { storeId: store.id, userId, isActive: true }, select: { id: true } })
  return member !== null
}

/** Owner, store administrator, or a team member allowed to manage this store's settings. */
export async function canSeeFullStore(viewer: StoreViewer | undefined, store: StoreVisibilityFacts): Promise<boolean> {
  const userId = viewer?.userId
  if (!userId) return false
  if (store.ownerUserId === userId) return true
  if (await administersStores(userId)) return true
  return hasStorePermission(userId, store.id, 'MANAGE_STORE_SETTINGS')
}

/** For `?ownerUserId=` lists: only that owner, or a store administrator, sees their full list. */
export async function canSeeOwnerList(viewer: StoreViewer | undefined, ownerUserId: unknown): Promise<boolean> {
  const userId = viewer?.userId
  if (!userId) return false
  if (typeof ownerUserId === 'string' && ownerUserId === userId) return true
  return administersStores(userId)
}

/**
 * Thrown from the store resource's read check. The CRUD controller maps Prisma's P2025 to the
 * same 404 body it sends for an id that does not exist.
 */
export function storeNotFoundError(): Error {
  return Object.assign(new Error('store not found'), { code: 'P2025' })
}
