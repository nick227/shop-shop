/**
 * useStoreItems - every item of one store, including inactive and sold-out ones.
 *
 * The generated SDK's listItems() has no storeId parameter, so calling it returns the public
 * marketplace feed (other stores' items). The server does filter `/items` by `storeId`.
 */
import { useQuery } from '@tanstack/react-query'
import { authGet } from '@shared/lib/auth/authFetch'
import type { ItemResponse } from '@api/types'

/** High enough to hold a whole menu in one page; the menu screen groups and searches client-side. */
const MENU_PAGE_LIMIT = 500

export const storeItemsQueryKey = (storeId: string | undefined) => ['store-items', storeId] as const

export function useStoreItems(storeId?: string) {
  return useQuery({
    queryKey: storeItemsQueryKey(storeId),
    queryFn: async (): Promise<ItemResponse[]> => {
      const qs = new URLSearchParams({ storeId: storeId!, limit: String(MENU_PAGE_LIMIT) })
      const response = await authGet(`/api/items?${qs.toString()}`)
      if (!response.ok) throw new Error('Failed to load menu items')
      const body = (await response.json()) as { data?: ItemResponse[] }
      // Defensive: never show another store's items on this store's menu.
      return (body.data ?? []).filter((item) => item.storeId === storeId)
    },
    enabled: !!storeId,
  })
}
