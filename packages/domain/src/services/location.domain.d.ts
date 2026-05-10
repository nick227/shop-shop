/**
 * Location Domain Service
 * Handles distance calculations and geographic operations
 */
export interface Coordinates {
    latitude: number;
    longitude: number;
}
export interface LocationWithDistance extends Coordinates {
    distance: number;
}
export declare class LocationDomain {
    /**
     * Calculate distance between two points using Haversine formula
     * Returns distance in miles
     */
    calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number;
    /**
     * Convert degrees to radians
     */
    private toRad;
    /**
     * Check if coordinates are valid
     */
    isValidCoordinates(lat: number | null | undefined, lng: number | null | undefined): boolean;
    /**
     * Filter items by distance radius
     */
    filterByRadius<T extends {
        latitude?: number | null;
        longitude?: number | null;
    }>(items: T[], centerLat: number, centerLng: number, radiusMiles: number): Array<T & {
        distance: number;
    }>;
    /**
     * Get bounding box for a given center point and radius
     * Useful for database pre-filtering before calculating exact distances
     */
    getBoundingBox(centerLat: number, centerLng: number, radiusMiles: number): {
        minLat: number;
        maxLat: number;
        minLng: number;
        maxLng: number;
    };
    /**
     * Convert miles to kilometers
     */
    milesToKilometers(miles: number): number;
    /**
     * Convert kilometers to miles
     */
    kilometersToMiles(km: number): number;
}
export declare const locationDomain: LocationDomain;
//# sourceMappingURL=location.domain.d.ts.map