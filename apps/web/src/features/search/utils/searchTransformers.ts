/**
 * Search Result Transformers
 * Convert search results to component-specific types
 */
import type { StoreSearchResult, ProductSearchResult } from '../types/search.types'
import type { StoreWithDistance, ItemResponse } from '@api/types'

/**
 * Transform search result to StoreWithDistance
 */
export function transformStoreResult(result: StoreSearchResult): StoreWithDistance {
  return {
    id: result.id,
    name: result.name,
    description: result.description,
    distance: result.distance,
    prepTimeMin: result.prepTimeMin,
    isPublished: result.isOpen ?? true,
    // Add other required Store fields with defaults
  } as StoreWithDistance
}

/**
 * Transform search result to Product
 */
export function transformProductResult(result: ProductSearchResult): ItemResponse {
  // Create a minimal ItemResponse with all required properties
  return {
    id: result.id,
    storeId: result.storeId || '',
    store: undefined, // Will be populated if needed
    title: result.title || 'Unknown Product',
    description: result.description || '',
    price: typeof result.price === 'number' ? result.price.toString() : (result.price || '0'),
    isActive: result.isActive || false,
    isSoldOut: result.isSoldOut || false,
    sortIndex: result.sortIndex || 0,
    stockQty: 0, // Default value since stockQty doesn't exist on ProductSearchResult
    optionsJson: null,
    allergensJson: null,
    nutritionJson: null,
    category: result.category || '',
    imageUrl: result.imageUrl || '',
    isVegan: false,
    isVegetarian: false,
    isGlutenFree: false,
    isDairyFree: false,
    isNutFree: false,
    isSpicy: false,
    isOrganic: false,
    isKeto: false,
    isLowCarb: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  } as unknown as ItemResponse
}

/**
 * Batch transform stores
 */
export function transformStoreResults(results: StoreSearchResult[]): StoreWithDistance[] {
  return results.map(transformStoreResult)
}

/**
 * Batch transform products
 */
export function transformProductResults(results: ProductSearchResult[]): ItemResponse[] {
  return results.map(transformProductResult)
}

