/**
 * useFeaturedStores - Fetch featured stores (stores with highest engagement)
 */
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@api/client'
import type { StoreWithDistance } from '@api/types'

export function useFeaturedStores(limit = 4, options?: { readonly enabled?: boolean }) {
  const enabled = options?.enabled ?? true
  return useQuery<StoreWithDistance[]>({
    queryKey: ['featured-stores', limit],
    enabled,
    queryFn: async () => {
      console.log('⭐ Fetching featured stores...')
      // For now, fetch published stores and pick some at random;
      // In the future, you could add a 'featured' flag to the Store model;
      const response = await apiClient.stores().listStores({ 
        limit: (limit * 2).toString() // Reduced from 3x to 2x for better performance
      })
      console.log('📦 Featured stores response:', response)
      const stores = (response?.data || response || []) as unknown as StoreWithDistance[]
      
      // Shuffle and take the first 'limit' items;
      const shuffled = [...stores].sort(() => 0.5 - Math.random())
      const featured = shuffled.slice(0, limit)
      console.log('✨ Featured stores selected:', featured)
      return featured;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes;
  })
}

