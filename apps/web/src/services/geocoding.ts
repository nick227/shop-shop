/**
 * Geocoding Service - Frontend API client;
 */

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  displayName: string;
}

function apiOriginForRequests(): string {
  const raw = import.meta.env.VITE_API_URL
  if (raw !== undefined && raw !== '') return String(raw).replace(/\/$/, '')
  return import.meta.env.DEV ? '' : 'http://localhost:3005'
}

// const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3005'

/**
 * Geocode a ZIP code to coordinates;
 */
export async function geocodeZip(zipCode: string): Promise<GeocodeResult | undefined> {
  try {
    const apiBaseUrl = apiOriginForRequests()
    const url = `${apiBaseUrl}/geocode/zip?zip=${zipCode}`
    console.log(`[Geocoding] Fetching ZIP ${zipCode} from ${url}`)
    
    const response = await fetch(url)
    
    if (!response.ok) {
      if (response.status === 404) {
        const errorData = await response.json().catch(() => ({})) as { message?: string }
        console.warn(`[Geocoding] ZIP ${zipCode} not found:`, errorData.message)
        return undefined // ZIP not found;
      }
      const errorText = await response.text().catch(() => 'Unknown error')
      console.error(`[Geocoding] API error (${response.status}):`, errorText)
      throw new Error(`Geocoding failed: ${response.status}`)
    }
    
    const result = await response.json() as GeocodeResult
    console.log(`[Geocoding] Success for ZIP ${zipCode}:`, result)
    return result;
  } catch (error: unknown) {
    console.error('[Geocoding] Fetch error:', error)
    return undefined;
  }
}

/**
 * Geocode a city/state to coordinates;
 */
export async function geocodeCity(city: string, state: string): Promise<GeocodeResult | undefined> {
  try {
    const apiBaseUrl = apiOriginForRequests()
    const url = `${apiBaseUrl}/geocode/city?city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}`
    console.log(`[Geocoding] Fetching city ${city}, ${state} from ${url}`)
    
    const response = await fetch(url)
    
    if (!response.ok) {
      if (response.status === 404) {
        const errorData = await response.json().catch(() => ({})) as { message?: string }
        console.warn(`[Geocoding] City ${city}, ${state} not found:`, errorData.message)
        return undefined // City not found;
      }
      const errorText = await response.text().catch(() => 'Unknown error')
      console.error(`[Geocoding] API error (${response.status}):`, errorText)
      throw new Error(`Geocoding failed: ${response.status}`)
    }
    
    const result = await response.json() as GeocodeResult
    console.log(`[Geocoding] Success for city ${city}, ${state}:`, result)
    return result;
  } catch (error: unknown) {
    console.error('[Geocoding] Fetch error:', error)
    return undefined;
  }
}

/**
 * Geocode a full address to coordinates;
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult | undefined> {
  try {
    const apiBaseUrl = apiOriginForRequests()
    const url = `${apiBaseUrl}/geocode/address?address=${encodeURIComponent(address)}`
    console.log(`[Geocoding] Fetching address from ${url}`)
    
    const response = await fetch(url)
    
    if (!response.ok) {
      if (response.status === 404) {
        const errorData = await response.json().catch(() => ({})) as { message?: string }
        console.warn(`[Geocoding] Address not found:`, errorData.message)
        return undefined // Address not found;
      }
      const errorText = await response.text().catch(() => 'Unknown error')
      console.error(`[Geocoding] API error (${response.status}):`, errorText)
      throw new Error(`Geocoding failed: ${response.status}`)
    }
    
    const result = await response.json() as GeocodeResult
    console.log(`[Geocoding] Success for address:`, result)
    return result;
  } catch (error: unknown) {
    console.error('[Geocoding] Fetch error:', error)
    return undefined;
  }
}

