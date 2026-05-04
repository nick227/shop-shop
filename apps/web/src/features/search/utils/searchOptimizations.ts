/**
 * Search Performance Optimizations
 * Memory-efficient loops and data accessors
 */
import type { SearchResult, StoreSearchResult, ProductSearchResult } from '../types/search.types'
import { isStoreResult, isProductResult } from '../types/search.types'
import { transformStoreResult, transformProductResult } from './searchTransformers'
import type { StoreWithDistance, ItemResponse } from '@api/types'

/**
 * Group and transform results in a single pass (O(n) instead of O(3n))
 * Memory-efficient: Single loop, no intermediate arrays
 */
export function groupAndTransformResults(results: SearchResult[]): {
  stores: StoreWithDistance[]
  products: ItemResponse[]
} {
  const stores: StoreWithDistance[] = []
  const products: ItemResponse[] = []

  // Single loop - filter AND transform simultaneously
  for (const result of results) {
    if (result.type === 'store') {
      stores.push(transformStoreResult(result))
    } else if (result.type === 'product') {
      products.push(transformProductResult(result))
    }
  }

  return { stores, products }
}

/**
 * Get top N items without creating intermediate arrays
 * Memory-efficient: No slice, direct iteration with limit
 */
export function getTopItems<T>(items: T[], count: number): T[] {
  if (items.length <= count) return items // No copy needed
  
  const result: T[] = []
  for (let i = 0; i < count && i < items.length; i++) {
    const item = items[i]
    if (item) {
      result.push(item)
    }
  }
  return result
}

/**
 * Filter and transform in single pass
 * Avoids creating intermediate filtered array
 */
export function filterAndTransformStores(
  results: SearchResult[],
  predicate?: (store: StoreSearchResult) => boolean
): StoreWithDistance[] {
  const transformed: StoreWithDistance[] = []

  for (const result of results) {
    if (result.type === 'store') {
      const store = result
      if (!predicate || predicate(store)) {
        transformed.push(transformStoreResult(store))
      }
    }
  }

  return transformed
}

/**
 * Partition results by type without filtering twice
 * Single pass O(n) instead of O(2n)
 */
export interface PartitionedResults {
  stores: StoreSearchResult[]
  products: ProductSearchResult[]
  total: number
}

export function partitionResults(results: SearchResult[]): PartitionedResults {
  const stores: StoreSearchResult[] = []
  const products: ProductSearchResult[] = []

  for (const result of results) {
    if (isStoreResult(result)) {
      stores.push(result)
    } else if (isProductResult(result)) {
      products.push(result)
    }
  }

  return {
    stores,
    products,
    total: results.length
  }
}

/**
 * Lazy slice iterator - yields items without creating array copy
 * Use for rendering large lists
 */
export function* lazySlice<T>(items: T[], start: number, end: number) {
  const actualEnd = Math.min(end, items.length)
  for (let i = start; i < actualEnd; i++) {
    yield items[i]
  }
}

/**
 * Chunked processing for large arrays - Memory optimized
 * Prevents blocking main thread without creating intermediate arrays
 */
export async function processInChunks<T, R>(
  items: T[],
  processor: (item: T) => R,
  chunkSize = 100
): Promise<R[]> {
  const results: R[] = []
  
  for (let i = 0; i < items.length; i += chunkSize) {
    // Process items directly without creating intermediate arrays
    for (let j = i; j < Math.min(i + chunkSize, items.length); j++) {
      const item = items[j]
      if (item) {
        results.push(processor(item))
      }
    }
    
    // Yield to main thread
    await new Promise(resolve => setTimeout(resolve, 0))
  }
  
  return results
}

