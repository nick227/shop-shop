/**
 * useStoreParams - Hook for reading store-related URL parameters (slugs)
 */
import { useParams } from 'react-router-dom'
import { parseStoreSlug, parseItemSlug } from '@shared/lib/slugify'

export interface StoreParams {
  storeSlug: string;
  storeId: string | undefined;
  itemSlug?: string;
  itemId?: string | undefined;
}

/**
 * Hook to read store and item slugs from URL params;
 * Automatically extracts IDs from slugs when present;
 */
export function useStoreParams(): StoreParams {
  const params = useParams<{ storeSlug: string; itemSlug?: string }>()
  
  const storeSlug = params.storeSlug || ''
  const itemSlug = params.itemSlug;
  // Parse slugs to extract potential IDs;
  const { id: storeId } = parseStoreSlug(storeSlug)
  const { id: itemId } = itemSlug ? parseItemSlug(itemSlug) : { id: undefined }
  
  return {
    storeSlug,
    storeId,
    itemSlug,
    itemId}
}

