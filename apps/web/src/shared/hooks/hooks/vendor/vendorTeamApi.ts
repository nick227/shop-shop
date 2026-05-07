import type { StoreResponse } from '@api/types'

export function getVendorApiBase(): string {
  return (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
}

type TeamMeStoreRow = {
  readonly storeId: string
  readonly store: Pick<StoreResponse, 'id' | 'name' | 'slug' | 'isPublished'>
}

export async function fetchTeamMeStores(token: string): Promise<StoreResponse[]> {
  const response = await fetch(`${getVendorApiBase()}/team/me/stores`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })
  if (!response.ok) {
    const data: { error?: string; message?: string } = await response.json().catch(() => ({}))
    throw new Error(data.error || data.message || 'Failed to load stores')
  }
  const body = (await response.json()) as { stores?: TeamMeStoreRow[] }
  const rows = body.stores ?? []
  return rows.map((row) => ({ ...row.store, id: row.store.id }) as StoreResponse)
}
