/**
 * Newest published store for marketing hero (API order: createdAt desc).
 */
import { useQuery } from '@tanstack/react-query'
import { stores } from '@api/apiWrapper'
import type { StoreWithDistance } from '@api/types'

export function useHeroStore() {
  return useQuery<StoreWithDistance | null>({
    queryKey: ['hero-store'],
    queryFn: async () => {
      const envelope = await stores.listPage({ limit: '1', page: '1' })
      const first = envelope.data[0] as unknown as StoreWithDistance | undefined
      return first ?? null
    },
    staleTime: 10 * 60 * 1000,
  })
}
