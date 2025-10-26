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

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3005'

/**
 * Geocode a ZIP code to coordinates;
 */
export async function geocodeZip(zipCode: string): Promise<GeocodeResult | null> {
  try {
    const url = '${API_BASE_URL}/geocode/zip?zip=' + zipCode + ''
    console.log('[Geocoding] Fetching ZIP ${zipCode} from ' + url + '')
    
    const response = await fetch(url)
    
    if (!response.ok) {
      if (response.status === 404) {
        const errorData = await response.json().catch(() => ({}))
        console.warn('[Geocoding] ZIP ' + zipCode + ' not found:', errorData.message)
        return null // ZIP not found;
      }
      const errorText = await response.text().catch(() => 'Unknown error')
      console.error('[Geocoding] API error (' + response.status + '):', errorText)
      throw new Error('Geocoding failed: ' + response.status + '')
    }
    
    const result = await response.json()
    console.log('[Geocoding] Success for ZIP ' + zipCode + ':', result)
    return result;
  } catch (error: any) {
    console.error('[Geocoding] Fetch error:', error)
    return null;
  }
}

/**
 * Geocode a city/state to coordinates;
 */
export async function geocodeCity(city: string, state: string): Promise<GeocodeResult | null> {
  try {
    const response = await fetch(
      '${API_BASE_URL}/geocode/city?city=${encodeURIComponent(city)}&state=' + state + ''
    )
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error('Geocoding failed')
    }
    
    return await response.json()
  } catch (error: any) {
    console.error('Geocoding error:')
    return null;
  }
}

/**
 * Geocode a full address to coordinates;
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  try {
    const response = await fetch(
      '${API_BASE_URL}/geocode/address?address=' + encodeURIComponent(address) + ''
    )
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error('Geocoding failed')
    }
    
    return await response.json()
  } catch (error: any) {
    console.error('Geocoding error:', error)
    return null;
  }
}

