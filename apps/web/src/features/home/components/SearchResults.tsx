/**
 * SearchResults - Component for displaying search results
 */
import { StoreGrid } from '@features/stores/components/StoreGrid/StoreGrid'
import { StoreMapLazy } from '@features/stores/components/StoreMapLazy'
import type { LocationData } from '@shared/types'
import type { StoreResponse, StoreWithDistance } from '@api/backend-types'

interface SearchResultsProps {
  error: Error | undefined
  location: LocationData | undefined
  stores: StoreResponse[] | undefined
  userLocation: LocationData | undefined  
  onStoreClick: (store: StoreResponse | StoreWithDistance) => void
  highlightedStoreId?: string | undefined
}

export function SearchResults({ 
  error, 
  location, 
  stores, 
  userLocation, 
  onStoreClick, 
  highlightedStoreId 
}: SearchResultsProps) {
  if (error || !location || !stores || stores.length === 0) return

  return (
    <>
      {/* Results Header */}
      <div className="text-center mb-8 text-white">
        <h2 className="text-3xl mb-2">Stores Found</h2>
        <p className="text-lg opacity-90">Found {stores.length} stores in {location.displayName}</p>
      </div>

      {/* StoreWithDistance Map */}
      <div className="my-8 rounded-xl overflow-hidden shadow-lg">
        <StoreMapLazy 
          stores={stores || []}
          userLocation={userLocation ? { latitude: userLocation.latitude, longitude: userLocation.longitude } : undefined}
          radiusMiles={location?.radiusMiles}
        />
      </div>

      {/* StoreWithDistance Grid */}
      <StoreGrid
        stores={stores}
        onStoreClick={onStoreClick}
        highlightedStoreId={highlightedStoreId || undefined}
      />
    </>
  )
}
