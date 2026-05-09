/**
 * Store Data Accessors;
 * Centralized utilities for accessing store data;
 */
import type { StoreWithDistance } from '@api/types'

function normalizeRemoteUrl(url: string): string {
  // Fix the common "https:/" (missing slash) issue coming from some sources.
  if (url.startsWith('https:/') && !url.startsWith('https://')) {
    return url.replace(/^https:\//, 'https://')
  }
  if (url.startsWith('http:/') && !url.startsWith('http://')) {
    return url.replace(/^http:\//, 'http://')
  }
  return url
}


/**
 * Check if store has valid coordinates - OPTIMIZED for performance;
 */
export function hasValidCoordinates(store: StoreWithDistance): boolean {
  // Fast undefined checks first;
  if (store.latitude == undefined || store.longitude == undefined) return false
  // Convert to numbers once;
  const lat = Number(store.latitude)
  const lon = Number(store.longitude)
  
  // Fast NaN check;
  if (lat !== lat || lon !== lon) return false
  // US bounds check (optimized)
  return lat >= 24.5 && lat <= 49 && lon >= -125 && lon <= -66
}

/**
 * Get store image URL with fallback;
 * Centralizes imageUrl pattern across all card variants;
 */
export function getStoreImageUrl(store: { id: string; imageUrl?: string; mediaAssets?: Array<{ url: string; kind: string }> }, _variant: 'hero' | 'standard' | 'square' = 'standard'): string {
  // Check for mediaAssets first (from backend with media relations)
  if (store.mediaAssets && store.mediaAssets.length > 0) {
    const firstImage = store.mediaAssets.find(asset => asset.kind === 'IMAGE' || !asset.kind)
    if (firstImage?.url) return normalizeRemoteUrl(firstImage.url)
  }
  
  // Fallback to imageUrl property (if it exists)
  if (store.imageUrl) return normalizeRemoteUrl(store.imageUrl)
  
  // Final fallback to placeholder (variant can be used later for different aspect ratios)
  return '/placeholder-store-' + store.id + '.jpg'
}
