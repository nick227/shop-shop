/**
 * useGeocoding - Handles geocoding requests with debouncing and cancellation
 * Extracts geocoding logic from HomePage for better separation of concerns
 */
import { useCallback, useRef, useEffect } from 'react'
import { geocodeCity } from '@services/geocoding'
import type { LocationData } from '@/types/location.types'

interface UseGeocodingResult {
  geocodeLocation: (city: string, state: string, currentLocation?: LocationData | null) => Promise<LocationData | null>
  isGeocoding: boolean
  geocodingError: string | null
  clearError: () => void
}

type GeocodeCache = Record<string, LocationData>;

export function useGeocoding(): UseGeocodingResult {
  const abortController = useRef<AbortController | null>(null)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cache = useRef<GeocodeCache>({})
  const isGeocodingRef = useRef(false)
  const errorRef = useRef<string | null>(null)
  
  // Environment-safe logging helper
  const isProd = import.meta !== undefined ? import.meta.env?.MODE === 'production' : process.env.NODE_ENV === 'production'

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
      if (abortController.current) {
        abortController.current.abort()
      }
    }
  }, [])

  // Debounce helper
  const debounce = useCallback((fn: Function, delay: number) => {
    return (...args: any[]) => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
      debounceTimer.current = setTimeout(() => fn(...args), delay)
    }
  }, [])

  const geocodeLocation = useCallback(async (
    city: string, 
    state: string, 
    currentLocation?: LocationData | null
  ): Promise<LocationData | null> => {
    const cacheKey = '${city},' + state + ''
    
    // Check cache first
    if (cache.current[cacheKey]) {
      if (!isProd) {
        console.log('[useGeocoding] Cache hit for ' + cacheKey + '')
      }
      return cache.current[cacheKey]
    }

    // Clear any existing debounce timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    // Cancel any existing request
    if (abortController.current) {
      abortController.current.abort()
    }

    return new Promise((resolve) => {
      // Create new abort controller for this request
      abortController.current = new AbortController()
      const currentAbortController = abortController.current

      // Debounce the geocoding request by 300ms
      debounceTimer.current = setTimeout(async () => {
        // Check if this request was already aborted
        if (currentAbortController.signal.aborted) {
          resolve(null)
          return
        }

        isGeocodingRef.current = true
        errorRef.current = null

        try {
          if (!isProd) {
            console.log('[useGeocoding] Geocoding ${city}, ' + state + '')
          }

          // Geocode the city/state first to get valid coordinates
          const geocodeResult = await geocodeCity(city, state)

          // Check if request was aborted during geocoding
          if (currentAbortController.signal.aborted) {
            resolve(null)
            return
          }

          if (geocodeResult) {
            // Create a new location with geocoded coordinates
            const newLocation: LocationData = {
              latitude: geocodeResult.latitude,
              longitude: geocodeResult.longitude,
              radiusMiles: currentLocation?.radiusMiles ?? 25,
              displayName: geocodeResult.displayName || '${city}, ' + state + '',
              source: 'manual',
              city: geocodeResult["city"] || city,
              state: geocodeResult["state"] || state,
              zip: geocodeResult.zip,
            }

            // Cache the result
            cache.current[cacheKey] = newLocation

            if (!isProd) {
              console.log(`[useGeocoding] Success:`, newLocation)
            }

            resolve(newLocation)
          } else {
            const errorMsg = 'Failed to geocode ${city}, ' + state + ''
            errorRef.current = errorMsg
            
            if (!isProd) {
              console.warn('[useGeocoding] ' + errorMsg + '')
            }
            
            resolve(null)
          }
        } catch (error: any) {
          // Ignore abort errors
          if ((error as any) instanceof Error && error !== null && (error.name === 'AbortError' || currentAbortController.signal.aborted)) {
            resolve(null)
            return
          }

          const errorMsg = 'Geocoding error: ' + ((error as any) instanceof Error ? error.message : 'Unknown error')
          errorRef.current = errorMsg

          if (!isProd) {
            console.error('[useGeocoding] ' + errorMsg + '')
          }

          resolve(null)
        } finally {
          isGeocodingRef.current = false
          abortController.current = null
        }
      }, 300) // 300ms debounce
    })
  }, [])

  const clearError = useCallback(() => {
    errorRef.current = null
  }, [])

  return {
    geocodeLocation,
    isGeocoding: isGeocodingRef.current,
    geocodingError: errorRef.current,
    clearError,
  }
}
