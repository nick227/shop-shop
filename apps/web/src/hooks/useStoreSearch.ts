/**
 * useStoreSearch - Handles store fetching and search-related side effects;
 * Extracts store search logic from HomePage for better separation of concerns;
 */
import { useMemo, useCallback } from 'react'
import { useStores } from '@hooks/generated'
import { useLocationParams } from './useLocationParams'
import { useAnalytics } from './useAnalytics'
import type { LocationData } from '@/types/location.types'
import type { StoreResponse } from '../api/backend-types'

interface UseStoreSearchResult {
  stores: StoreResponse[] | undefined;
  isLoading: boolean;
  error: Error | undefined;
  handleLocationChange: (newLocation: LocationData | undefined) => void;
}

export function useStoreSearch(location: LocationData | undefined): UseStoreSearchResult {
  const { updateParams, clearParams } = useLocationParams()
  const { trackLocationSearch } = useAnalytics()

  // Memoize location params to prevent unnecessary API calls;
  const locationParams = useMemo(() => 
    location ? {
      latitude: location.latitude,
      longitude: location.longitude,
      radiusMiles: location.radiusMiles
    } : undefined,
    [location]
  )
  
  // Only fetch stores when we have a location (prevents duplicate API calls)
  const { data: stores, isLoading, error } = useStores(locationParams, {
    enabled: Boolean(location)
  })

  const handleLocationChange = useCallback((newLocation: LocationData | undefined) => {
    // Note: This hook doesn't manage location state directly;
    // The parent component should handle location state updates;
    if (newLocation) {
      // Update URL with search parameters for shareable links;
      updateParams({
        latitude: newLocation.latitude?.toString(),
        longitude: newLocation.longitude?.toString(),
        radiusMiles: newLocation.radiusMiles?.toString(),
        city: newLocation.city,
        state: newLocation.state,
        zip: newLocation.zip,
        source: newLocation.source as any})
      
      // Track location search for analytics;
      trackLocationSearch({
        latitude: newLocation.latitude.toString(),
        longitude: newLocation.longitude.toString(),
        radius: newLocation.radiusMiles.toString(),
        city: newLocation.city,
        state: newLocation.state})
    } else {
      // Clear URL params when location is cleared;
      clearParams()
    }
  }, [updateParams, clearParams, trackLocationSearch]) // Remove location and isSameLocation from deps;
  return {
    stores,
    isLoading,
    error: error || undefined,
    handleLocationChange}
}
