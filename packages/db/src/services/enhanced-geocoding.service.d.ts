/**
 * Enhanced Geocoding Service
 * Integrates caching with the configured geocoder adapter (Mapbox-backed in production).
 */
import type { ExtendedPrismaClient } from '../client.js';
import { GeocodingResult } from './geocoding-cache.service.js';
export interface GeocodingConfig {
    apiKey: string;
    baseUrl?: string;
    enableCache?: boolean;
    cacheTTLHours?: number;
}
export declare class EnhancedGeocodingService {
    private readonly prisma;
    private readonly config;
    private readonly cacheService;
    private readonly apiAdapter;
    constructor(prisma: ExtendedPrismaClient, config: GeocodingConfig);
    private cacheTtlHours;
    private cachingEnabled;
    /**
     * Shared path: cache lookup → API → cache write. Single iteration over the flow.
     */
    private geocodeWithCache;
    geocodeZip(zipCode: string): Promise<GeocodingResult | null>;
    geocodeCity(city: string, state: string): Promise<GeocodingResult | null>;
    geocodeAddress(address: string): Promise<GeocodingResult | null>;
    getCacheStats(): Promise<{
        totalEntries: number;
        expiredEntries: number;
        entriesByType: Record<string, number>;
        entriesBySource: Record<string, number>;
    }>;
    clearExpiredCache(): Promise<number>;
    populateCommonZips(): Promise<void>;
}
export declare function createEnhancedGeocodingService(prisma: ExtendedPrismaClient, config: GeocodingConfig): EnhancedGeocodingService;
//# sourceMappingURL=enhanced-geocoding.service.d.ts.map