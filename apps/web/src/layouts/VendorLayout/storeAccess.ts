/**
 * What the signed-in member can do in a store. The server stays the authority;
 * these checks keep the nav and routes from offering what would be refused.
 */
import type { VendorStore } from '@shared/hooks/hooks/vendor'

export type StorePermission =
  | 'VIEW_ORDERS'
  | 'MANAGE_ORDERS'
  | 'VIEW_ITEMS'
  | 'MANAGE_ITEMS'
  | 'VIEW_DELIVERIES'
  | 'MANAGE_DELIVERIES'
  | 'VIEW_FINANCE'
  | 'MANAGE_STORE_SETTINGS'
  | 'FULL_ACCESS'

/** `owner` for actions the server limits to the store owner, such as editing settings. */
export type StoreAccess = StorePermission | 'owner'

export function canAccess(store: Pick<VendorStore, 'permissions' | 'isOwner'> | undefined, need?: StoreAccess): boolean {
  if (!store) return false
  if (!need || store.isOwner) return true
  if (need === 'owner') return false
  const permissions = store.permissions ?? []
  return permissions.includes('FULL_ACCESS') || permissions.includes(need)
}
