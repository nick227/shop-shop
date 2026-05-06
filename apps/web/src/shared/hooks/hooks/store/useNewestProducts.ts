/**
 * Recently added menu items (global newest).
 */
import { useQuery } from '@tanstack/react-query'
import { items } from '@api/apiWrapper'
import type { ItemResponse } from '@api/types'

export function useNewestProducts(limit = 8) {
  return useQuery<ItemResponse[]>({
    queryKey: ['newest-products', limit],
    queryFn: async () => {
      const envelope = await items.listPage({
        limit: String(limit),
        page: '1',
      })
      return envelope.data.slice(0, limit) as unknown as ItemResponse[]
    },
    staleTime: 5 * 60 * 1000,
  })
}
