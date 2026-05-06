/**
 * LocationSearch — device geolocation only (city/ZIP/radius/history removed).
 */
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useLocation } from '@shared/hooks/hooks/useLocation'
import type { LocationData } from '@shared/types/types/location.types'
import { CurrentLocationBadge } from './CurrentLocationBadge'
import { GeolocationButton } from './GeolocationButton'

interface LocationSearchProps {
  readonly onLocationChange: (location: LocationData | undefined) => void
  readonly initialRadius?: number
}

export function LocationSearch({ onLocationChange, initialRadius = 25 }: LocationSearchProps) {
  const {
    currentLocation,
    isLoading,
    error,
    getLocation,
    clearLocation,
    updateRadius,
    preferences,
    updatePreferences,
    isGeolocationSupported,
  } = useLocation()

  const [activeGeo, setActiveGeo] = useState(false)

  const onLocationChangeRef = useRef(onLocationChange)
  onLocationChangeRef.current = onLocationChange
  const hasSeenInitialLocation = useRef(false)

  const [radiusInitialized, setRadiusInitialized] = useState(false)
  useEffect(() => {
    if (!radiusInitialized && initialRadius !== preferences.preferredRadius) {
      updateRadius(initialRadius)
      setRadiusInitialized(true)
    }
  }, [initialRadius, preferences.preferredRadius, updateRadius, radiusInitialized])

  useEffect(() => {
    if (!hasSeenInitialLocation.current) {
      hasSeenInitialLocation.current = true
      if (currentLocation === undefined) return
    }
    onLocationChangeRef.current(currentLocation)
  }, [currentLocation])

  const handleUseMyLocation = useCallback(async () => {
    setActiveGeo(true)
    try {
      await getLocation({ type: 'geolocation', value: '' })
    } catch {
      /* surfaced via hook error */
    } finally {
      setActiveGeo(false)
    }
  }, [getLocation])

  const handleClear = useCallback(() => {
    clearLocation()
  }, [clearLocation])

  const handleSetAsDefault = useCallback(
    (loc: LocationData) => {
      updatePreferences({ defaultLocation: loc })
    },
    [updatePreferences],
  )

  const geoLoading = useMemo(() => activeGeo && isLoading, [activeGeo, isLoading])

  return (
    <div className="w-full space-y-4" aria-busy={isLoading} aria-live="polite">
      {currentLocation ? (
        <CurrentLocationBadge
          locationName={currentLocation.displayName ?? 'Unknown Location'}
          onClear={handleClear}
          onSetDefault={() => handleSetAsDefault(currentLocation)}
        />
      ) : null}

      <div className="space-y-3 rounded-lg border border-border bg-card p-4">
        {isGeolocationSupported ? (
          <GeolocationButton onGetLocation={() => void handleUseMyLocation()} isLoading={geoLoading} />
        ) : (
          <p className="text-sm text-muted-foreground">
            Geolocation isn&apos;t available in this browser. Open search from the home page using a city card.
          </p>
        )}
      </div>

      {error ? (
        <div
          className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-foreground"
          role="status"
          aria-live="polite"
        >
          <p className="font-medium text-foreground">Location unavailable</p>
          <p className="mt-1 text-muted-foreground">{error}</p>
        </div>
      ) : null}
    </div>
  )
}
