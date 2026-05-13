/**
 * Recently added menu items (global newest).
 * Fetches more than `displayLimit` so UIs can filter (e.g. only items with photos) and still fill a grid.
 */
import { useQuery } from '@tanstack/react-query'
import { items } from '@api/apiWrapper'
import type { ItemResponse } from '@api/types'

const FETCH_MULTIPLIER = 8
const FETCH_CAP = 80

export function useNewestProducts(displayLimit = 8) {
  const fetchLimit = Math.min(Math.max(displayLimit * FETCH_MULTIPLIER, displayLimit), FETCH_CAP)

  return useQuery<ItemResponse[]>({
    queryKey: ['newest-products', displayLimit],
    queryFn: async () => {
      const envelope = await items.listPage({
        limit: String(fetchLimit),
        page: '1',
      })
      return envelope.data as unknown as ItemResponse[]
    },
    staleTime: 5 * 60 * 1000,
  })
}
