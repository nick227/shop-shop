import type { StoreResponse } from '@api/types'

type TeamMeStoreRow = {
  readonly storeId: string
  readonly store: Pick<StoreResponse, 'id' | 'name' | 'slug' | 'isPublished'>
}

export async function fetchTeamMeStores(): Promise<StoreResponse[]> {
  const response = await fetch('/api/team/me/stores', {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  })
  if (!response.ok) {
    const data: { error?: string; message?: string } = await response.json().catch(() => ({}))
    throw new Error(data.error || data.message || 'Failed to load stores')
  }
  const body = (await response.json()) as { stores?: TeamMeStoreRow[] }
  const rows = body.stores ?? []
  return rows.map((row) => ({ ...row.store, id: row.store.id }) as StoreResponse)
}
