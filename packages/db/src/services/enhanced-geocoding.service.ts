/**
 * Enhanced Geocoding Service
 * Integrates caching with the configured geocoder adapter (Mapbox-backed in production).
 */

import type { ExtendedPrismaClient } from '../client.js'
import { GeocodingCacheService, GeocodingQuery, GeocodingResult } from './geocoding-cache.service.js'
import {
  createGeocodingAdapter,
  GeocodingResult as ApiResult,
} from '../adapters/geocoding.adapter.js'
import { lookupPostalCode } from '../geo/place-directory.js'

export interface GeocodingConfig {
  apiKey: string
  baseUrl?: string
  enableCache?: boolean
  cacheTTLHours?: number
}

function apiToGeocodingResult(api: ApiResult): GeocodingResult {
  return {
    latitude: api.latitude,
    longitude: api.longitude,
    city: api.city,
    state: api.state,
    zip: api.zip,
    country: api.country,
    formattedAddress: api.formattedAddress,
    confidence: api.confidence,
    source: 'mapbox',
  }
}

export class EnhancedGeocodingService {
  private readonly cacheService: GeocodingCacheService
  private readonly apiAdapter: ReturnType<typeof createGeocodingAdapter>

  constructor(
    private readonly prisma: ExtendedPrismaClient,
    private readonly config: GeocodingConfig,
  ) {
    this.cacheService = new GeocodingCacheService(prisma)
    this.apiAdapter = createGeocodingAdapter({
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
    })
  }

  private cacheTtlHours(): number {
    return this.config.cacheTTLHours ?? 24 * 30
  }

  private cachingEnabled(): boolean {
    return this.config.enableCache !== false
  }

  /**
   * Shared path: cache lookup → API → cache write. Single iteration over the flow.
   */
  private async geocodeWithCache(
    query: GeocodingQuery,
    label: string,
    fetchApi: () => Promise<ApiResult | null>,
    options: { readonly throwOnProviderError?: boolean } = {},
  ): Promise<GeocodingResult | null> {
    if (this.cachingEnabled()) {
      const cached = await this.cacheService.getCachedResult(query)
      if (cached) {
        console.log(`[Geocoding] cache hit ${label} (source: ${cached.source})`)
        return cached
      }
    }

    console.log(`[Geocoding] cache miss ${label}`)

    try {
      const apiResult = await fetchApi()
      if (!apiResult) {
        console.warn(`[Geocoding] API returned null ${label}`)
        return null
      }

      const result = apiToGeocodingResult(apiResult)
      if (this.cachingEnabled()) {
        await this.cacheService.cacheResult(query, result, this.cacheTtlHours())
      }
      return result
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error)
      console.error(`[Geocoding] error ${label}:`, msg)
      const withResponse = error as { response?: { data?: unknown } }
      if (withResponse.response?.data !== undefined) {
        console.error('[Geocoding] API response body:', withResponse.response.data)
      }
      if (options.throwOnProviderError) throw new GeocoderUnavailableError(msg)
      return null
    }
  }

  async geocodeZip(zipCode: string): Promise<GeocodingResult | null> {
    const postal = await lookupPostalCode(this.prisma, zipCode)
    if (postal) return postal
    return this.geocodeWithCache(
      { queryType: 'zip', queryValue: zipCode },
      `zip=${zipCode}`,
      () => this.apiAdapter.geocodeZipCode(zipCode),
      // A failed provider call (bad key, outage) is not the same as a ZIP that does not exist.
      { throwOnProviderError: true },
    )
  }

  async geocodeCity(city: string, state: string): Promise<GeocodingResult | null> {
    const queryValue = `${city}, ${state}`
    return this.geocodeWithCache(
      { queryType: 'city', queryValue },
      `city=${queryValue}`,
      () => this.apiAdapter.geocodeCityState(city, state),
    )
  }

  async geocodeAddress(address: string): Promise<GeocodingResult | null> {
    const short = address.length > 48 ? `${address.slice(0, 48)}…` : address
    return this.geocodeWithCache(
      { queryType: 'address', queryValue: address },
      `address="${short}"`,
      () => this.apiAdapter.geocodeAddress(address),
    )
  }

  async getCacheStats() {
    return this.cacheService.getCacheStats()
  }

  async clearExpiredCache() {
    return this.cacheService.clearExpiredEntries()
  }

  async populateCommonZips() {
    return this.cacheService.populateCommonZips()
  }
}

/** The external geocoder failed, so the lookup says nothing about whether the place exists. */
export class GeocoderUnavailableError extends Error {
  constructor(detail: string) {
    super(`Geocoder unavailable: ${detail}`)
    this.name = 'GeocoderUnavailableError'
  }
}

export function createEnhancedGeocodingService(
  prisma: ExtendedPrismaClient,
  config: GeocodingConfig,
): EnhancedGeocodingService {
  return new EnhancedGeocodingService(prisma, config)
}
