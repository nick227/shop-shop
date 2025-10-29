/**
 * useMediaList - Fetch media for a store or item
 * Note: Media listing API is not available in the generated SDK
 * This is a mock implementation that returns empty data
 */
import { useQuery } from '@tanstack/react-query'
import type { MediaApiResponse } from '@api/types'

interface UseMediaListParams {
  storeId?: string;
  itemId?: string;
}

export function useMediaList({ storeId, itemId }: UseMediaListParams) {
  return useQuery<MediaApiResponse[]>({
    queryKey: ['media', 'list', { storeId, itemId }],
    queryFn: async (): Promise<MediaApiResponse[]> => {
      // Mock implementation - return empty array since API is not available
      return []
    },
    enabled: !!(storeId || itemId)
  })
}

