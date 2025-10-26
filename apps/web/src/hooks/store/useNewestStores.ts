/**
 * useNewestStores - Fetch the newest 6 stores;
 */
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@api/client'
import type { StoreResponse } from '@api/types'

export function useNewestStores(limit = 6) {
  return useQuery<StoreResponse[]>({
    queryKey: ['newest-stores', limit],
    queryFn: async () => {
      console.log('🔍 Fetching newest stores...')
      const response = await apiClient.stores().listStores({ 
        isPublished: 'true',
        sortBy: 'createdAt',
        order: 'desc',
        limit: limit.toString()
      })
      console.log('📦 Newest stores response:', response)
      const stores = (response?.data || response || []).slice(0, limit) as StoreResponse[]
      console.log('✨ Newest stores selected:', stores)
      return stores;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes;
  })
}

