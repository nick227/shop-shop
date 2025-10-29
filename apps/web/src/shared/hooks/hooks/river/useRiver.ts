/**
 * useRiver Hook - River feed data management
 * Handles fetching and managing river posts for stores
 */
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@api/client'
import { createQueryErrorHandler, queryRetryConfig } from '../utils/errorHandling'

interface UseRiverOptions {
  storeId?: string
  enabled?: boolean
}

export function useRiver({ storeId, enabled = true }: UseRiverOptions) {
  return useQuery({
    queryKey: ['river', storeId],
    queryFn: async () => {
      if (!storeId) return []
      
      try {
        // TODO: Replace with actual river API call when available
        // const response = await apiClient.river().getPosts({ storeId })
        // return response.data || []
        
        // Temporary: Return empty array until API is ready
        return []
      } catch (error) {
        throw await createQueryErrorHandler()(error)
      }
    },
    enabled: enabled && !!storeId,
    ...queryRetryConfig
  })
}

export function useRiverPosts(storeId?: string) {
  return useRiver({ storeId })
}
