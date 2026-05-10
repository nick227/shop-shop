/**
 * Geocoding Cache Service
 * Caches geocoder responses (Mapbox / manual / fallback). Legacy DB rows may still record source `positionstack`.
 */
import type { ExtendedPrismaClient } from '../client.js';
export interface GeocodingCacheEntry {
    id: string;
    queryType: 'zip' | 'city' | 'address';
    queryValue: string;
    latitude: number;
    longitude: number;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    formattedAddress?: string;
    confidence: 'high' | 'medium' | 'low';
    source: 'mapbox' | 'positionstack' | 'manual' | 'fallback';
    createdAt: Date;
    updatedAt: Date;
    expiresAt?: Date;
}
export interface GeocodingQuery {
    queryType: 'zip' | 'city' | 'address';
    queryValue: string;
}
export interface GeocodingResult {
    latitude: number;
    longitude: number;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    formattedAddress?: string;
    confidence: 'high' | 'medium' | 'low';
    source: 'mapbox' | 'positionstack' | 'manual' | 'fallback';
}
export declare class GeocodingCacheService {
    private prisma;
    constructor(prisma: ExtendedPrismaClient);
    /**
     * Get cached geocoding result
     */
    getCachedResult(query: GeocodingQuery): Promise<GeocodingResult | null>;
    /**
     * Store geocoding result in cache
     */
    cacheResult(query: GeocodingQuery, result: GeocodingResult, ttlHours?: number): Promise<void>;
    /**
     * Clear expired cache entries
     */
    clearExpiredEntries(): Promise<number>;
    /**
     * Get cache statistics
     */
    getCacheStats(): Promise<{
        totalEntries: number;
        expiredEntries: number;
        entriesByType: Record<string, number>;
        entriesBySource: Record<string, number>;
    }>;
    /**
     * Pre-populate cache with common ZIP codes
     */
    populateCommonZips(): Promise<void>;
}
//# sourceMappingURL=geocoding-cache.service.d.ts.map