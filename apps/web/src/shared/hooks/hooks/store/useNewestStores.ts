/**
 * useNewestStores — newest stores by createdAt (no geo filter).
 */
import { useQuery } from '@tanstack/react-query'
import { stores } from '@api/apiWrapper'
import type { StoreWithDistance } from '@api/types'

export function useNewestStores(limit = 6) {
  return useQuery<StoreWithDistance[]>({
    queryKey: ['newest-stores', limit],
    queryFn: async () => {
      const envelope = await stores.listPage({
        limit: String(limit),
        page: '1',
      })
      return envelope.data.slice(0, limit) as unknown as StoreWithDistance[]
    },
    staleTime: 5 * 60 * 1000,
  })
}

