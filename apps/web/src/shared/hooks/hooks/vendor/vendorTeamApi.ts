import type { StoreResponse } from '@api/types'
import { authGet } from '@shared/lib/auth/authFetch'

/** A store the signed-in user can work in, as returned by `/team/me/stores`. */
export type VendorStore = StoreResponse & {
  readonly imageUrl?: string | null
  /** The merchant's own pause; `status` is the separate, admin-only restriction. */
  readonly acceptingOrders?: boolean
  readonly ordersPausedReason?: string | null
  /** Team permissions for this user in this store; owners hold FULL_ACCESS. */
  readonly permissions: readonly string[]
  readonly isOwner: boolean
}

interface TeamMeStoreRow {
  readonly storeId: string
  readonly store: Pick<
    StoreResponse,
    'id' | 'name' | 'slug' | 'isPublished' | 'status' | 'addressCity' | 'addressState'
  > & { readonly imageUrl?: string | null; readonly acceptingOrders?: boolean; readonly ordersPausedReason?: string | null }
  readonly permissions?: readonly string[] | null
  readonly isOwner?: boolean
}

export function getVendorApiBase(): string {
  return '/api'
}

export async function fetchTeamMeStores(): Promise<VendorStore[]> {
  const response = await authGet(`${getVendorApiBase()}/team/me/stores`)
  
  if (!response.ok) {
    const data = await response.json().catch(() => ({})) as { error?: string; message?: string }
    throw new Error(data.error || data.message || 'Failed to load stores')
  }
  
  const body = await response.json() as { stores?: TeamMeStoreRow[] }
  const rows = body.stores ?? []
  return rows.map(
    (row) =>
      ({
        ...row.store,
        id: row.store.id,
        permissions: Array.isArray(row.permissions) ? row.permissions : [],
        isOwner: Boolean(row.isOwner),
      }) as unknown as VendorStore,
  )
}
