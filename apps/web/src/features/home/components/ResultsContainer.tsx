/**
 * ResultsContainer — every branch exposes a clear next action (no dead ends).
 */
import { LoadingState } from './LoadingState'
import { ErrorState } from './ErrorState'
import { NoResults } from './NoResults'
import { SearchResults } from './SearchResults'
import { NoLocationPrompt } from './NoLocationPrompt'
import type { SearchStatus } from '@shared/hooks/hooks/useSearchOrchestration'
import type { LocationData } from '@shared/types'
import type { StoreWithDistance } from '@api/types'

export interface ResultsContainerProps {
  readonly searchStatus: SearchStatus
  readonly isLoading: boolean
  readonly location: LocationData | undefined
  readonly areaLabel: string | undefined
  readonly error: Error | undefined
  readonly stores: StoreWithDistance[] | undefined
  readonly userLocation: LocationData | undefined
  readonly onStoreClick: (store: StoreWithDistance) => void
  readonly onExpandSearch: () => void
  readonly onRetrySearch: () => void
  readonly onQuickCity: (city: string, state: string) => void
  readonly onPickNearbyCity: () => void
}

export function ResultsContainer({
  searchStatus,
  isLoading,
  location,
  areaLabel,
  error,
  stores,
  userLocation,
  onStoreClick,
  onExpandSearch,
  onRetrySearch,
  onQuickCity,
  onPickNearbyCity,
}: ResultsContainerProps) {
  switch (searchStatus) {
    case 'no-location': {
      return <NoLocationPrompt onQuickCity={onQuickCity} />
    }
    case 'loading': {
      return (
        <LoadingState
          isLoading={isLoading}
          location={location}
          areaLabel={areaLabel}
        />
      )
    }
    case 'error': {
      return <ErrorState error={error} onRetry={onRetrySearch} />
    }
    case 'no-results': {
      return (
        <NoResults
          location={location}
          areaLabel={areaLabel}
          onExpandSearch={onExpandSearch}
          onPickNearbyCity={onPickNearbyCity}
        />
      )
    }
    case 'results': {
      return (
        <SearchResults
          error={error}
          location={location}
          stores={stores}
          userLocation={userLocation}
          onStoreClick={onStoreClick}
          areaLabel={areaLabel}
        />
      )
    }
    default: {
      return null
    }
  }
}
