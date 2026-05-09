import type { StoreResponse } from '@api/types'
import { authGet } from '@shared/lib/auth/authFetch'

interface TeamMeStoreRow {
  readonly storeId: string
  readonly store: Pick<StoreResponse, 'id' | 'name' | 'slug' | 'isPublished'>
}

export function getVendorApiBase(): string {
  return '/api/vendor'
}

export async function fetchTeamMeStores(): Promise<StoreResponse[]> {
  // Team routes are mounted server-side without the `/api` prefix.
  const response = await authGet('/team/me/stores')
  
  if (!response.ok) {
    const data = await response.json().catch(() => ({})) as { error?: string; message?: string }
    throw new Error(data.error || data.message || 'Failed to load stores')
  }
  
  const body = await response.json() as { stores?: TeamMeStoreRow[] }
  const rows = body.stores ?? []
  return rows.map((row) => ({ ...row.store, id: row.store.id }) as StoreResponse)
}
