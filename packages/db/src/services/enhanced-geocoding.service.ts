/**
 * Enhanced Geocoding Service
 * Integrates caching with the configured geocoder adapter (Mapbox-backed in production).
 */

import type { ExtendedPrismaClient } from '../client.js'
import { GeocodingCacheService, GeocodingQuery, GeocodingResult } from './geocoding-cache.service'
import { createGeocodingAdapter, GeocodingResult as ApiResult } from '../adapters/geocoding.adapter'

export interface GeocodingConfig {
  apiKey: string
  baseUrl?: string
  enableCache?: boolean
  cacheTTLHours?: number
}

export class EnhancedGeocodingService {
  private cacheService: GeocodingCacheService
  private apiAdapter: any

  constructor(
    private prisma: ExtendedPrismaClient,
    private config: GeocodingConfig
  ) {
    this.cacheService = new GeocodingCacheService(prisma)
    this.apiAdapter = createGeocodingAdapter({
      apiKey: config.apiKey,
      baseUrl: config.baseUrl
    })
  }

  /**
   * Geocode a ZIP code with caching
   */
  async geocodeZip(zipCode: string): Promise<GeocodingResult | null> {
    const query: GeocodingQuery = {
      queryType: 'zip',
      queryValue: zipCode
    }

    // Check cache first
    if (this.config.enableCache !== false) {
      console.log(`[Geocoding Service] 🔍 Checking database cache for ZIP ${zipCode}...`)
      const cached = await this.cacheService.getCachedResult(query)
      if (cached) {
        console.log(`[Geocoding Service] ✅ CACHE HIT for ZIP ${zipCode} (source: ${cached.source})`)
        console.log(`[Geocoding Service] 💰 API quota saved! Returning: ${cached.city}, ${cached.state}`)
        return cached
      }
      console.log(`[Geocoding Service] ❌ Cache miss for ZIP ${zipCode}`)
    }

    console.log(`[Geocoding Service] 📡 Calling Positionstack API for ZIP ${zipCode}...`)
    console.log(`[Geocoding Service] 💰 API quota: This will use 1 of 100 monthly requests`)

    try {
      // Call Positionstack API
      const apiResult = await this.apiAdapter.geocodeZipCode(zipCode)
      
      if (!apiResult) {
        console.warn(`[Geocoding Service] ⚠️  API returned null for ZIP ${zipCode}`)
        return null
      }
      
      console.log(`[Geocoding Service] ✅ API returned result for ZIP ${zipCode}:`, apiResult)

      // Convert API result to our format
      const result: GeocodingResult = {
        latitude: apiResult.latitude,
        longitude: apiResult.longitude,
        city: apiResult.city,
        state: apiResult.state,
        zip: apiResult.zip,
        country: apiResult.country,
        formattedAddress: apiResult.formattedAddress,
        confidence: apiResult.confidence,
        source: 'mapbox'
      }

      // Cache the result
      if (this.config.enableCache !== false) {
        console.log(`[Geocoding Service] 💾 Saving ZIP ${zipCode} to database cache...`)
        await this.cacheService.cacheResult(
          query,
          result,
          this.config.cacheTTLHours || 24 * 30 // 30 days default
        )
        console.log(`[Geocoding Service] ✅ Cached ZIP ${zipCode} for 30 days`)
      }

      return result
    } catch (error: any) {
      console.error(`[Geocoding Service] ❌ Error geocoding ZIP ${zipCode}:`, error.message)
      if (error.response) {
        console.error(`[Geocoding Service] API Response:`, error.response.data)
      }
      return null
    }
  }

  /**
   * Geocode a city/state with caching
   */
  async geocodeCity(city: string, state: string): Promise<GeocodingResult | null> {
    const query: GeocodingQuery = {
      queryType: 'city',
      queryValue: `${city}, ${state}`
    }

    // Check cache first
    if (this.config.enableCache !== false) {
      console.log(`[Geocoding Service] 🔍 Checking database cache for City: ${city}, ${state}...`)
      const cached = await this.cacheService.getCachedResult(query)
      if (cached) {
        console.log(`[Geocoding Service] ✅ CACHE HIT for ${city}, ${state} (source: ${cached.source})`)
        console.log(`[Geocoding Service] 💰 API quota saved! Returning cached result`)
        return cached
      }
      console.log(`[Geocoding Service] ❌ Cache miss for ${city}, ${state}`)
    }

    console.log(`[Geocoding Service] 📡 Calling Positionstack API for ${city}, ${state}...`)
    console.log(`[Geocoding Service] 💰 API quota: This will use 1 of 100 monthly requests`)

    try {
      // Call Positionstack API
      const apiResult = await this.apiAdapter.geocodeCityState(city, state)
      
      if (!apiResult) {
        return null
      }

      // Convert API result to our format
      const result: GeocodingResult = {
        latitude: apiResult.latitude,
        longitude: apiResult.longitude,
        city: apiResult.city,
        state: apiResult.state,
        zip: apiResult.zip,
        country: apiResult.country,
        formattedAddress: apiResult.formattedAddress,
        confidence: apiResult.confidence,
        source: 'mapbox'
      }

      // Cache the result
      if (this.config.enableCache !== false) {
        await this.cacheService.cacheResult(
          query,
          result,
          this.config.cacheTTLHours || 24 * 30 // 30 days default
        )
      }

      return result
    } catch (error) {
      console.error('Geocoding API error:', error)
      return null
    }
  }

  /**
   * Geocode a full address with caching
   */
  async geocodeAddress(address: string): Promise<GeocodingResult | null> {
    const query: GeocodingQuery = {
      queryType: 'address',
      queryValue: address
    }

    // Check cache first
    if (this.config.enableCache !== false) {
      const cached = await this.cacheService.getCachedResult(query)
      if (cached) {
        console.log(`Cache hit for address ${address}`)
        return cached
      }
    }

    console.log(`Cache miss for address ${address}, calling API...`)

    try {
      // Call Positionstack API
      const apiResult = await this.apiAdapter.geocodeAddress(address)
      
      if (!apiResult) {
        return null
      }

      // Convert API result to our format
      const result: GeocodingResult = {
        latitude: apiResult.latitude,
        longitude: apiResult.longitude,
        city: apiResult.city,
        state: apiResult.state,
        zip: apiResult.zip,
        country: apiResult.country,
        formattedAddress: apiResult.formattedAddress,
        confidence: apiResult.confidence,
        source: 'mapbox'
      }

      // Cache the result
      if (this.config.enableCache !== false) {
        await this.cacheService.cacheResult(
          query,
          result,
          this.config.cacheTTLHours || 24 * 30 // 30 days default
        )
      }

      return result
    } catch (error) {
      console.error('Geocoding API error:', error)
      return null
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    return await this.cacheService.getCacheStats()
  }

  /**
   * Clear expired cache entries
   */
  async clearExpiredCache() {
    return await this.cacheService.clearExpiredEntries()
  }

  /**
   * Pre-populate cache with common ZIP codes
   */
  async populateCommonZips() {
    return await this.cacheService.populateCommonZips()
  }
}

/**
 * Create enhanced geocoding service with caching
 */
export function createEnhancedGeocodingService(
  prisma: ExtendedPrismaClient,
  config: GeocodingConfig
): EnhancedGeocodingService {
  return new EnhancedGeocodingService(prisma, config)
}
