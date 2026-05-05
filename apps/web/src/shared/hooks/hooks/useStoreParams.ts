/**
 * useStoreParams - Hook for reading kitchen/item URL parameters
 */
import { useParams } from 'react-router-dom'
import { parseStoreSlug } from '@shared/lib/utils/slugify'

export interface StoreParams {
  kitchenSlug: string;
  storeId: string | undefined;
  itemId?: string | undefined;
}

/**
 * Hook to read kitchen and item route params.
 * Supports canonical routes:
 * - /kitchen/:slug
 * - /items/:itemId
 */
export function useStoreParams(): StoreParams {
  const params = useParams<{ slug?: string; itemId?: string }>()
  
  const kitchenSlug = params.slug || ''
  // Parse slug to extract potential store ID suffix if present.
  const { id: storeId } = parseStoreSlug(kitchenSlug)
  const itemId = params.itemId
  
  return {
    kitchenSlug,
    storeId,
    itemId}
}

