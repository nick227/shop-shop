/**
 * Enhanced Geocoding Service
 * Integrates caching with the configured geocoder adapter (Mapbox-backed in production).
 */
import { GeocodingCacheService } from './geocoding-cache.service.js';
import { createGeocodingAdapter, } from '../adapters/geocoding.adapter.js';
function apiToGeocodingResult(api) {
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
    };
}
export class EnhancedGeocodingService {
    prisma;
    config;
    cacheService;
    apiAdapter;
    constructor(prisma, config) {
        this.prisma = prisma;
        this.config = config;
        this.cacheService = new GeocodingCacheService(prisma);
        this.apiAdapter = createGeocodingAdapter({
            apiKey: config.apiKey,
            baseUrl: config.baseUrl,
        });
    }
    cacheTtlHours() {
        return this.config.cacheTTLHours ?? 24 * 30;
    }
    cachingEnabled() {
        return this.config.enableCache !== false;
    }
    /**
     * Shared path: cache lookup → API → cache write. Single iteration over the flow.
     */
    async geocodeWithCache(query, label, fetchApi) {
        if (this.cachingEnabled()) {
            const cached = await this.cacheService.getCachedResult(query);
            if (cached) {
                console.log(`[Geocoding] cache hit ${label} (source: ${cached.source})`);
                return cached;
            }
        }
        console.log(`[Geocoding] cache miss ${label}`);
        try {
            const apiResult = await fetchApi();
            if (!apiResult) {
                console.warn(`[Geocoding] API returned null ${label}`);
                return null;
            }
            const result = apiToGeocodingResult(apiResult);
            if (this.cachingEnabled()) {
                await this.cacheService.cacheResult(query, result, this.cacheTtlHours());
            }
            return result;
        }
        catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            console.error(`[Geocoding] error ${label}:`, msg);
            const withResponse = error;
            if (withResponse.response?.data !== undefined) {
                console.error('[Geocoding] API response body:', withResponse.response.data);
            }
            return null;
        }
    }
    async geocodeZip(zipCode) {
        return this.geocodeWithCache({ queryType: 'zip', queryValue: zipCode }, `zip=${zipCode}`, () => this.apiAdapter.geocodeZipCode(zipCode));
    }
    async geocodeCity(city, state) {
        const queryValue = `${city}, ${state}`;
        return this.geocodeWithCache({ queryType: 'city', queryValue }, `city=${queryValue}`, () => this.apiAdapter.geocodeCityState(city, state));
    }
    async geocodeAddress(address) {
        const short = address.length > 48 ? `${address.slice(0, 48)}…` : address;
        return this.geocodeWithCache({ queryType: 'address', queryValue: address }, `address="${short}"`, () => this.apiAdapter.geocodeAddress(address));
    }
    async getCacheStats() {
        return this.cacheService.getCacheStats();
    }
    async clearExpiredCache() {
        return this.cacheService.clearExpiredEntries();
    }
    async populateCommonZips() {
        return this.cacheService.populateCommonZips();
    }
}
export function createEnhancedGeocodingService(prisma, config) {
    return new EnhancedGeocodingService(prisma, config);
}
