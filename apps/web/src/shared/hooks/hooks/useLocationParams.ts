/**
 * useLocationParams - Unified URL parameter handling for location data;
 * Integrates with the LocationService for consistent data management;
 */
import { useSearchParams as useRouterSearchParams, useNavigate, useLocation as useRouterLocation } from 'react-router-dom'
import { useCallback, useMemo } from 'react'
export interface LocationSearchParams {
  latitude?: string;
  longitude?: string;
  radiusMiles?: string;
  city?: string;
  state?: string;
  zip?: string;
  source?: string;
}

function clearLocationKeys(params: URLSearchParams, keys: string[]): void {
  for (const key of keys) params.delete(key)
}

function setParamIfPresent(params: URLSearchParams, key: string, value: string | undefined): void {
  if (value) params.set(key, value)
}

/**
 * Safely decode URI component, returning undefined if it fails;
 */
function safeDecodeURIComponent(value: string | undefined): string | undefined {
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
      latitude: lat ?? undefined,
      longitude: lng ?? undefined,
      radiusMiles: radius ?? undefined,
      city: safeDecodeURIComponent(city ?? undefined),
      state: safeDecodeURIComponent(state ?? undefined),
      zip: zip ?? undefined,
      source: source ?? undefined}
  }, [searchParams])
}

/**
 * Hook to update location search params in URL;
 * Intelligently uses the best parameter format based on location data;
 */
export function useUpdateLocationParams() {
  const navigate = useNavigate()
  const routerLocation = useRouterLocation()
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
      setParamIfPresent(newParams, 'source', params.source)
      setParamIfPresent(newParams, 'radius', params.radiusMiles)
      // Remove other location params;
      clearLocationKeys(newParams, ['lat', 'lng', 'city', 'state'])
    } else if (params.city && params.state) {
      // City/State-based search (readable URL)
      newParams.set('city', params.city)
      newParams.set('state', params.state)
      setParamIfPresent(newParams, 'source', params.source)
      setParamIfPresent(newParams, 'radius', params.radiusMiles)
      // Remove other location params;
      clearLocationKeys(newParams, ['lat', 'lng', 'zip'])
    } else if (params.latitude && params.longitude) {
      // Coordinate-based search (fallback for geolocation)
      newParams.set('lat', params.latitude)
      newParams.set('lng', params.longitude)
      setParamIfPresent(newParams, 'source', params.source)
      setParamIfPresent(newParams, 'radius', params.radiusMiles)
      // Keep city/state if available (for display)
      setParamIfPresent(newParams, 'city', params.city)
      setParamIfPresent(newParams, 'state', params.state)
      // Remove zip since we're using coordinates;
      clearLocationKeys(newParams, ['zip'])
    }
    
    // Check if the new URL is different from the current one;
    const newUrl = `?${newParams.toString()}`
    const currentUrl = `?${searchParams.toString()}`
    
    if (newUrl !== currentUrl) {
      // Navigate with new params (replace to avoid cluttering history)
      navigate(newUrl, { replace: true })
    }
  }, [navigate, searchParams])
  
  const clearParams = useCallback(() => {
    const newParams = new URLSearchParams(searchParams)
    clearLocationKeys(newParams, ['lat', 'lng', 'radius', 'city', 'state', 'zip', 'source'])

    const query = newParams.toString()
    const newUrl = `${routerLocation.pathname}${query ? `?${query}` : ''}${routerLocation.hash}`
    const currentUrl = `${routerLocation.pathname}${routerLocation.search}${routerLocation.hash}`

    if (newUrl !== currentUrl) {
      navigate(newUrl, { replace: true })
    }
  }, [navigate, routerLocation.hash, routerLocation.pathname, routerLocation.search, searchParams])
  
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
