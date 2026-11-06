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
import { MapsCoGeocodingAdapter } from '../adapters/mapsco-geocoding.adapter.js'
import { lookupPostalCode } from '../geo/place-directory.js'
import { lookupZipReference } from '../geo/zip-reference.js'

export interface GeocodingConfig {
  apiKey: string
  baseUrl?: string
  /** geocode.maps.co key, asked when Positionstack fails or finds nothing. */
  fallbackApiKey?: string
  enableCache?: boolean
  cacheTTLHours?: number
}

type ProviderName = GeocodingResult['source']

/** The lookups both providers implement. */
interface GeocodingProvider {
  geocodeZipCode(zip: string): Promise<ApiResult | null>
  geocodeCityState(city: string, state: string): Promise<ApiResult | null>
  geocodeAddress(address: string): Promise<ApiResult | null>
}

function apiToGeocodingResult(api: ApiResult, source: ProviderName): GeocodingResult {
  return {
    latitude: api.latitude,
    longitude: api.longitude,
    city: api.city,
    state: api.state,
    zip: api.zip,
    country: api.country,
    formattedAddress: api.formattedAddress,
    confidence: api.confidence,
    source,
  }
}

export class EnhancedGeocodingService {
  private readonly cacheService: GeocodingCacheService
  private readonly apiAdapter: ReturnType<typeof createGeocodingAdapter>
  private readonly providers: readonly { readonly name: ProviderName; readonly adapter: GeocodingProvider }[]

  constructor(
    private readonly prisma: ExtendedPrismaClient,
    private readonly config: GeocodingConfig,
  ) {
    this.cacheService = new GeocodingCacheService(prisma)
    this.apiAdapter = createGeocodingAdapter({
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
    })
    this.providers = [
      { name: 'positionstack', adapter: this.apiAdapter },
      ...(config.fallbackApiKey ? [{ name: 'mapsco' as const, adapter: new MapsCoGeocodingAdapter(config.fallbackApiKey) }] : []),
    ]
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
    fetchApi: (provider: GeocodingProvider) => Promise<ApiResult | null>,
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

    // Ask each provider in turn. A miss from one is not final while another can still answer;
    // the lookup is "unavailable" only when every provider failed rather than answered.
    let answered = false
    let lastError = ''
    let found: { readonly api: ApiResult; readonly source: ProviderName } | undefined
    for (const provider of this.providers) {
      try {
        const api = await fetchApi(provider.adapter)
        answered = true
        if (api) {
          found = { api, source: provider.name }
          break
        }
        console.warn(`[Geocoding] ${provider.name} found nothing ${label}`)
      } catch (error: unknown) {
        lastError = error instanceof Error ? error.message : String(error)
        console.error(`[Geocoding] ${provider.name} error ${label}:`, lastError)
        const withResponse = error as { response?: { data?: unknown } }
        if (withResponse.response?.data !== undefined) {
          console.error('[Geocoding] API response body:', withResponse.response.data)
        }
      }
    }
    if (!found) {
      if (!answered && options.throwOnProviderError) throw new GeocoderUnavailableError(lastError)
      return null
    }

    const result = apiToGeocodingResult(found.api, found.source)
    if (this.cachingEnabled()) {
      // A cache problem must not turn a good answer into a failed lookup.
      try {
        await this.cacheService.cacheResult(query, result, this.cacheTtlHours())
      } catch (error: unknown) {
        console.error(`[Geocoding] cache write failed ${label}:`, error instanceof Error ? error.message : String(error))
      }
    }
    return result
  }

  /**
   * ZIP → area centroid. Served ZIPs first, then the national reference, then external providers.
   * A reference record with an estimated position is confirmed externally when possible, and
   * still answers if the providers fail or find nothing.
   */
  async geocodeZip(zipCode: string): Promise<GeocodingResult | null> {
    const postal = await lookupPostalCode(this.prisma, zipCode)
    if (postal) return postal
    const reference = await lookupZipReference(this.prisma, zipCode).catch((error: unknown) => {
      console.error(`[Geocoding] ZIP reference lookup failed zip=${zipCode}:`, error instanceof Error ? error.message : String(error))
      return null
    })
    if (reference && !reference.questionable) return reference.result
    try {
      const external = await this.geocodeWithCache(
        { queryType: 'zip', queryValue: zipCode },
        `zip=${zipCode}`,
        (provider) => provider.geocodeZipCode(zipCode),
        // A failed provider call (bad key, outage) is not the same as a ZIP that does not exist.
        { throwOnProviderError: true },
      )
      return external ?? reference?.result ?? null
    } catch (error) {
      if (reference) return reference.result
      throw error
    }
  }

  async geocodeCity(city: string, state: string): Promise<GeocodingResult | null> {
    const queryValue = `${city}, ${state}`
    return this.geocodeWithCache(
      { queryType: 'city', queryValue },
      `city=${queryValue}`,
      (provider) => provider.geocodeCityState(city, state),
    )
  }

  async geocodeAddress(address: string): Promise<GeocodingResult | null> {
    const short = address.length > 48 ? `${address.slice(0, 48)}…` : address
    return this.geocodeWithCache(
      { queryType: 'address', queryValue: address },
      `address="${short}"`,
      (provider) => provider.geocodeAddress(address),
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

export { cleanPostalCode, countryIso2, POSITIONSTACK_BASE_URL } from '../adapters/geocoding.adapter.js'
export { MapsCoGeocodingAdapter } from '../adapters/mapsco-geocoding.adapter.js'

export function createEnhancedGeocodingService(
  prisma: ExtendedPrismaClient,
  config: GeocodingConfig,
): EnhancedGeocodingService {
  return new EnhancedGeocodingService(prisma, config)
}
