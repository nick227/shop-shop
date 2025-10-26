/**
 * LocationSearch - Consolidated location input component
 * Uses the unified LocationService with localStorage persistence
 * Always shows search controls to allow new location searches
 */
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useLocation } from '@hooks/useLocation'
import type { LocationData } from '@/types/location.types'
import { CurrentLocationBadge } from './CurrentLocationBadge'
import { GeolocationButton } from './GeolocationButton'
import { ZipCodeInput } from './ZipCodeInput'
import { CityStateInput } from './CityStateInput'
import { RadiusControl } from './RadiusControl'
import { LocationHistory } from './LocationHistory'
import styles from './LocationSearch.module.css'

interface LocationSearchProps {
  readonly onLocationChange: (location: LocationData | null) => void
  readonly initialRadius?: number
  readonly showHistory?: boolean
}

export function LocationSearch({ 
  onLocationChange, 
  initialRadius = 25,
  showHistory = true 
}: LocationSearchProps) {
  const {
    currentLocation,
    isLoading,
    error,
    getLocation,
    clearLocation,
    updateRadius,
    locationHistory,
    preferences,
    updatePreferences,
    isGeolocationSupported
  } = useLocation()

  // OPTIMIZED: Simplified state - no object wrapper needed
  const [activeInput, setActiveInput] = useState<'geolocation' | 'zip' | 'city' | undefined>()
  
  // Use ref to store the latest callback to avoid infinite loops
  const onLocationChangeRef = useRef(onLocationChange)
  onLocationChangeRef.current = onLocationChange

  // OPTIMIZED: One-time radius seeding to prevent flicker
  const [radiusInitialized, setRadiusInitialized] = useState(false)
  useEffect(() => {
    if (!radiusInitialized && initialRadius !== preferences.preferredRadius) {
      updateRadius(initialRadius)
      setRadiusInitialized(true)
    }
  }, [initialRadius, preferences.preferredRadius, updateRadius, radiusInitialized])

  // Notify parent of location changes - only when location actually changes
  useEffect(() => {
    onLocationChangeRef.current(currentLocation)
  }, [currentLocation])

  // OPTIMIZED: Memoized location handler with proper error handling
  const handleLocationRequest = useCallback(async (
    type: 'geolocation' | 'zip' | 'city',
    value: string,
    state?: string
  ) => {
    setActiveInput(type)
    try {
      if (type === 'city' && !state) {
        throw new Error('Please provide a state abbreviation (e.g., TX, CA, NY)')
      }
      await getLocation({ type, value, ...(state && { state }) })
    } catch (error: any) {
      // Log error for debugging while hook handles user feedback
      console.warn('Location request failed:', error)
    } finally {
      setActiveInput(undefined)
    }
  }, [getLocation])

  // OPTIMIZED: Memoized handlers to prevent unnecessary re-renders
  const handleUseMyLocation = useCallback(() => handleLocationRequest('geolocation', ''), [handleLocationRequest])
  const handleZipSubmit = useCallback((zipCode: string) => handleLocationRequest('zip', zipCode), [handleLocationRequest])
  const handleCitySubmit = useCallback((city: string, state?: string) => handleLocationRequest('city', city, state), [handleLocationRequest])

  // Handle radius change
  const handleRadiusChange = useCallback((newRadius: number) => {
    updateRadius(newRadius)
  }, [updateRadius])

  // Handle clear location
  const handleClear = useCallback(() => {
    clearLocation()
  }, [clearLocation])

  // OPTIMIZED: Type-safe history selection with information preservation
  const handleHistorySelect = useCallback(async (location: LocationData) => {
    try {
      // Type-safe mapping with validation
      const getLocationType = (source: string): 'geolocation' | 'zip' | 'city' => {
        switch (source) {
          case 'geolocation': {
            return 'geolocation'
          }
          case 'zip': {
            return 'zip'
          }
          case 'city':
          case 'address':
          case 'manual':
          case 'search':
          default: {
            return 'city'
          }
        }
      }

      const inputType = getLocationType(location.source)
      
      // Preserve original search data to avoid information loss
      const searchValue = location.zip ?? location["city"] ?? location.displayName ?? ''
      const searchState = location["state"] ?? undefined
      
      // Validate required data for city searches
      if (inputType === 'city' && !searchValue) {
        throw new Error('Cannot replay location: missing city information')
      }
      
      await getLocation({
        type: inputType,
        value: searchValue,
        ...(searchState && { state: searchState })
      })
    } catch (error: any) {
      console.warn('History selection failed:', error)
    }
  }, [getLocation])

  // Handle set as default
  const handleSetAsDefault = useCallback((location: LocationData) => {
    updatePreferences({ defaultLocation: location })
  }, [updatePreferences])

  // OPTIMIZED: Memoized loading state coordination
  const loadingStates = useMemo(() => ({
    geolocation: activeInput === 'geolocation' && isLoading,
    zip: activeInput === 'zip' && isLoading,
    city: activeInput === 'city' && isLoading,
    any: isLoading // For general loading state
  }), [activeInput, isLoading])

  return (
    <div 
      className={styles['container']}
      aria-busy={loadingStates.any}
      aria-live="polite"
    >
      {/* Current Location Display */}
      {currentLocation && (
        <CurrentLocationBadge
          locationName={currentLocation.displayName ?? 'Unknown Location'}
          radiusMiles={currentLocation.radiusMiles}
          onClear={handleClear}
          onSetDefault={() => handleSetAsDefault(currentLocation)}
        />
      )}

      {/* OPTIMIZED: Consolidated search controls with coordinated loading states */}
      <div className={styles['searchControls']}>
        {isGeolocationSupported && (
          <>
            <GeolocationButton
              onGetLocation={() => { void handleUseMyLocation() }}
              isLoading={loadingStates.geolocation}
            />
            <div className={styles['divider']}>
              <span>or</span>
            </div>
          </>
        )}

        <ZipCodeInput 
          onZipSubmit={(zipCode) => { void handleZipSubmit(zipCode) }}
          isLoading={loadingStates.zip}
        />

        <div className={styles['divider']}>
          <span>or</span>
        </div>

        <CityStateInput 
          onCitySubmit={(city, state) => { void handleCitySubmit(city, state) }}
          isLoading={loadingStates["city"]}
        />
      </div>

      {/* Location History - Always show when available for quick switching */}
      {showHistory && locationHistory.length > 0 && (
        <LocationHistory
          history={locationHistory}
          onSelect={(location) => { void handleHistorySelect(location) }}
          onSetDefault={handleSetAsDefault}
        />
      )}

      {/* Radius Control (always visible) */}
      <RadiusControl
        radius={preferences.preferredRadius}
        onRadiusChange={handleRadiusChange}
      />

      {/* Error Message with Recovery Action */}
      {error && (
        <div className={styles['error']} role="alert" aria-live="polite">
          <span className={styles['errorIcon']} aria-hidden="true">⚠️</span>
          <span>{error}</span>
          <button 
            className={styles['retryButton']}
            onClick={() => window.location.reload()}
            aria-label="Try again"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  )
}
