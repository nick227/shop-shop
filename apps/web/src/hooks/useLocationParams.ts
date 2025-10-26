/**
 * useLocationParams - Unified URL parameter handling for location data;
 * Integrates with the LocationService for consistent data management;
 */
import { useSearchParams as useRouterSearchParams, useNavigate } from 'react-router-dom'
import { useCallback, useMemo } from 'react'
import type { ListStoresRequest } from '@packages/sdk'

export type LocationSearchParams = Pick<ListStoresRequest, 'latitude' | 'longitude' | 'radiusMiles' | 'city' | 'state' | 'zip'> & {
  source?: string;
}

/**
 * Safely decode URI component, returning undefined if it fails;
 */
function safeDecodeURIComponent(value: string | null): string | undefined {
  if (!value) return undefined;
  try {
    return decodeURIComponent(value)
  } catch {
    console.warn('Failed to decode URI component:', value)
    return value // Return as-is if decode fails;
  }
}

/**
 * Hook to read location-related search params from URL;
 * Automatically syncs with LocationService;
 */
export function useLocationSearchParams() {
  const [searchParams] = useRouterSearchParams()
  
  return useMemo(() => {
    const lat = searchParams.get('lat')
    const lng = searchParams.get('lng')
    const radius = searchParams.get('radius')
    const city = searchParams.get('city')
    const state = searchParams.get('state')
    const zip = searchParams.get('zip')
    const source = searchParams.get('source')
    
    return {
      latitude: lat || undefined,
      longitude: lng || undefined,
      radiusMiles: radius || undefined,
      city: safeDecodeURIComponent(city),
      state: safeDecodeURIComponent(state),
      zip: zip || undefined,
      source: source || undefined}
  }, [searchParams])
}

/**
 * Hook to update location search params in URL;
 * Intelligently uses the best parameter format based on location data;
 */
export function useUpdateLocationParams() {
  const navigate = useNavigate()
  const [searchParams] = useRouterSearchParams()
  
  const updateParams = useCallback((params: Partial<LocationSearchParams>) => {
    const newParams = new URLSearchParams(searchParams)
    
    // Smart URL parameter strategy:
    // 1. If ZIP is available, use ONLY zip + radius (cleanest)
    // 2. If city/state available, use ONLY city/state + radius (readable)
    // 3. Otherwise, use coordinates (fallback for geolocation)
    
    if (params.zip) {
      // ZIP-based search (cleanest URL)
      newParams.set('zip', params.zip)
      if (params.source) newParams.set('source', params.source)
      if (params.radiusMiles) newParams.set('radius', params.radiusMiles)
      // Remove other location params;
      newParams.delete('lat')
      newParams.delete('lng')
      newParams.delete('city')
      newParams.delete('state')
    } else if (params["city"] && params["state"]) {
      // City/State-based search (readable URL)
      newParams.set('city', params["city"])
      newParams.set('state', params["state"])
      if (params.source) newParams.set('source', params.source)
      if (params.radiusMiles) newParams.set('radius', params.radiusMiles)
      // Remove other location params;
      newParams.delete('lat')
      newParams.delete('lng')
      newParams.delete('zip')
    } else if (params.latitude && params.longitude) {
      // Coordinate-based search (fallback for geolocation)
      newParams.set('lat', params.latitude)
      newParams.set('lng', params.longitude)
      if (params.source) newParams.set('source', params.source)
      if (params.radiusMiles) newParams.set('radius', params.radiusMiles)
      // Keep city/state if available (for display)
      if (params["city"]) newParams.set('city', params["city"])
      if (params["state"]) newParams.set('state', params["state"])
      // Remove zip since we're using coordinates;
      newParams.delete('zip')
    }
    
    // Check if the new URL is different from the current one;
    const newUrl = '?' + newParams.toString() + ''
    const currentUrl = '?' + searchParams.toString() + ''
    
    if (newUrl !== currentUrl) {
      // Navigate with new params (replace to avoid cluttering history)
      navigate(newUrl, { replace: true })
    }
  }, [navigate, searchParams])
  
  const clearParams = useCallback(() => {
    navigate('/', { replace: true })
  }, [navigate])
  
  return { updateParams, clearParams }
}

/**
 * Combined hook for both reading and writing location params;
 * Manual sync - parent components should manage the relationship between URL and location state;
 */
export function useLocationParams() {
  const params = useLocationSearchParams()
  const { updateParams, clearParams } = useUpdateLocationParams()
  
  // Remove auto-sync effects to prevent circular dependencies;
  // URL params and location state should be managed separately by parent components;
  return {
    params,
    updateParams,
    clearParams
  }
}
