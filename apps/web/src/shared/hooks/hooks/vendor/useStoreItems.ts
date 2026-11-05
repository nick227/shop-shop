/**
 * useStoreItems - every item of one store. The store's team gets inactive and sold-out items too;
 * shoppers get only what is on sale (the server decides).
 *
 * The generated SDK's listItems() has no storeId parameter, so calling it returns the public
 * marketplace feed (other stores' items). The server does filter `/items` by `storeId`.
 */
import { useQuery } from '@tanstack/react-query'
import { authGet } from '@shared/lib/auth/authFetch'
import type { ItemResponse } from '@api/types'

/** Items per request; a menu longer than this is read page by page so nothing is left off. */
export const MENU_PAGE_LIMIT = 500
/** A safety stop, far above any real menu. */
const MAX_PAGES = 40

export const storeItemsQueryKey = (storeId: string | undefined) => ['store-items', storeId] as const

export async function fetchAllStoreItems(storeId: string): Promise<ItemResponse[]> {
  const all: ItemResponse[] = []
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const qs = new URLSearchParams({ storeId, limit: String(MENU_PAGE_LIMIT), page: String(page) })
    const response = await authGet(`/api/items?${qs.toString()}`)
    if (!response.ok) throw new Error('Failed to load menu items')
    const body = (await response.json()) as { data?: ItemResponse[]; total?: number }
    const rows = body.data ?? []
    all.push(...rows)
    const total = typeof body.total === 'number' ? body.total : undefined
    if (rows.length < MENU_PAGE_LIMIT || (total !== undefined && all.length >= total)) break
  }
  // Defensive: never show another store's items on this store's menu.
  const seen = new Set<string>()
  return all.filter((item) => item.storeId === storeId && !seen.has(item.id) && seen.add(item.id))
}

export function useStoreItems(storeId?: string) {
  return useQuery({
    queryKey: storeItemsQueryKey(storeId),
    queryFn: () => fetchAllStoreItems(storeId!),
    enabled: !!storeId,
  })
}
