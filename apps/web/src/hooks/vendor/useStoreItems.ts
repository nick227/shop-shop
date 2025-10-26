/**
 * useStoreItems - Fetch store's items
 */
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@api/client'
import type { ItemResponse } from '@api/types'

export function useStoreItems(storeId?: string) {
  return useQuery<ItemResponse[]>({
    queryKey: ['items', storeId],
    queryFn: async () => {
      return await apiClient.items().listItems({
        storeId: storeId!,
      })
    },
    enabled: !!storeId,
    select: (data) => data || [],
  })
}

