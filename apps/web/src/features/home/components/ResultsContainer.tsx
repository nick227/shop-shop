/**
 * ResultsContainer - Component for rendering search results based on status;
 */
import { LoadingState, ErrorState, NoResults, SearchResults } from './index'
import type { LocationData } from '../../../types/location.types'
import type { StoreWithDistance } from '../../../api/types'

interface ResultsContainerProps {
  searchStatus: 'idle' | 'loading' | 'error' | 'no-results' | 'results'
  isLoading: boolean;
  location: LocationData | undefined;
  error: Error | undefined;
  stores: StoreWithDistance[] | undefined;
  userLocation: LocationData | undefined  ;
  onStoreClick: (store: StoreWithDistance) => void;
  onExpandSearch: () => void;
}

export function ResultsContainer({
  searchStatus,
  isLoading,
  location,
  error,
  stores,
  userLocation,
  onStoreClick,
  onExpandSearch
}: ResultsContainerProps) {
  switch (searchStatus) {
    case 'loading': {
      return <LoadingState isLoading={isLoading} location={location} />
    }
    case 'error': {
      return <ErrorState error={error} location={location} />
    }
    case 'no-results': {
      return <NoResults error={error} location={location} stores={stores} onExpandSearch={onExpandSearch} />
    }
    case 'results': {
      return <SearchResults
        error={error} 
        location={location} 
        stores={stores} 
        userLocation={userLocation} 
        onStoreClick={onStoreClick}
      />
    }
    default: {
      return;
    }
  }
}
