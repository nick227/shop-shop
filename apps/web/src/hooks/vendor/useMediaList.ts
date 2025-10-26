/**
 * useMediaList - Fetch media for a store or item
 * Now using generated hooks for better type safety and consistency
 */
import { useMedias } from '../generated'

interface UseMediaListParams {
  storeId?: string;
  itemId?: string;
}

export function useMediaList({ storeId, itemId }: UseMediaListParams) {
  return useMedias({
    storeId,
    itemId,
    enabled: !!(storeId || itemId)
  })
}

