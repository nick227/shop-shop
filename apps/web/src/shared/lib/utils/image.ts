/**
 * Image utility functions;
 */
import { PLACEHOLDER_PREFIX } from '@shared/ui/primitives/Carousel/constants'

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
 * @returns Image URL or placeholder;
 */
export function getImageUrl(
  imageUrl: string | undefined,
  id: string,
  type: PlaceholderType
): string {
  return imageUrl || PREFIX_MAP[type] + id + '.jpg'
}

