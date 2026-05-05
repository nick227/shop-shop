/**
 * SearchResults — grid first (above fold), map compact below.
 */
import { StoreGrid } from '@features/stores/components/StoreGrid/StoreGrid'
import { StoreMapLazy } from '@features/stores/components/StoreMapLazy'
import type { LocationData } from '@shared/types'
import type { StoreResponse, StoreWithDistance } from '@api/types'

export interface SearchResultsProps {
  readonly error: Error | undefined
  readonly location: LocationData | undefined
  readonly stores: StoreResponse[] | undefined
  readonly userLocation: LocationData | undefined
  readonly onStoreClick: (store: StoreResponse | StoreWithDistance) => void
  readonly highlightedStoreId?: string | undefined
  readonly areaLabel?: string | undefined
}

export function SearchResults({
  error,
  location,
  stores,
  userLocation,
  onStoreClick,
  highlightedStoreId,
  areaLabel,
}: SearchResultsProps) {
  if (error || !location || !stores || stores.length === 0) return

  const nearLabel = areaLabel ?? location.displayName ?? 'you'

  return (
    <>
      <div className="mb-3 text-center text-gray-900">
        <p className="text-lg font-semibold">
          {stores.length} {stores.length === 1 ? 'store' : 'stores'} near {nearLabel}
        </p>
      </div>

      <StoreGrid
        stores={stores}
        onStoreClick={onStoreClick}
        highlightedStoreId={highlightedStoreId}
        className="px-1 py-2 md:px-2"
      />

      <div className="mt-3 max-h-[120px] overflow-hidden rounded-lg shadow-md ring-1 ring-black/5 md:max-h-[160px]">
        <StoreMapLazy
          stores={stores || []}
          userLocation={
            userLocation
              ? { latitude: userLocation.latitude, longitude: userLocation.longitude }
              : undefined
          }
          radiusMiles={location?.radiusMiles}
        />
      </div>
    </>
  )
}
