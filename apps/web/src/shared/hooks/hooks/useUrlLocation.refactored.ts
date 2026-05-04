/**
 * useUrlLocation - Refactored URL parameter parsing and validation
 * 
 * Simplified and extracted utilities for better separation of concerns
 */

import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { useLocationParams } from './useLocationParams'
import { 
  isSameLocation, 
  processUrlParams,
  detectUrlParamType,
  type LocationData 
} from './utils/urlLocationUtils'

interface UseUrlLocationResult {
  location: LocationData | undefined
  urlParamError: string | undefined
  setLocation: (location: LocationData | undefined) => void
  setUrlParamError: (error: string | undefined) => void
  clearLocation: () => void
}

export function useUrlLocation(): UseUrlLocationResult {
  const { params: urlParams, clearParams } = useLocationParams()
  const [location, setLocation] = useState<LocationData | undefined>()
  const [urlParamError, setUrlParamError] = useState<string | undefined>()
  const isInitialMount = useRef(true)
  
  // Memoize URL params to prevent unnecessary re-renders
  const memoizedUrlParams = useMemo(() => urlParams, [
    urlParams.latitude, 
    urlParams.longitude, 
    urlParams.radiusMiles, 
    urlParams.city, 
    urlParams.state, 
    urlParams.zip
  ])

  // ========================================
  // Main Effect - Process URL Parameters
  // ========================================
  
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('🔍 [useUrlLocation] URL params changed:', memoizedUrlParams)
    }

    // Process URL parameters using extracted utilities
    const result = processUrlParams(memoizedUrlParams)
    const paramType = detectUrlParamType(memoizedUrlParams)
    
    if (result.valid && result.location) {
      // Only update if location actually changed
      if (!isSameLocation(location, result.location)) {
        setLocation(result.location)
        setUrlParamError(undefined)
      }
    } else {
      // Handle error cases (only after initial mount)
      if (!isInitialMount.current) {
        setUrlParamError(result.error)
      }
      
      // Clear location if we had one before
      if (location !== undefined) {
        setLocation(undefined)
      }
    }
    
    // Clear location if no valid params (only after initial mount)
    if (!isInitialMount.current && paramType === 'none' && location !== undefined) {
      setLocation(undefined)
    }
    
    isInitialMount.current = false
  }, [memoizedUrlParams, location])

  // ========================================
  // Location Management Functions
  // ========================================
  
  // Custom setLocation with equality guard to prevent unnecessary re-renders
  const setLocationWithEquality = useCallback((newLocation: LocationData | undefined) => {
    if (!isSameLocation(location, newLocation)) {
      setLocation(newLocation)
      
      // Clear URL parameters when location is set to undefined
      if (newLocation === undefined) {
        clearParams()
      }
    }
  }, [location, clearParams])

  // Dedicated clearLocation method that resets state and URL params
  const clearLocation = useCallback(() => {
    setLocation(undefined)
    clearParams()
    setUrlParamError(undefined)
  }, [clearParams])

  return {
    location,
    urlParamError,
    setLocation: setLocationWithEquality,
    setUrlParamError,
    clearLocation,
  }
}
