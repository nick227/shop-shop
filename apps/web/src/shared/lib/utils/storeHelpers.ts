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

// ========================================
// City Formatting Utilities
// ========================================

/**
 * Format a list of cities into a readable string with proper conjunctions
 */
function formatCitiesList(cities: string[], totalCities: number): string {
  if (totalCities === 0) return ''
  if (totalCities === 1) return cities[0] || ''
  
  let result = cities.join(', ')
  
  // Replace last comma with "and" for 2-3 items
  if (totalCities <= 3) {
    const lastComma = result.lastIndexOf(', ')
    if (lastComma !== -1) {
      result = `${result.slice(0, Math.max(0, lastComma))} and${result.slice(Math.max(0, lastComma + 2))}`
    }
  }
  
  return result
}

/**
 * Add "more areas" suffix for truncated lists
 */
function addMoreAreasSuffix(baseResult: string, shownCount: number, totalCount: number): string {
  if (shownCount >= totalCount) return baseResult
  
  const remaining = totalCount - shownCount
  const suffix = ` and ${remaining} more ${remaining === 1 ? 'area' : 'areas'}`
  return baseResult + suffix
}

/**
 * Build city strings for both full and short formats
 */
function buildCityStrings(cities: string[], totalCities: number): { full: string; short: string } {
  // Short version (max 2 cities)
  const shortCities = cities.slice(0, 2)
  let shortResult = formatCitiesList(shortCities, Math.min(2, totalCities))
  shortResult = addMoreAreasSuffix(shortResult, shortCities.length, totalCities)
  
  // Full version (max 3 cities)
  const fullCities = cities.slice(0, 3)
  let fullResult = formatCitiesList(fullCities, Math.min(3, totalCities))
  fullResult = addMoreAreasSuffix(fullResult, fullCities.length, totalCities)
  
  return { full: fullResult, short: shortResult }
}

/**
 * Extract unique cities from stores
 */
function extractUniqueCities(stores: StoreWithDistance[]): string[] {
  const cityStateMap = new Map<string, string>()
  
  for (const store of stores) {
    const city = store.addressCity
    const state = store.addressState

    if (city && !cityStateMap.has(city)) {
      cityStateMap.set(city, state ?? '')
      if (cityStateMap.size >= 6) break // Early exit (enough for both formats)
    }
  }
  
  return [...cityStateMap.keys()]
}

/**
 * Extract unique city names in BOTH formats with single pass
 * Critical optimization: Eliminates redundant iteration
 * Returns both full (3 cities) and short (2 cities) versions
 */
export function getStoreCitiesContextDual(stores: StoreWithDistance[]): CitiesContextResult {
  const empty = { full: '', short: '' }
  if (!stores?.length) return empty
  
  const cities = extractUniqueCities(stores)
  const totalCities = cities.length
  
  if (totalCities === 0) return empty
  
  // Single city - both formats identical
  if (totalCities === 1) {
    const city = cities[0]
    const formatted = city || ''
    return { full: formatted, short: formatted }
  }
  
  return buildCityStrings(cities, totalCities)
}
