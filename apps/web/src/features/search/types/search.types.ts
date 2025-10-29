/**
 * Unified Search Types;
 * Flexible architecture for multi-entity search (stores, products, etc.)
 * Now extends schema-derived types for consistency
 */

import type { StoreResponse, ItemResponse } from '@packages/schemas'

/**
 * Search result types;
 */
export type SearchEntityType = 'store' | 'product' | 'post' | 'category'

/**
 * Base search result item;
 * All searchable entities extend this;
 */
export interface SearchResultItem {
  id: string;
  type: SearchEntityType;
  name: string;
  description?: string;
  imageUrl?: string;
  relevanceScore?: number;
}

/**
 * Store search result;
 * Extends schema-derived StoreResponse
 */
export interface StoreSearchResult extends SearchResultItem {
  type: 'store'
  distance?: number;
  rating?: number;
  prepTimeMin: number;
  isOpen?: boolean;
  category?: string;
  // Include all StoreResponse fields
  store: StoreResponse;
}

/**
 * Product search result;
 * Extends schema-derived ItemResponse
 */
export interface ProductSearchResult extends SearchResultItem {
  type: 'product'
  title?: string;
  price: number;
  storeName: string;
  storeId: string;
  category?: string;
  available?: boolean;
  isActive?: boolean;
  isSoldOut?: boolean;
  sortIndex?: number;
  // Include all ItemResponse fields
  item: ItemResponse;
}

/**
 * Union type for all search results;
 */
export type SearchResult = StoreSearchResult | ProductSearchResult;
/**
 * Search input methods;
 */
export type SearchInputType = 'keyword' | 'location' | 'category' | 'voice'

/**
 * Sort options that work across all entity types;
 */
export type SearchSortOption = 
  | 'relevance'
  | 'distance'
  | 'rating'
  | 'price-asc'
  | 'price-desc'
  | 'name'
  | 'newest'

/**
 * Filter options;
 */
export interface SearchFilters {
  // Input;
  query?: string;
  inputType?: SearchInputType;
  // Location;
  location?: {
    latitude: number;
    longitude: number;
    radiusMiles: number;
  }
  
  // Entity filtering;
  entityTypes?: SearchEntityType[]
  
  // Common filters;
  category?: string;
  priceRange?: {
    min: number;
    max: number;
  }
  
  // Availability;
  openNow?: boolean;
  inStock?: boolean;
  // Sorting;
  sortBy?: SearchSortOption;
}

/**
 * Paginated search response;
 */
export interface SearchResponse<T = SearchResult> {
  items: T[]
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  query: string;
  filters: SearchFilters;
  facets?: SearchFacets;
}

/**
 * Search facets for filtering;
 */
export interface SearchFacets {
  categories?: { name: string; count: number }[]
  priceRanges?: { min: number; max: number; count: number }[]
  distances?: { maxMiles: number; count: number }[]
  entityCounts?: Record<SearchEntityType, number>
}

/**
 * Search state for UI management;
 */
export interface SearchState {
  query: string;
  filters: SearchFilters;
  isLoading: boolean;
  error: Error | undefined;
  results: SearchResponse | undefined;
}

/**
 * Type guard helpers;
 */
export function isStoreResult(result: SearchResult): result is StoreSearchResult {
  return result.type === 'store'
}

export function isProductResult(result: SearchResult): result is ProductSearchResult {
  return result.type === 'product'
}

/**
 * Group results by type in single pass (O(n) instead of O(2n))
 * Memory-efficient: One loop, no intermediate arrays;
 */
export function groupResultsByType(results: SearchResult[]): {
  stores: StoreSearchResult[]
  products: ProductSearchResult[]
} {
  const stores: StoreSearchResult[] = []
  const products: ProductSearchResult[] = []

  // Single-pass iteration;
  for (const result of results) {
    if (isStoreResult(result)) {
      stores.push(result)
    } else if (isProductResult(result)) {
      products.push(result)
    }
  }

  return { stores, products }
}

