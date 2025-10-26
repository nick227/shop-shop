/**
 * useStoreParams - Hook for reading store-related URL parameters (slugs)
 */
import { useParams } from 'react-router-dom'
import { parseStoreSlug, parseItemSlug } from '@utils/slugify'

export interface StoreParams {
  storeSlug: string;
  storeId: string | null;
  itemSlug?: string;
  itemId?: string | null;
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
  const { id: itemId } = itemSlug ? parseItemSlug(itemSlug) : { id: null }
  
  return {
    storeSlug,
    storeId,
    itemSlug,
    itemId}
}

