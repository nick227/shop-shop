/**
 * Store Data Accessors;
 * Centralized utilities for accessing store data;
 */
import type { StoreWithDistance } from '@api/types'

/**
 * Get store city name;
 */
export function getStoreCity(store: StoreWithDistance): string | null {
  return store.addressCity;
}

/**
 * Get store state;
 */
export function getStoreState(store: StoreWithDistance): string | null {
  return store.addressState;
}

/**
 * Get store street;
 */
export function getStoreStreet(store: StoreWithDistance): string | null {
  return store.addressStreet;
}

/**
 * Get store zip;
 */
export function getStoreZip(store: StoreWithDistance): string | null {
  return store.addressZip;
}

/**
 * Get formatted city, state;
 */
export function getStoreCityState(store: StoreWithDistance): string | undefined {    
  const city = store.addressCity;
  const state = store.addressState;
  if (!city) return undefined;
  return state
    ? `${city}, ${state}`
    : city;
}

/**
 * Get store coordinates (validated)
 */
export function getStoreCoordinates(store: StoreWithDistance): {
  lat: number;
  lon: number;
} | undefined {
  const lat = Number(store.latitude)
  const lon = Number(store.longitude)
  
  if (Number.isNaN(lat) || Number.isNaN(lon)) return undefined;
  return { lat, lon }
}

/**
 * Check if store has valid coordinates - OPTIMIZED for performance;
 */
export function hasValidCoordinates(store: StoreWithDistance): boolean {
  // Fast null checks first;
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
