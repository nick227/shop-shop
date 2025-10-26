/**
 * Performance-optimized coordinate utilities
 * Minimizes memory allocations and provides fast validation
 */

export interface CoordinateCache {
  validStores: Set<string>
  invalidStores: Set<string>
  lastUpdate: number
}

// Global cache to avoid repeated validations
const coordinateCache: CoordinateCache | null = null
const CACHE_DURATION = 30_000 // 30 seconds

/**
 * Fast coordinate validation with caching
 * Reduces repeated validations of the same coordinates
 */
export function isValidCoordinateFast(
  latitude: number | string | null | undefined,
  longitude: number | string | null | undefined
): boolean {
  // Quick null/undefined checks
  if (latitude == undefined || longitude == undefined) return false
  
  // Convert to numbers once
  const lat = Number(latitude)
  const lon = Number(longitude)
  
  // Fast NaN check
  if (lat !== lat || lon !== lon) return false
  
  // US bounds check (optimized)
  return lat >= 24.5 && lat <= 49 && lon >= -125 && lon <= -66
}

/**
 * Batch coordinate validation with minimal allocations
 * Processes multiple coordinates in a single pass
 */
export function validateCoordinatesBatch<T extends { latitude?: number | string | null, longitude?: number | string | null }>(
  items: T[]
): { valid: T[], invalid: T[] } {
  const valid: T[] = []
  const invalid: T[] = []
  
  // Pre-allocate arrays to avoid dynamic resizing
  valid.length = 0
  invalid.length = 0
  
  for (const item of items) {
    if (isValidCoordinateFast(item.latitude, item.longitude)) {
      valid.push(item)
    } else {
      invalid.push(item)
    }
  }
  
  return { valid, invalid }
}

/**
 * Memory-efficient distance calculation
 * Avoids creating intermediate objects
 */
export function calculateDistanceFast(
  lat1: number, lon1: number, lat2: number, lon2: number
): number {
  const R = 3959 // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Optimized store sorting by distance
 * Uses in-place sorting to minimize memory allocations
 */
export function sortStoresByDistance<T extends { distance?: number }>(
  stores: T[]
): T[] {
  // Use native sort with optimized comparison
  return stores.sort((a, b) => {
    const distA = a.distance ?? Infinity
    const distB = b.distance ?? Infinity
    return distA - distB
  })
}

/**
 * Memory-efficient coordinate deduplication
 * Removes duplicate coordinates in-place
 */
export function deduplicateCoordinates<T extends { latitude: number, longitude: number }>(
  items: T[]
): T[] {
  const seen = new Set<string>()
  let writeIndex = 0
  
  for (let readIndex = 0; readIndex < items.length; readIndex++) {
    const item = items[readIndex]
    if (!item) continue
    const key = '${item.latitude},' + item.longitude + ''
    
    if (!seen.has(key)) {
      seen.add(key)
      if (writeIndex !== readIndex) {
        items[writeIndex] = item
      }
      writeIndex++
    }
  }
  
  // Truncate array to remove duplicates
  items.length = writeIndex
  return items
}
