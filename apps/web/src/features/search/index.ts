/**
 * Unified Search Feature;
 * Export all search-related components, hooks, and types;
 */

// Types;
export type {
  SearchEntityType,
  SearchResultItem,
  StoreSearchResult,
  ProductSearchResult,
  SearchResult,
  SearchInputType,
  SearchSortOption,
  SearchFilters,
  SearchResponse,
  SearchFacets,
  SearchState
} from './types/search.types'

export {
  isStoreResult,
  isProductResult,
  groupResultsByType
} from './types/search.types'

// Utilities - Transformers;
export {
  transformStoreResult,
  transformProductResult,
  transformStoreResults,
  transformProductResults
} from './utils/searchTransformers'

// Utilities - Performance Optimizations;
export {
  groupAndTransformResults,
  getTopItems,
  filterAndTransformStores,
  partitionResults,
  lazySlice,
  processInChunks
} from './utils/searchOptimizations'

// Hooks;
export { useUnifiedSearch, type UseUnifiedSearchOptions } from './hooks/useUnifiedSearch'

// Components;
export { SearchBar, type SearchBarProps } from './components/SearchBar/SearchBar'
export { SearchResults, type SearchResultsProps, type ResultsLayout } from './components/SearchResults/SearchResults'
export { ResultCard, type ResultCardProps, type CardVariant } from './components/SearchResults/ResultCard'

