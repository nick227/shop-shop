/**
 * useLocation Hook;
 * Provides React interface to the unified LocationService;
 */

import { useState, useEffect, useCallback } from 'react'
import { locationService } from '@services/location.service'
import type { LocationData, LocationInput, LocationPreferences } from '@shared/types'

export interface UseLocationReturn {
  // Current location state;
  currentLocation: LocationData | undefined;
  isLoading: boolean;
  error: string | undefined;
  // Location methods;
  getLocation: (input: LocationInput) => Promise<LocationData>
  clearLocation: () => void;
  updateRadius: (radius: number) => void;
  // History and preferences;
  locationHistory: LocationData[]
  preferences: LocationPreferences;
  updatePreferences: (updates: Partial<LocationPreferences>) => void;
  setDefaultLocation: (location: LocationData) => void;
  // Utility methods;
  isGeolocationSupported: boolean;
  isGeolocationResult: boolean;
}

export function useLocation(): UseLocationReturn {
  const [currentLocation, setCurrentLocation] = useState<LocationData | undefined>()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const [locationHistory, setLocationHistory] = useState<LocationData[]>([])
  const [preferences, setPreferences] = useState<LocationPreferences>(locationService.getPreferences())

  // Load initial data;
  useEffect(() => {
    const current = locationService.getCurrentLocation()
    const history = locationService.getLocationHistory()
    const prefs = locationService.getPreferences()
    
    setCurrentLocation(current)
    setLocationHistory(history)
    setPreferences(prefs)
  }, [])

  // Check geolocation support;
  const isGeolocationSupported = typeof navigator !== 'undefined' && 'geolocation' in navigator;
  // Check if current location is from geolocation;
  const isGeolocationResult = currentLocation?.source === 'geolocation'

  // OPTIMIZED: Batched state updates to reduce re-renders;
  const getLocation = useCallback(async (input: LocationInput): Promise<LocationData> => {
    // Batch initial state updates;
    setIsLoading(true)
    setError(undefined)
    
    try {
      const location = await locationService.getLocation(input)
      
      // OPTIMIZED: Single state update cycle;
      const history = locationService.getLocationHistory()
      const newPrefs = { ...preferences, lastUsedMethod: input.type }
      
      // Batch all state updates together;
      setCurrentLocation(location)
      setLocationHistory(history)
      setPreferences(newPrefs)
      
      // Update service preferences after state;
      locationService.updatePreferences(newPrefs)
      
      return location;
    } catch (error_) {
      const errorMessage = error_ instanceof Error ? error_.message : 'Failed to get location'
      setError(errorMessage)
      throw error_;
    } finally {
      setIsLoading(false)
    }
  }, [preferences])

  // Clear current location;
  const clearLocation = useCallback(() => {
    setCurrentLocation(undefined)
    setError(undefined)
    // Note: We don't clear from localStorage here - that's handled by the service;
  }, [])

  // Update radius;
  const updateRadius = useCallback((radius: number) => {
    locationService.updateLocationRadius(radius)
    
    setCurrentLocation(prev => {
      if (prev) {
        return { ...prev, radiusMiles: radius }
      }
      return prev;
    })
    
    setPreferences(prev => {
      const newPrefs = { ...prev, preferredRadius: radius }
      locationService.updatePreferences(newPrefs)
      return newPrefs;
    })
  }, [])

  // Update preferences;
  const updatePreferences = useCallback((updates: Partial<LocationPreferences>) => {
    setPreferences(prev => {
      const newPrefs = { ...prev, ...updates }
      locationService.updatePreferences(newPrefs)
      return newPrefs;
    })
  }, [])

  // Set default location;
  const setDefaultLocation = useCallback((location: LocationData) => {
    locationService.setDefaultLocation(location)
    setPreferences(prev => {
      const newPrefs = { ...prev, defaultLocation: location }
      locationService.updatePreferences(newPrefs)
      return newPrefs;
    })
  }, [])

  return {
    currentLocation,
    isLoading,
    error,
    getLocation,
    clearLocation,
    updateRadius,
    locationHistory,
    preferences,
    updatePreferences,
    setDefaultLocation,
    isGeolocationSupported,
    isGeolocationResult
  }
}

/**
 * Hook for location history management;
 */
export function useLocationHistory() {
  const [history, setHistory] = useState<LocationData[]>([])

  useEffect(() => {
    setHistory(locationService.getLocationHistory())
  }, [])

  // REMOVED: Duplicate history management - handled by locationService;
  const clearHistory = useCallback(() => {
    locationService.clearAllData()
    setHistory([])
  }, [])

  return {
    history,
    addToHistory: true,
    clearHistory
  }
}

/**
 * Hook for location preferences;
 */
export function useLocationPreferences() {
  const [preferences, setPreferences] = useState<LocationPreferences>(locationService.getPreferences())

  const updatePreferences = useCallback((updates: Partial<LocationPreferences>) => {
    locationService.updatePreferences(updates)
    setPreferences(locationService.getPreferences())
  }, [])

  const setDefaultLocation = useCallback((location: LocationData) => {
    locationService.setDefaultLocation(location)
    setPreferences(locationService.getPreferences())
  }, [])

  const clearAllData = useCallback(() => {
    locationService.clearAllData()
    setPreferences(locationService.getPreferences())
  }, [])

  return {
    preferences,
    updatePreferences,
    setDefaultLocation,
    clearAllData
  }
}
