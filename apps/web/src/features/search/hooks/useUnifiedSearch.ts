/**
 * useUnifiedSearch - Central hook for all search functionality
 * Supports stores, products, and future entity types
 */
import { useState, useCallback, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { groupResultsByType } from '../types/search.types'
import type { 
  SearchFilters, 
  SearchResponse,
  SearchEntityType 
} from '../types/search.types'

export interface UseUnifiedSearchOptions {
  initialFilters?: SearchFilters
  enabled?: boolean
  debounceMs?: number
}

export function useUnifiedSearch(options: UseUnifiedSearchOptions = {}) {
  const {
    initialFilters = {},
    enabled = true
    // debounceMs - TODO: Implement debouncing when needed
  } = options

  const [filters, setFilters] = useState<SearchFilters>(initialFilters)

  // Main search query
  const searchQuery = useQuery<SearchResponse, Error>({
    queryKey: ['unified-search', filters],
    queryFn: async () => {
      // TODO: Replace with actual API call
      // For now, mock the response structure
      return mockSearchApi(filters)
    },
    enabled: enabled && (!!filters.query || !!filters.location),
    staleTime: 30_000, // 30 seconds
  })

  // Update filters
  const updateFilters = useCallback((updates: Partial<SearchFilters>) => {
    setFilters(prev => ({ ...prev, ...updates }))
  }, [])

  // Update query
  const setQuery = useCallback((query: string) => {
    updateFilters({ query })
  }, [updateFilters])

  // Update location
  const setLocation = useCallback((location: SearchFilters["location"]) => {
    if (location) {
      updateFilters({ location })
    }
  }, [updateFilters])

  // Update entity types filter
  const setEntityTypes = useCallback((types: SearchEntityType[]) => {
    updateFilters({ entityTypes: types })
  }, [updateFilters])

  // Update sort
  const setSortBy = useCallback((sortBy: SearchFilters["sortBy"]) => {
    if (sortBy) {
      updateFilters({ sortBy })
    }
  }, [updateFilters])

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters(initialFilters)
  }, [initialFilters])

  // Reset search
  const resetSearch = useCallback(() => {
    setFilters({})
  }, [])

  // Group results by type using centralized helper
  const groupedResults = useMemo(() => 
    searchQuery.data?.items 
      ? groupResultsByType(searchQuery.data.items)
      : { stores: [], products: [] },
    [searchQuery.data]
  )

  return {
    // State
    filters,
    results: searchQuery.data,
    groupedResults,
    
    // Loading states
    isLoading: searchQuery.isLoading,
    isError: searchQuery.isError,
    error: searchQuery.error,
    
    // Actions
    updateFilters,
    setQuery,
    setLocation,
    setEntityTypes,
    setSortBy,
    clearFilters,
    resetSearch,
    
    // React Query utilities
    refetch: searchQuery.refetch,
    isRefetching: searchQuery.isRefetching,
  }
}

/**
 * Mock API for development
 * Replace with actual API integration
 */
async function mockSearchApi(filters: SearchFilters): Promise<SearchResponse> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500))

  // Mock response
  return {
    items: [],
    total: 0,
    page: 1,
    pageSize: 20,
    hasMore: false,
    query: filters.query || '',
    filters,
    facets: {
      entityCounts: {
        store: 0,
        product: 0,
        post: 0,
        category: 0
      }
    }
  }
}

