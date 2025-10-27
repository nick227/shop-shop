/**
 * useStoreItems - Fetch store's items
 */
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@api/client'
import type { ItemResponse } from '@api/types'

export function useStoreItems(storeId?: string) {
  return useQuery({
    queryKey: ['items', storeId],
    queryFn: async () => {
      // Note: SDK doesn't support storeId filtering yet
      // This will return all items, not filtered by store
      const response = await apiClient.items().listItems({})
      return response.data || []
    },
    enabled: !!storeId,
    select: (data) => data || [],
  })
}

