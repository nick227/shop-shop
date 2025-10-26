/**
 * useSearchOrchestration - Handles search status logic and result rendering
 * Extracts search orchestration logic from HomePage for better separation of concerns
 */
import { useCallback, useMemo } from 'react'
import type { LocationData } from '@/types/location.types'
import type { StoreWithDistance } from '@api/types'

type SearchStatus = 'idle' | 'loading' | 'error' | 'no-results' | 'results'

interface UseSearchOrchestrationResult {
  searchStatus: SearchStatus
  getSearchStatus: () => SearchStatus
}

export function useSearchOrchestration(
  location: LocationData | null,
  stores: StoreWithDistance[] | undefined,
  isLoading: boolean,
  error: Error | null
): UseSearchOrchestrationResult {
  // Centralize status logic for better readability and testability
  const getSearchStatus = useCallback((): SearchStatus => {
    if (isLoading && location) return 'loading'
    if (error && location) return 'error'
    if (!error && location && (!stores || stores.length === 0)) return 'no-results'
    if (!error && location && stores && stores.length > 0) return 'results'
    return 'idle'
  }, [isLoading, location, error, stores])

  // Memoize the current status to prevent unnecessary re-renders
  const searchStatus = useMemo(() => getSearchStatus(), [getSearchStatus])

  return {
    searchStatus,
    getSearchStatus,
  }
}
