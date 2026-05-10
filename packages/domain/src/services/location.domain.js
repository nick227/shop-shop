/**
 * Location Domain Service
 * Handles distance calculations and geographic operations
 */
export class LocationDomain {
    /**
     * Calculate distance between two points using Haversine formula
     * Returns distance in miles
     */
    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 3959; // Earth's radius in miles
        const dLat = this.toRad(lat2 - lat1);
        const dLng = this.toRad(lng2 - lng1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(lat1)) *
                Math.cos(this.toRad(lat2)) *
                Math.sin(dLng / 2) *
                Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        return Math.round(distance * 10) / 10; // Round to 1 decimal place
    }
    /**
     * Convert degrees to radians
     */
    toRad(degrees) {
        return degrees * (Math.PI / 180);
    }
    /**
     * Check if coordinates are valid
     */
    isValidCoordinates(lat, lng) {
        if (lat === null || lat === undefined || lng === null || lng === undefined) {
            return false;
        }
        return (lat >= -90 && lat <= 90 &&
            lng >= -180 && lng <= 180);
    }
    /**
     * Filter items by distance radius
     */
    filterByRadius(items, centerLat, centerLng, radiusMiles) {
        const out = [];
        for (const item of items) {
            if (!this.isValidCoordinates(item.latitude, item.longitude))
                continue;
            const distance = this.calculateDistance(centerLat, centerLng, Number(item.latitude), Number(item.longitude));
            if (distance > radiusMiles)
                continue;
            out.push({ ...item, distance });
        }
        out.sort((a, b) => a.distance - b.distance);
        return out;
    }
    /**
     * Get bounding box for a given center point and radius
     * Useful for database pre-filtering before calculating exact distances
     */
    getBoundingBox(centerLat, centerLng, radiusMiles) {
        // Approximate: 1 degree latitude ≈ 69 miles
        // Longitude varies by latitude, so this is a rough approximation
        const latDelta = radiusMiles / 69;
        const lngDelta = radiusMiles / (69 * Math.cos(this.toRad(centerLat)));
        return {
            minLat: centerLat - latDelta,
            maxLat: centerLat + latDelta,
            minLng: centerLng - lngDelta,
            maxLng: centerLng + lngDelta,
        };
    }
    /**
     * Convert miles to kilometers
     */
    milesToKilometers(miles) {
        return miles * 1.60934;
    }
    /**
     * Convert kilometers to miles
     */
    kilometersToMiles(km) {
        return km * 0.621371;
    }
}
// Singleton instance
export const locationDomain = new LocationDomain();
