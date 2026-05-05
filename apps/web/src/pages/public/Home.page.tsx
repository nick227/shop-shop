/**
 * HomePage — Search → store → product → cart; one card = location + results; one discovery rail when needed.
 */
import { useCallback, useEffect, useRef } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuthStore } from '@stores/authStore'
import { useUrlLocation } from '@shared/hooks/hooks/useUrlLocation'
import { useStoreSearch } from '@shared/hooks/hooks/useStoreSearchWithTransformers'
import { useGeocoding } from '@shared/hooks/hooks/useGeocoding'
import { useLocationDisplay } from '@shared/hooks/hooks/useLocationDisplay'
import { useSearchOrchestration } from '@shared/hooks/hooks/useSearchOrchestration'
import { useDelayedEmptyReveal } from '@shared/hooks/hooks/useDelayedEmptyReveal'
import { LocationSearch, AvailableLocations, PopularStoresRow } from '@features/stores/components'
import type { StoreWithDistance } from '@api/types'
import type { LocationData } from '@shared/types'
import {
  Header,
  HeroSection,
  UrlParamError,
  ResultsSection,
  ResultsContainer,
  HomeRiverPlaceholder,
} from '@features/home/components'
import { PageComposition as PageCompositionFactory, LayoutComposition as LayoutCompositionFactory } from '@shared/ui/composition'

const RADIUS_POLICY = {
  MIN_MILES: 5,
  MAX_MILES: 100,
  DEFAULT_MILES: 25,
  EXPAND_STEP_MILES: 10,
} as const

const clampRadius = (radius: number) => {
  return Math.min(Math.max(radius, RADIUS_POLICY.MIN_MILES), RADIUS_POLICY.MAX_MILES)
}

const getNextRadius = (currentRadius: number) => {
  return clampRadius(currentRadius + RADIUS_POLICY.EXPAND_STEP_MILES)
}

const EMPTY_STATE_DELAY_MS = 320

const radiusUtils = {
  getDisplay: (loc: { radiusMiles?: number } | undefined) => {
    const radius = loc?.radiusMiles ?? RADIUS_POLICY.DEFAULT_MILES
    return Math.max(radius, RADIUS_POLICY.MIN_MILES)
  },
  getActual: (loc: { radiusMiles?: number } | undefined) => {
    return loc?.radiusMiles ?? RADIUS_POLICY.DEFAULT_MILES
  },
  clamp: clampRadius,
  getNext: getNextRadius
} as const

export default function HomePage() {
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  const urlLocationResult: {
    location: LocationData | undefined
    urlParamError: string | undefined
    setLocation: (location: LocationData | undefined) => void
    setUrlParamError: (error: string | undefined) => void
    clearLocation: () => void
  } = useUrlLocation()

  const {
    location,
    urlParamError,
    setLocation,
    setUrlParamError,
    clearLocation
  } = urlLocationResult

  const { stores, isLoading, error, refetch } = useStoreSearch(location)

  const { geocodeLocation, geocodingError, clearError } = useGeocoding()

  const handleLocationChangeWithErrorClear = useCallback((newLocation: LocationData | undefined) => {
    setLocation(newLocation)
    clearError()
  }, [setLocation, clearError])

  const { locationDisplayName, citiesContextResult } = useLocationDisplay(location, stores)

  const { searchStatus: rawSearchStatus } = useSearchOrchestration(
    location,
    stores,
    isLoading,
    error
  )
  const isAwaitingEmptyReveal = rawSearchStatus === 'no-results'
  const emptyRevealReady = useDelayedEmptyReveal(isAwaitingEmptyReveal, EMPTY_STATE_DELAY_MS)
  const searchStatus =
    isAwaitingEmptyReveal && !emptyRevealReady ? 'loading' : rawSearchStatus
  const loadingUi = isLoading || (isAwaitingEmptyReveal && !emptyRevealReady)

  const resultsRef = useRef<HTMLElement>(null)
  const previousHadResults = useRef(false)

  const isProd = import.meta.env.PROD

  useEffect(() => {
    if (!isProd) {
      console.log('🔍 [HomePage] State changed:', {
        location: location ? 'set' : 'undefined',
        stores: stores?.length ?? 0,
        isLoading,
        error: error?.message ?? 'none'
      })
    }
  }, [location, stores?.length, isLoading, error?.message, isProd])

  useEffect(() => {
    if (typeof document === 'undefined') return

    const currentHasResults = (stores?.length ?? 0) > 0
    const previousHadResultsValue = previousHadResults.current

    if (!previousHadResultsValue && currentHasResults && resultsRef.current &&
        document.activeElement === document.body) {
      resultsRef.current.focus()
    }

    previousHadResults.current = currentHasResults
  }, [stores])

  const handleViewMenu = useCallback((store: StoreWithDistance) => {
    if (!store?.id) return

    navigate('/stores/' + store.id, {
      state: {
        fromLocation: location,
        searchResultCount: stores?.length ?? 0,
        searchRadius: location?.radiusMiles ?? RADIUS_POLICY.DEFAULT_MILES
      }
    })
  }, [navigate, location, stores])

  const handleExpandToMiles = useCallback(
    (miles: number) => {
      if (!location) return
      const next = radiusUtils.clamp(miles)
      handleLocationChangeWithErrorClear({
        ...location,
        radiusMiles: next
      })
    },
    [location, handleLocationChangeWithErrorClear]
  )

  const handleAvailableLocationClick = useCallback(async (city: string, state: string) => {
    clearError()

    try {
      const newLocation = await geocodeLocation(city, state, location)

      if (newLocation) {
        handleLocationChangeWithErrorClear(newLocation)
      }
    } catch {
      if (!isProd) {
        console.error('Geocoding error in handleAvailableLocationClick')
      }
    }
  }, [location, handleLocationChangeWithErrorClear, geocodeLocation, clearError, isProd])

  const handleRetrySearch = useCallback(() => {
    void refetch()
  }, [refetch])

  const handlePickNearbyCity = useCallback(() => {
    document.querySelector('#available-locations')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const handleQuickCity = useCallback((city: string, state: string) => {
    void handleAvailableLocationClick(city, state)
  }, [handleAvailableLocationClick])

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  const currentRadius = radiusUtils.getDisplay(location)

  /** Quick cities in-card replace the bottom list until a location exists. */
  const showAvailableLocations = (() => {
    if (!location) return false
    if (geocodingError) return true
    if (error) return !stores?.length
    return !stores?.length
  })()

  const areaLabel = citiesContextResult.short ?? locationDisplayName ?? location?.displayName

  const showPopularFallback = !isLoading && (!location || !stores || stores.length === 0)
  const popularTitle = location ? 'Popular stores to try' : 'Popular stores'

  return (
    <PageCompositionFactory.Marketing
      layout="top-nav"
      sections={['header', 'content']}
      responsive={true}
      accessibility={true}
      className="min-h-screen bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700"
      header={
        <Header
          locationDisplayName={locationDisplayName}
          currentRadius={currentRadius}
          citiesContextResult={citiesContextResult}
          onClearLocation={clearLocation}
          onNavigateToVendor={() => navigate('/vendor')}
        />
      }
    >
      <LayoutCompositionFactory.Stack
        direction="column"
        gap="md"
        responsive={true}
        className="max-w-6xl mx-auto px-4 py-6"
      >
        <UrlParamError
          error={urlParamError}
          onDismiss={() => setUrlParamError(undefined)}
        />

        <HeroSection
          headline="Find stores near you"
          subheadline="Delivery or pickup from local vendors"
          variant="compact"
        />

        <div className="mx-auto w-full max-w-3xl rounded-2xl border border-white/25 bg-white/95 shadow-xl overflow-hidden">
          <div id="home-location-search" className="border-b border-gray-100 px-4 py-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Where are you shopping?
            </p>
            <LocationSearch
              onLocationChange={handleLocationChangeWithErrorClear}
              showHistory={true}
            />
          </div>

          <div className="px-4 py-4">
            <ResultsSection
              ref={resultsRef}
              searchStatus={searchStatus}
              stores={stores}
              geocodingError={geocodingError}
              onClearGeocodingError={clearError}
              location={location}
              error={error}
              isProd={isProd}
            >
              <ResultsContainer
                searchStatus={searchStatus}
                isLoading={loadingUi}
                location={location}
                areaLabel={areaLabel}
                error={error}
                stores={stores}
                userLocation={undefined}
                onStoreClick={handleViewMenu}
                onExpandToMiles={handleExpandToMiles}
                searchRadiusMiles={currentRadius}
                onRetrySearch={handleRetrySearch}
                onQuickCity={handleQuickCity}
                onPickNearbyCity={handlePickNearbyCity}
              />
            </ResultsSection>
          </div>
        </div>

        <PopularStoresRow enabled={showPopularFallback} title={popularTitle} />

        {showAvailableLocations && (
          <div id="available-locations" className="scroll-mt-28 mt-2">
            <AvailableLocations onLocationClick={(city, state) => {
              void handleAvailableLocationClick(city, state)
            }} />
          </div>
        )}

        <HomeRiverPlaceholder />
      </LayoutCompositionFactory.Stack>
    </PageCompositionFactory.Marketing>
  )
}
