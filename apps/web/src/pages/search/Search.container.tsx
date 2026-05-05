import { useCallback, useLayoutEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUrlLocation } from '@shared/hooks/hooks/useUrlLocation'
import { useStoreSearch } from '@shared/hooks/hooks/useStoreSearchWithTransformers'
import { useSearchOrchestration } from '@shared/hooks/hooks/useSearchOrchestration'
import { useLocationDisplay } from '@shared/hooks/hooks/useLocationDisplay'
import { useDelayedEmptyReveal } from '@shared/hooks/hooks/useDelayedEmptyReveal'
import { useGeocoding } from '@shared/hooks/hooks/useGeocoding'
import { getStoreRoute } from '@shared/lib/utils/navigation/routes'
import type { LocationData } from '@shared/types'
import type { StoreWithDistance } from '@api/types'
import { PageShell } from '@shared/ui/layout/PageShell'
import { UrlParamError } from '@features/home/components'
import { useSetHeaderAddressExtras } from '@components/header/HeaderAddressExtrasContext'
import { SearchControlsSection } from './sections/SearchControlsSection'
import { SearchStateSection } from './sections/SearchStateSection'
import { KitchenResultsSection } from './sections/KitchenResultsSection'

const EMPTY_STATE_DELAY_MS = 320
const MIN_RADIUS_MILES = 5
const DEFAULT_RADIUS_MILES = 25
const EXPAND_STEP_MILES = 10
const MAX_RADIUS_MILES = 100

function clampRadius(radius: number) {
  return Math.min(Math.max(radius, MIN_RADIUS_MILES), MAX_RADIUS_MILES)
}

export function SearchContainer() {
  const navigate = useNavigate()
  const { location, urlParamError, setLocation, setUrlParamError, clearLocation } = useUrlLocation()
  const { stores, isLoading, error, refetch, handleLocationChange: syncLocationParams } = useStoreSearch(location)
  const { geocodeLocation, clearError } = useGeocoding()
  const { locationDisplayName, citiesContextResult } = useLocationDisplay(location, stores)
  const { searchStatus: rawSearchStatus } = useSearchOrchestration(location, stores, isLoading, error)

  const isAwaitingEmptyReveal = rawSearchStatus === 'no-results'
  const emptyRevealReady = useDelayedEmptyReveal(isAwaitingEmptyReveal, EMPTY_STATE_DELAY_MS)
  const searchStatus = isAwaitingEmptyReveal && !emptyRevealReady ? 'loading' : rawSearchStatus
  const loadingUi = isLoading || (isAwaitingEmptyReveal && !emptyRevealReady)
  const currentRadius = Math.max(location?.radiusMiles ?? DEFAULT_RADIUS_MILES, MIN_RADIUS_MILES)
  const areaLabel = citiesContextResult.short ?? locationDisplayName ?? location?.displayName

  const handleLocationChange = useCallback((newLocation: LocationData | undefined) => {
    setLocation(newLocation)
    syncLocationParams(newLocation)
    clearError()
  }, [setLocation, syncLocationParams, clearError])

  const handleRetrySearch = useCallback(() => {
    void refetch()
  }, [refetch])

  const handleExpandToMiles = useCallback((miles: number) => {
    if (!location) return
    const nextLocation = {
      ...location,
      radiusMiles: clampRadius(miles),
    }
    setLocation(nextLocation)
    syncLocationParams(nextLocation)
  }, [location, setLocation, syncLocationParams])

  const handlePickNearbyCity = useCallback(() => {
    const nextRadius = clampRadius(currentRadius + EXPAND_STEP_MILES)
    handleExpandToMiles(nextRadius)
  }, [currentRadius, handleExpandToMiles])

  const handleQuickCity = useCallback((city: string, state: string) => {
    void (async () => {
      const newLocation = await geocodeLocation(city, state, location)
      if (newLocation) {
        setLocation(newLocation)
        syncLocationParams(newLocation)
      }
    })()
  }, [geocodeLocation, location, setLocation, syncLocationParams])

  const handleStoreClick = useCallback((store: StoreWithDistance) => {
    navigate(getStoreRoute({ id: store.id, name: store.name }))
  }, [navigate])

  const setHeaderAddressExtras = useSetHeaderAddressExtras()
  useLayoutEffect(() => {
    if (!setHeaderAddressExtras) return
    if (!location) {
      setHeaderAddressExtras(undefined)
      return
    }
    setHeaderAddressExtras({
      locationDisplayName,
      currentRadius,
      citiesContextResult,
      onClearLocation: clearLocation,
    })
    return () => {
      setHeaderAddressExtras(undefined)
    }
  }, [
    clearLocation,
    citiesContextResult,
    currentRadius,
    location,
    locationDisplayName,
    setHeaderAddressExtras,
  ])

  return (
    <PageShell
      className="bg-background"
      containerClassName="max-w-6xl"
      contentClassName="space-y-4 py-6 md:space-y-5"
    >
      <UrlParamError error={urlParamError} onDismiss={() => setUrlParamError(undefined)} />

      <SearchControlsSection
        location={location}
        radiusMiles={currentRadius}
        onLocationChange={handleLocationChange}
      />

      {searchStatus === 'results' && location && stores?.length ? (
        <KitchenResultsSection
          location={location}
          stores={stores}
          areaLabel={areaLabel}
          onStoreClick={handleStoreClick}
        />
      ) : (
        <SearchStateSection
          status={searchStatus}
          isLoading={loadingUi}
          error={error}
          location={location}
          stores={stores}
          areaLabel={areaLabel}
          radiusMiles={currentRadius}
          onRetry={handleRetrySearch}
          onExpandToMiles={handleExpandToMiles}
          onPickNearbyCity={handlePickNearbyCity}
          onQuickCity={handleQuickCity}
        />
      )}
    </PageShell>
  )
}
