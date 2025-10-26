/**
 * Geocoding Adapter
 * Converts addresses to geographic coordinates using Positionstack API
 * Free tier: 25,000 requests/month
 */
import axios from 'axios'

export interface GeocodingResult {
  latitude: number
  longitude: number
  confidence: 'high' | 'medium' | 'low'
  formattedAddress: string
  city?: string
  state?: string
  zip?: string
  country?: string
}

export interface GeocodingConfig {
  apiKey: string
  baseUrl?: string
}

class GeocodingAdapter {
  private apiKey: string
  private baseUrl: string

  constructor(config: GeocodingConfig) {
    this.apiKey = config.apiKey
    this.baseUrl = config.baseUrl || 'http://api.positionstack.com/v1'
  }

  /**
   * Geocode a full address string
   */
  async geocodeAddress(address: string): Promise<GeocodingResult | null> {
    if (!address || address.trim().length === 0) {
      return null
    }

    try {
      const url = `${this.baseUrl}/forward`
      const params = {
        access_key: this.apiKey,
        query: address,
        limit: 1,
      }
      
      console.log(`[Geocoding API] Calling Positionstack: ${url}`)
      console.log(`[Geocoding API] Query: "${address}"`)
      console.log(`[Geocoding API] API Key: ${this.apiKey.substring(0, 8)}...`)
      
      const response = await axios.get(url, { params, timeout: 10000 })

      console.log(`[Geocoding API] Response status: ${response.status}`)
      console.log(`[Geocoding API] Response data:`, JSON.stringify(response.data, null, 2))

      if (!response.data?.data || response.data.data.length === 0) {
        console.warn(`[Geocoding API] ⚠️  No results for address: ${address}`)
        console.warn(`[Geocoding API] Full response:`, response.data)
        return null
      }

      const result = response.data.data[0]
      
      const geocoded = {
        latitude: result.latitude,
        longitude: result.longitude,
        confidence: this.mapConfidence(result.confidence),
        formattedAddress: result.label || address,
        city: result.locality || result.region,
        state: result.region_code,
        zip: result.postal_code,
        country: result.country_code,
      }
      
      console.log(`[Geocoding API] ✅ Success:`, geocoded)
      return geocoded
    } catch (error: any) {
      console.error('[Geocoding API] ❌ Error geocoding address:', error.message)
      if (error.response) {
        console.error('[Geocoding API] Response status:', error.response.status)
        console.error('[Geocoding API] Response data:', error.response.data)
      }
      throw new Error(`Failed to geocode address: ${address} - ${error.message}`)
    }
  }

  /**
   * Geocode a zip code with explicit country parameter
   */
  async geocodeZipCode(zip: string, country: string = 'US'): Promise<GeocodingResult | null> {
    try {
      const url = `${this.baseUrl}/forward`
      const params = {
        access_key: this.apiKey,
        query: zip,  // Just the ZIP code
        country: country,  // Explicit country parameter
        limit: 1,
      }
      
      console.log(`[Geocoding API] Calling Positionstack for ZIP: ${url}`)
      console.log(`[Geocoding API] ZIP Query: "${zip}"`)
      console.log(`[Geocoding API] Country: "${country}"`)
      console.log(`[Geocoding API] API Key: ${this.apiKey.substring(0, 8)}...`)
      
      const response = await axios.get(url, { params, timeout: 10000 })

      console.log(`[Geocoding API] Response status: ${response.status}`)
      console.log(`[Geocoding API] Response data:`, JSON.stringify(response.data, null, 2))

      if (!response.data?.data || response.data.data.length === 0) {
        console.warn(`[Geocoding API] ⚠️  No results for ZIP: ${zip} in ${country}`)
        console.warn(`[Geocoding API] Full response:`, response.data)
        return null
      }

      const result = response.data.data[0]
      
      // Validate the country code matches
      if (result.country_code !== country && result.country_code !== this.mapCountryCode(country)) {
        console.warn(`[Geocoding API] ⚠️  Country mismatch: expected ${country}, got ${result.country_code}`)
        console.warn(`[Geocoding API] Result:`, result)
        return null
      }
      
      const geocoded = {
        latitude: result.latitude,
        longitude: result.longitude,
        confidence: this.mapConfidence(result.confidence),
        formattedAddress: result.label || `${zip}, ${country}`,
        city: result.locality || result.region,
        state: result.region_code,
        zip: result.postal_code,
        country: result.country_code,
      }
      
      console.log(`[Geocoding API] ✅ Success:`, geocoded)
      return geocoded
    } catch (error: any) {
      console.error('[Geocoding API] ❌ Error geocoding ZIP:', error.message)
      if (error.response) {
        console.error('[Geocoding API] Response status:', error.response.status)
        console.error('[Geocoding API] Response data:', error.response.data)
      }
      throw new Error(`Failed to geocode ZIP: ${zip} - ${error.message}`)
    }
  }

  /**
   * Geocode city and state with explicit country parameter
   */
  async geocodeCityState(city: string, state: string, country: string = 'US'): Promise<GeocodingResult | null> {
    try {
      const url = `${this.baseUrl}/forward`
      const params = {
        access_key: this.apiKey,
        query: `${city}, ${state}`,  // City and state
        country: country,  // Explicit country parameter
        limit: 1,
      }
      
      console.log(`[Geocoding API] Calling Positionstack for City/State: ${url}`)
      console.log(`[Geocoding API] City/State Query: "${city}, ${state}"`)
      console.log(`[Geocoding API] Country: "${country}"`)
      console.log(`[Geocoding API] API Key: ${this.apiKey.substring(0, 8)}...`)
      
      const response = await axios.get(url, { params, timeout: 10000 })

      console.log(`[Geocoding API] Response status: ${response.status}`)
      console.log(`[Geocoding API] Response data:`, JSON.stringify(response.data, null, 2))

      if (!response.data?.data || response.data.data.length === 0) {
        console.warn(`[Geocoding API] ⚠️  No results for City/State: ${city}, ${state} in ${country}`)
        console.warn(`[Geocoding API] Full response:`, response.data)
        return null
      }

      const result = response.data.data[0]
      
      // Validate the country code matches
      if (result.country_code !== country && result.country_code !== this.mapCountryCode(country)) {
        console.warn(`[Geocoding API] ⚠️  Country mismatch: expected ${country}, got ${result.country_code}`)
        console.warn(`[Geocoding API] Result:`, result)
        return null
      }
      
      const geocoded = {
        latitude: result.latitude,
        longitude: result.longitude,
        confidence: this.mapConfidence(result.confidence),
        formattedAddress: result.label || `${city}, ${state}, ${country}`,
        city: result.locality || result.region,
        state: result.region_code,
        zip: result.postal_code,
        country: result.country_code,
      }
      
      console.log(`[Geocoding API] ✅ Success:`, geocoded)
      return geocoded
    } catch (error: any) {
      console.error('[Geocoding API] ❌ Error geocoding City/State:', error.message)
      if (error.response) {
        console.error('[Geocoding API] Response status:', error.response.status)
        console.error('[Geocoding API] Response data:', error.response.data)
      }
      throw new Error(`Failed to geocode City/State: ${city}, ${state} - ${error.message}`)
    }
  }

  /**
   * Reverse geocode coordinates to address
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<string | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/reverse`, {
        params: {
          access_key: this.apiKey,
          query: `${latitude},${longitude}`,
          limit: 1,
        },
        timeout: 10000,
      })

      if (!response.data?.data || response.data.data.length === 0) {
        return null
      }

      return response.data.data[0].label || null
    } catch (error) {
      console.error('[Geocoding] Error reverse geocoding:', error)
      return null
    }
  }

  /**
   * Map Positionstack confidence to our simplified scale
   */
  private mapConfidence(apiConfidence?: number): 'high' | 'medium' | 'low' {
    if (!apiConfidence) return 'low'
    if (apiConfidence >= 0.8) return 'high'
    if (apiConfidence >= 0.5) return 'medium'
    return 'low'
  }

  /**
   * Map country code to ISO-3 format (what Positionstack returns)
   */
  private mapCountryCode(country: string): string {
    const countryMap: Record<string, string> = {
      'US': 'USA',
      'CA': 'CAN',
      'GB': 'GBR',
      'AU': 'AUS',
      'DE': 'DEU',
      'FR': 'FRA',
    }
    return countryMap[country] || country
  }

}

// Singleton instance
let geocodingInstance: GeocodingAdapter | null = null

export function createGeocodingAdapter(config: GeocodingConfig): GeocodingAdapter {
  if (!geocodingInstance) {
    geocodingInstance = new GeocodingAdapter(config)
  }
  return geocodingInstance
}

export function getGeocodingAdapter(): GeocodingAdapter {
  if (!geocodingInstance) {
    throw new Error('Geocoding adapter not initialized. Call createGeocodingAdapter first.')
  }
  return geocodingInstance
}

