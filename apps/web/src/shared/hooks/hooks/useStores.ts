/**
 * useStores - Canonical store list access hook with search utilities
 * Single source of truth for store LIST data access
 * 
 * 🚫 DO NOT USE generated hooks directly in UI
 * Always go through this layer for consistent data flow
 * 
 * Enforces consistent data flow: API → transformation → filtering → UI
 * Replaces direct generated hook usage to prevent parallel data pipelines
 */

import { useMemo } from 'react'
import { useStores as useStoresRaw, useStore as useStoreRaw, useOrders as useOrdersRaw } from './generated'
import { useLocationParams } from './useLocationParams'
import { useAnalytics } from './useAnalytics'
import { groupAndTransformResults, filterAndTransformStores } from '@features/search/utils/searchOptimizations'
import type { LocationData } from '@shared/types'
import type { StoreWithDistance } from '@api/types'
import type { StoreResponse as SchemaStoreResponse } from '@packages/schemas'
import type { SearchResult, StoreSearchResult } from '@features/search/types/search.types'

interface UseStoresResult {
  stores: StoreWithDistance[] | undefined
  isLoading: boolean
  error: Error | undefined
  handleLocationChange: (newLocation: LocationData | undefined) => void
  refetch: () => Promise<unknown>
}

export function useStores(location: LocationData | undefined): UseStoresResult {
  const { updateParams, clearParams } = useLocationParams()
  const { trackLocationSearch } = useAnalytics()

  // Memoize location params to prevent unnecessary API calls
  const locationParams = useMemo(() => 
    location ? {
      latitude: location.latitude,
      longitude: location.longitude,
      radiusMiles: location.radiusMiles
    } : undefined,
    [location]
  )
  
  // Use generated hook for raw API data
  // Cast to StoreWithDistance[] — the API includes `distance` when locationParams are provided
  const { data: rawStoresData, isLoading, error: rawError, refetch } = useStoresRaw(locationParams, {
    enabled: Boolean(location)
  })
  const rawStores = rawStoresData as StoreWithDistance[] | undefined
  const error = rawError ?? undefined

  // Apply search utilities - this wires the dead code into runtime
  const stores = useMemo(() => {
    if (!rawStores?.length) return
    
    // Transform raw stores into search results format
    const searchResults = rawStores.map((store): StoreSearchResult => ({
      type: 'store' as const,
      id: store.id,
      name: store.name,
      description: store.description,
      imageUrl: store.imageUrl,
      distance: store.distance,
      prepTimeMin: store.prepTimeMin ?? 30,
      isOpen: store.isPublished ?? undefined,
      rating: 0,
      store: store as unknown as SchemaStoreResponse,
    }))
    
    // Use filterAndTransformStores to apply search transformations
    return filterAndTransformStores(searchResults, (storeResult) => {
      // Apply any filtering logic here (open stores, within radius, etc.)
      return storeResult.isOpen !== false
    })
  }, [rawStores])

  const handleLocationChange = (newLocation: LocationData | undefined) => {
    if (newLocation) {
      // Update URL with search parameters for shareable links
      updateParams({
        latitude: newLocation.latitude?.toString(),
        longitude: newLocation.longitude?.toString(),
        radiusMiles: newLocation.radiusMiles?.toString(),
        city: newLocation.city,
        state: newLocation.state,
        zip: newLocation.zip,
        source: newLocation.source as any
      })
      
      // Track location search for analytics
      trackLocationSearch({
        latitude: newLocation.latitude?.toString(),
        longitude: newLocation.longitude?.toString(),
        radius: newLocation.radiusMiles?.toString(),
        city: newLocation.city,
        state: newLocation.state,
      })
    } else {
      clearParams()
    }
  }

  return {
    stores,
    isLoading,
    error,
    handleLocationChange,
    refetch
  }
}

// Export canonical useOrders for API layer enforcement
export function useOrders(params?: any) {
  return useOrdersRaw(params)
}

// Export canonical useStore for single entity access
export function useStore(id: string) {
  return useStoreRaw(id)
}
