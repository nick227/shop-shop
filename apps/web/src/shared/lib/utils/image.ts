/**
 * Image utility functions;
 */
import { PLACEHOLDER_PREFIX } from '@shared/ui/primitives'

type PlaceholderType = 'item' | 'store' | 'product'

const PREFIX_MAP: Record<PlaceholderType, string> = {
  item: PLACEHOLDER_PREFIX.ITEM,
  store: PLACEHOLDER_PREFIX.STORE,
  product: PLACEHOLDER_PREFIX.PRODUCT}

/**
 * Get fallback image URL with placeholder;
 * @param imageUrl - Optional image URL;
 * @param id - Entity ID for placeholder;
 * @param type - Type of placeholder;
 * @param mediaAssets - Optional media assets array from backend;
 * @returns Image URL or placeholder;
 */
export function getImageUrl(
  imageUrl: string | undefined,
  id: string,
  type: PlaceholderType,
  mediaAssets?: Array<{ url: string; kind: string }>
): string {
  // Check for mediaAssets first (from backend with media relations)
  if (mediaAssets && mediaAssets.length > 0) {
    const firstImage = mediaAssets.find(asset => asset.kind === 'IMAGE' || !asset.kind)
    if (firstImage?.url) return firstImage.url
  }
  
  // Fallback to imageUrl property (if it exists)
  if (imageUrl) return imageUrl
  
  // Final fallback to placeholder
  return PREFIX_MAP[type] + id + '.jpg'
}

