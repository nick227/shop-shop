/**
 * Store Helper Functions
 * Reusable utilities for store operations
 */
import type { StoreWithDistance, StoreSortOption } from '@api/types'

/**
 * Sort stores by various criteria
 * Memory-optimized: Lazy copy only when needed (rating returns original)
 */
export function sortStores(
  stores: StoreWithDistance[],
  sortBy: StoreSortOption
): StoreWithDistance[] {
  if (!stores?.length) return stores

  // Optimization: Skip copy for rating (not implemented yet)
  if (sortBy === 'rating') return stores

  // Create copy only when actually sorting
  const sorted = [...stores]

  switch (sortBy) {
    case 'distance': {
      return sorted.sort((a, b) => {
        const aDistance = a.distance ?? Infinity
        const bDistance = b.distance ?? Infinity
        return aDistance - bDistance
      })
    }
    case 'name': {
      return sorted.sort((a, b) => a.name.localeCompare(b.name))
    }
    // Note: prepTime removed as it's not a valid StoreSortOption
    // case 'prepTime': { 
    //   return sorted.sort((a, b) => (a.prepTimeMin ?? 0) - (b.prepTimeMin ?? 0))
    // }
    default: {
      return stores
    }  // Return original for unknown sort types
  }
}

/**
 * Get plural form for store count
 */
export function getStoreCountText(count: number): string {
  return `${count} store${count === 1 ? '' : 's'}`;
}

/**
 * Get store result text with context
 */
export function getStoreResultsText(count: number, filtered = false): string {  
  const countText = getStoreCountText(count)
  return filtered ? `${countText} found` : countText
}

/**
 * Result type for dual-format city context (full & condensed)
 */
export interface CitiesContextResult {
  full: string    // Up to 3 cities: "Austin, Dallas, and Houston"
  short: string   // Up to 2 cities: "Austin and Dallas"
}

/**
 * Extract unique city names in BOTH formats with single pass
 * Critical optimization: Eliminates redundant iteration
 * Returns both full (3 cities) and short (2 cities) versions
 */
export function getStoreCitiesContextDual(stores: StoreWithDistance[]): CitiesContextResult {
  const empty = { full: '', short: '' }
  if (!stores?.length) return empty
  
  // Collect up to 6 unique cities (enough for both versions) - single pass
  const cityStateMap = new Map<string, string>()
  
  for (const store of stores) {
    const city = store.addressCity
        const state = store.addressState

    if (city && !cityStateMap.has(city)) {
      cityStateMap.set(city, state ?? '')
      if (cityStateMap.size >= 6) break  // Early exit (enough for both formats)
    }
  }
  
  const totalCities = cityStateMap.size
  if (totalCities === 0) return empty
  
  // Single city - both formats identical
  if (totalCities === 1) {
    const firstEntry = cityStateMap.entries().next().value
    if (!firstEntry) return empty
    const [city, state] = firstEntry
    const formatted = state ? '${city}, ' + state + '' : city
    return { full: formatted, short: formatted }
  }
  
  // Build both strings in parallel (single iteration)
  let fullResult = ''
  let shortResult = ''
  let count = 0
  
  for (const [city] of cityStateMap) {
    // Short version (max 2 cities)
    if (count < 2) {
      if (count > 0) shortResult += ', '
      shortResult += city
    }
    
    // Full version (max 3 cities)
    if (count < 3) {
      if (count > 0) fullResult += ', '
      fullResult += city
    }
    
    count++
    if (count >= 3 && totalCities <= 3) break  // Can exit early if we have all we need
  }
  
  // Handle short version (2 cities)
  if (totalCities === 2) {
    const lastComma = shortResult.lastIndexOf(', ')
    if (lastComma !== -1) {
      shortResult = `${shortResult.slice(0, Math.max(0, lastComma))} and${shortResult.slice(Math.max(0, lastComma + 1))}`
    }
  } else if (totalCities > 2) {
        shortResult += ` and ${totalCities - 2} more ${totalCities - 2 === 1 ? 'area' : 'areas'}`                                                              
  }

  // Handle full version (3 cities)
  if (totalCities === 3) {
    const lastComma = fullResult.lastIndexOf(', ')
    if (lastComma !== -1) {
      fullResult = `${fullResult.slice(0, Math.max(0, lastComma))} and${fullResult.slice(Math.max(0, lastComma + 1))}`                                          
    }
  } else if (totalCities > 3) {
    fullResult += ` and ${totalCities - 3} more ${totalCities - 3 === 1 ? 'area' : 'areas'}`                                                               
  }
  
  return { full: fullResult, short: shortResult }
}

