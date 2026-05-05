/**
 * useSearchOrchestration - Handles search status logic and result rendering
 * Extracts search orchestration logic from HomePage for better separation of concerns
 */
import { useCallback, useMemo } from 'react'
import type { LocationData } from '@shared/types/types/location.types'
import type { StoreWithDistance } from '@api/types'

export type SearchStatus = 'no-location' | 'loading' | 'error' | 'no-results' | 'results'

interface UseSearchOrchestrationResult {
  searchStatus: SearchStatus
  getSearchStatus: () => SearchStatus
}

export function useSearchOrchestration(
  location: LocationData | undefined,
  stores: StoreWithDistance[] | undefined,
  isLoading: boolean,
  error: Error | undefined
): UseSearchOrchestrationResult {
  // Centralize status logic for better readability and testability
  const getSearchStatus = useCallback((): SearchStatus => {
    if (!location) return 'no-location'
    if (isLoading) return 'loading'
    if (error) return 'error'
    if (!stores || stores.length === 0) return 'no-results'
    return 'results'
  }, [isLoading, location, error, stores])

  // Memoize the current status to prevent unnecessary re-renders
  const searchStatus = useMemo(() => getSearchStatus(), [getSearchStatus])

  return {
    searchStatus,
    getSearchStatus,
  }
}
