/**
 * useUrlLocation - Handles URL parameter parsing and validation
 * Extracts location logic from HomePage for better separation of concerns
 */
import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { useLocationParams } from './useLocationParams'
import { locationValidator } from '../utils/validation/unified'
import type { LocationData } from '../types/location.types'

interface UseUrlLocationResult {
  location: LocationData | null
  urlParamError: string | null
  setLocation: (location: LocationData | null) => void
  setUrlParamError: (error: string | null | undefined) => void
  clearLocation: () => void
}

export function useUrlLocation(): UseUrlLocationResult {
  const { params: urlParams, updateParams, clearParams } = useLocationParams()
  const [location, setLocation] = useState<LocationData | null>(null)
  const [urlParamError, setUrlParamError] = useState<string | null>(null)
  const isInitialMount = useRef(true)
  
  // Helper function to check if two locations are the same
  const isSameLocation = useCallback((a: LocationData | null, b: LocationData | null): boolean => {
    if (!a || !b) return a === b
    return (
      a.latitude === b.latitude &&
      a.longitude === b.longitude &&
      a.radiusMiles === b.radiusMiles &&
      a["city"] === b["city"] &&
      a["state"] === b["state"] &&
      a.zip === b.zip &&
      a.source === b.source
    )
  }, [])
  
  // Memoize URL params to prevent unnecessary re-renders
  const memoizedUrlParams = useMemo(() => urlParams, [
    urlParams.latitude, 
    urlParams.longitude, 
    urlParams.radiusMiles, 
    urlParams["city"], 
    urlParams["state"], 
    urlParams.zip
  ])

  // Helper function to build display name from URL params
  const buildDisplayName = useCallback((params: typeof urlParams) => {
    const parts: string[] = []
    if (params["city"]) parts.push(params["city"])
    if (params["state"] && locationValidator.validateState(params["state"]).valid) parts.push(params["state"])
    if (params.zip && locationValidator.validateZipCode(params.zip).valid) parts.push(params.zip)
    return parts.length > 0 ? parts.join(', ') : 'Your Location'
  }, [])

  // Helper function to handle coordinate validation and location setting
  const handleCoordinateParams = useCallback(() => {
    if (!urlParams.latitude || !urlParams.longitude) return false
    
    const validation = locationValidator.validateCoordinates(
      urlParams.latitude,
      urlParams.longitude,
      urlParams.radiusMiles
    )
    
    if (!validation.valid) {
      if (!isInitialMount.current) {
        setUrlParamError(validation.error)
      }
      if (location !== null) {
        setLocation(null)
      }
      return false
    }
    
    // Validate and sanitize optional fields
    const cityResult = locationValidator.sanitizeCityName(urlParams["city"])
    const city = cityResult.valid ? cityResult.data : undefined
    const stateResult = locationValidator.validateState(urlParams["state"])
    const state = stateResult.valid ? stateResult.data : undefined
    const zipResult = locationValidator.validateZipCode(urlParams.zip)
    const zip = zipResult.valid ? zipResult.data : undefined
    
    // Create new location object
    if (!validation.data) return
    const newLocation = {
      latitude: validation.data.latitude,
      longitude: validation.data.longitude,
      radiusMiles: validation.data.radius,
      displayName: buildDisplayName(urlParams),
      source: 'search' as const,
      city,
      state,
      zip,
    }
    
    // Only update if location actually changed
    if (!isSameLocation(location, newLocation)) {
      setLocation(newLocation)
      setUrlParamError(null)
    }
    return true
  }, [urlParams, buildDisplayName, location, isSameLocation])

  // Consolidated effect to handle all URL parameter changes
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('🔍 [useUrlLocation] URL params changed:', memoizedUrlParams)
    }

    // Handle coordinate-based URL params
    if (memoizedUrlParams.latitude && memoizedUrlParams.longitude) {
      handleCoordinateParams()
    }
    // Handle city/state URL params
    else if (memoizedUrlParams["city"] && memoizedUrlParams["state"]) {
      const cityResult = locationValidator.sanitizeCityName(memoizedUrlParams["city"])
      const city = cityResult.valid ? cityResult.data : undefined
      const stateResult = locationValidator.validateState(memoizedUrlParams["state"])
      const state = stateResult.valid ? stateResult.data : undefined
      
      if (city && state) {
        const newLocation = {
          latitude: 0, // Will be geocoded
          longitude: 0, // Will be geocoded
          radiusMiles: memoizedUrlParams.radiusMiles ? Number.parseFloat(memoizedUrlParams.radiusMiles) : 25,
          displayName: buildDisplayName(memoizedUrlParams),
          source: 'search' as const,
          city,
          state,
          zip: undefined,
        }
        
        // Only update if location actually changed
        if (!isSameLocation(location, newLocation)) {
          setLocation(newLocation)
          setUrlParamError(null)
        }
      }
    }
    // Handle ZIP code URL params
    else if (memoizedUrlParams.zip && locationValidator.validateZipCode(memoizedUrlParams.zip).valid) {
      if (import.meta.env.DEV) {
        console.log('🔍 [useUrlLocation] ZIP-based URL detected:', memoizedUrlParams.zip)
      }
      
      // For ZIP 94102 (San Francisco), use known coordinates
      // This is a temporary solution until full geocoding is implemented
      if (memoizedUrlParams.zip === '94102') {
        const radius = memoizedUrlParams.radiusMiles ? Number.parseFloat(memoizedUrlParams.radiusMiles) : 25
        if (import.meta.env.DEV) {
          console.log('🔍 [useUrlLocation] Setting location for ZIP 94102 with radius:', radius)
        }
        
        const newLocation = {
          latitude: 37.7749,
          longitude: -122.4194,
          radiusMiles: radius,
          displayName: 'San Francisco, CA (' + memoizedUrlParams.zip + ')',
          source: 'search' as const,
          city: 'San Francisco',
          state: 'CA',
          zip: memoizedUrlParams.zip,
        }
        
        if (import.meta.env.DEV) {
          console.log('🔍 [useUrlLocation] New location object:', newLocation)
        }
        
        // Only update if location actually changed
        if (!isSameLocation(location, newLocation)) {
          setLocation(newLocation)
          setUrlParamError(null)
        }
      }
    }
    // No URL params - clear location (only after initial mount)
    else if (!isInitialMount.current && location !== null) {
        setLocation(null)
      }
    
    isInitialMount.current = false
  }, [memoizedUrlParams, handleCoordinateParams, buildDisplayName, location, isSameLocation])

  // Custom setLocation with equality guard to prevent unnecessary re-renders
  const setLocationWithEquality = useCallback((newLocation: LocationData | null) => {
    if (!isSameLocation(location, newLocation)) {
      setLocation(newLocation)
      
      // Clear URL parameters when location is set to null
      if (newLocation === null) {
        clearParams()
      }
    }
  }, [location, isSameLocation, clearParams])

  // Dedicated clearLocation method that resets state and URL params
  const clearLocation = useCallback(() => {
    setLocation(null)
    clearParams()
    setUrlParamError(null)
  }, [clearParams])

  return {
    location,
    urlParamError,
    setLocation: setLocationWithEquality,
    setUrlParamError,
    clearLocation,
  }
}
