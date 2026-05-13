/**
 * Image utility functions;
 */
import { generateColorFromSeed } from './colorGenerator'

type PlaceholderType = 'item' | 'store' | 'product'

/** SVG data URL so missing images still load (no static /placeholder-*.jpg files in public). */
function placeholderDataUrl(id: string, type: PlaceholderType): string {
  const fill = generateColorFromSeed(id + type)
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">' +
    '<rect width="100%" height="100%" fill="' +
    fill +
    '"/></svg>'
  return 'data:image/svg+xml,' + encodeURIComponent(svg)
}

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
  mediaAssets?: { url: string; kind: string }[]
): string {
  // Check for mediaAssets first (from backend with media relations)
  if (mediaAssets && mediaAssets.length > 0) {
    const firstImage = mediaAssets.find(asset => asset.kind === 'IMAGE' || !asset.kind)
    if (firstImage?.url) return firstImage.url
  }
  
  // Fallback to imageUrl property (if it exists)
  if (imageUrl) return imageUrl
  
  // Final fallback: inline SVG (static /placeholder-*.jpg paths are not shipped)
  return placeholderDataUrl(id, type)
}

