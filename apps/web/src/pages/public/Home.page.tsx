/**
 * HomePage - Single-focus store discovery with location-based search and map
 * Philosophy: One Store at a time, bold design, minimal distraction
 * Optimized: Extracted logic into composable hooks, clean render flow
 * URL Parameters: lat, lng, radius, city, state, zip for shareable searches
 * Enhanced: Input validation, URL encoding, browser navigation support
 * Composition: Uses unified page composition system for consistent layout
 */
import { useCallback, useEffect, useRef } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuthStore } from '@stores/authStore'
import { useUrlLocation } from '@shared/hooks/hooks/useUrlLocation'
import { useStoreSearch } from '@shared/hooks/hooks/useStoreSearch'
import { useGeocoding } from '@shared/hooks/hooks/useGeocoding'
import { useLocationDisplay } from '@shared/hooks/hooks/useLocationDisplay'
import { useSearchOrchestration } from '@shared/hooks/hooks/useSearchOrchestration'
import { 
  LocationSearch, 
  NewestStores,
  FeaturedStores,
  StoreCategoryCarousels,
  AvailableLocations
} from '@features/stores/components'
import type { StoreWithDistance } from '@api/types'
import type { LocationData } from '@shared/types'
import { usePromotionalCopy } from '@features/content/hooks/usePromotionalCopy'
import {
  Header,
  HeroSection,
  BenefitsSection,
  UrlParamError,
  ResultsSection,
  ResultsContainer,
  FeaturedBundles
} from '@features/home/components'
import { PageComposition as PageCompositionFactory, LayoutComposition as LayoutCompositionFactory } from '@shared/ui/composition'

// Radius policy constants - single source of truth
const RADIUS_POLICY = {
  MIN_MILES: 5,
  MAX_MILES: 100,
  DEFAULT_MILES: 25,
  EXPAND_STEP_MILES: 10,
} as const

// Centralized radius utilities - single source of truth for all radius operations
const clampRadius = (radius: number) => {
  return Math.min(Math.max(radius, RADIUS_POLICY.MIN_MILES), RADIUS_POLICY.MAX_MILES)
}

const getNextRadius = (currentRadius: number) => {
  return clampRadius(currentRadius + RADIUS_POLICY.EXPAND_STEP_MILES)
}

const radiusUtils = {
  // Get display radius (ensures minimum for UI)
  getDisplay: (location: { radiusMiles?: number } | undefined) => {
    const radius = location?.radiusMiles ?? RADIUS_POLICY.DEFAULT_MILES
    return Math.max(radius, RADIUS_POLICY.MIN_MILES)
  },
  
  // Get actual radius (for queries, can be 0)
  getActual: (location: { radiusMiles?: number } | undefined) => {
    return location?.radiusMiles ?? RADIUS_POLICY.DEFAULT_MILES
  },
  
  // Clamp radius to valid range
  clamp: clampRadius,
  
  // Get next radius for expand search
  getNext: getNextRadius
} as const

export default function HomePage() {
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  
  // Extract URL location logic into hook
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
  
  // Extract store search logic into hook
  const { stores, isLoading, error } = useStoreSearch(location)
  
  // Extract geocoding logic into hook
  const { geocodeLocation, geocodingError, clearError } = useGeocoding()
  
  // Wrapper function to ensure geocoding errors are cleared on any location change
  const handleLocationChangeWithErrorClear = useCallback((newLocation: LocationData | undefined) => {
    setLocation(newLocation)
    clearError()
  }, [setLocation, clearError])
  
  // Extract location display logic into hook
  const { locationDisplayName, citiesContextResult } = useLocationDisplay(location, stores as StoreWithDistance[] | undefined)
  
  // Extract search orchestration logic into hook
  const { searchStatus } = useSearchOrchestration(location, stores as StoreWithDistance[] | undefined, isLoading, error)
  
  // Focus management ref for accessibility
  const resultsRef = useRef<HTMLElement>(null)
  const previousHadResults = useRef(false)
  
  // Environment-safe logging helper - Vite approach
  const isProd = import.meta.env.PROD
  
  // Consolidated debug logging - single effect for better performance
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

  // Focus management for accessibility - focus only on first transition to results
  useEffect(() => {
    // SSR safety check
    if (typeof document === 'undefined') return
    
    const currentHasResults = (stores?.length ?? 0) > 0
    const previousHadResultsValue = previousHadResults.current
    
    // Focus when transitioning from no results to having results
    // Simplified guard - just check if body is active element
    if (!previousHadResultsValue && currentHasResults && resultsRef.current && 
        document.activeElement === document.body) {
      resultsRef.current.focus()
    }
    
    previousHadResults.current = currentHasResults
  }, [stores])

  const handleViewMenu = useCallback((store: StoreWithDistance) => {
    // Guard against bad data
    if (!store?.id) return
    
    // Navigate immediately - preserve minimal search context in navigation state
    navigate('/stores/' + store.id + '', { 
      state: { 
        fromLocation: location,
        searchResultCount: stores?.length ?? 0,
        searchRadius: location?.radiusMiles ?? RADIUS_POLICY.DEFAULT_MILES
      } 
    })
  }, [navigate, location, stores])

  const handleExpandSearch = useCallback(() => {
    if (!location) return
    
    // Get actual radius (for queries, can be 0)
    const base = radiusUtils.getActual(location)
    
    // Guard against malformed URL injecting non-number radius
    if (Number.isNaN(base)) {
      return
    }
    
    // Get next radius using centralized utility
    const newRadius = radiusUtils.getNext(base)
    
    // Equality guard - only update if radius actually changed
    if (newRadius !== base) {
      // Use the wrapper function to ensure geocoding errors are cleared
      handleLocationChangeWithErrorClear({
        ...location,
        radiusMiles: newRadius
      })
    }
  }, [location, handleLocationChangeWithErrorClear])

  const handleAvailableLocationClick = useCallback(async (city: string, state: string) => {
    if (!isProd) {
      console.log('Search for ${city}, ' + state + '')
    }
    
    // Clear any existing geocoding error
    clearError()
    
    try {
      // Use the geocoding hook with proper cancellation and debouncing
      // The useGeocoding hook already handles debouncing internally
      const newLocation = await geocodeLocation(city, state, location)
      
      if (newLocation) {
        // This will trigger the search with valid coordinates
        handleLocationChangeWithErrorClear(newLocation)
      }
    } catch (error: unknown) {
      // Surface failures via geocodingError - the useGeocoding hook handles this
      if (!isProd) {
        console.error('Geocoding error in handleAvailableLocationClick:', error)
      }
    }
  }, [location, handleLocationChangeWithErrorClear, geocodeLocation, clearError, isProd])


  // Get promotional copy
  const copy = usePromotionalCopy(locationDisplayName, stores as StoreWithDistance[] | undefined)

  // Authentication check - redirect if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // OPTIMIZED: Simplified conditional logic with early returns
  const currentRadius = radiusUtils.getDisplay(location)
  
  // Consolidated logic: show available locations when no search results
  const showAvailableLocations = (() => {
    if (!location) return true
    if (geocodingError) return true
    if (error) return !stores?.length
    return !stores?.length
  })()

  return (
    <PageCompositionFactory.Marketing
      layout="top-nav"
      sections={['header', 'content']}
      responsive={true}
      accessibility={true}
      className="min-h-screen bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700"
    >
      <Header
        locationDisplayName={locationDisplayName}
        currentRadius={currentRadius}
        citiesContextResult={citiesContextResult}
        onClearLocation={clearLocation}
        onNavigateToVendor={() => navigate('/vendor')}
      />

      <LayoutCompositionFactory.Stack
        direction="column"
        gap="lg"
        responsive={true}
        className="max-w-6xl mx-auto px-4 py-8"
      >
        <UrlParamError 
          error={urlParamError} 
          onDismiss={() => setUrlParamError(undefined)} 
        />
        
        <HeroSection 
          headline={copy.hero.headline}
          subheadline={copy.hero.subheadline}
        />

        {/* Search Form - Always visible */}
        <div className="max-w-2xl mx-auto my-8">
          <LocationSearch 
            onLocationChange={handleLocationChangeWithErrorClear}
            showHistory={true}
          />
        </div>

        <BenefitsSection 
          title={copy.benefits.title}
          items={copy.benefits.items}
        />

        {/* Featured Bundles */}
        <FeaturedBundles />

        <ResultsSection
          ref={resultsRef}
          searchStatus={searchStatus}
          stores={stores as StoreWithDistance[] | undefined}
          geocodingError={geocodingError}
          onClearGeocodingError={clearError}
          location={location}
          error={error}
          isProd={isProd}
        >
          <ResultsContainer
            searchStatus={searchStatus}
            isLoading={isLoading}
            location={location}
            error={error}
            stores={stores as StoreWithDistance[] | undefined}
            userLocation={undefined}
            onStoreClick={handleViewMenu}
            onExpandSearch={handleExpandSearch}
          />
        </ResultsSection>

        {/* Newest Stores - ALWAYS visible (even on page load) */}
        <div className="my-8">
          <NewestStores />
        </div>

        {/* Available Locations - when no location set, error exists, or when search returns no results */}
        {showAvailableLocations && (
          <div className="my-8">
            <AvailableLocations onLocationClick={(city, state) => {
              void handleAvailableLocationClick(city, state)
            }} />
          </div>
        )}

        {/* Featured Stores - ALWAYS visible (even on page load) */}
        <div className="my-8">
          <FeaturedStores />
        </div>
        
        {/* Store Category Carousels - ALWAYS visible (even on page load) */}
        <div className="my-8">
          <StoreCategoryCarousels />
        </div>
      </LayoutCompositionFactory.Stack>
    </PageCompositionFactory.Marketing>
  )
}
