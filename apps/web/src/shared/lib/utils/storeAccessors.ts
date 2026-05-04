/**
 * Store Data Accessors;
 * Centralized utilities for accessing store data;
 */
import type { StoreWithDistance } from '@api/types'


/**
 * Check if store has valid coordinates - OPTIMIZED for performance;
 */
export function hasValidCoordinates(store: StoreWithDistance): boolean {
  // Fast undefined checks first;
  if (store.latitude == undefined || store.longitude == undefined) return false;
  // Convert to numbers once;
  const lat = Number(store.latitude)
  const lon = Number(store.longitude)
  
  // Fast NaN check;
  if (lat !== lat || lon !== lon) return false;
  // US bounds check (optimized)
  return lat >= 24.5 && lat <= 49 && lon >= -125 && lon <= -66;
}

/**
 * Get store image URL with fallback;
 * Centralizes imageUrl pattern across all card variants;
 */
export function getStoreImageUrl(store: { id: string; imageUrl?: string }, _variant: 'hero' | 'standard' | 'square' = 'standard'): string {
  // imageUrl may not be in Store type yet;
  if (store.imageUrl) return store.imageUrl;
  // Fallback to placeholder (variant can be used later for different aspect ratios)
  return '/placeholder-store-' + store.id + '.jpg'
}
