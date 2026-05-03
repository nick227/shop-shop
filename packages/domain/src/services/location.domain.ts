/**
 * Location Domain Service
 * Handles distance calculations and geographic operations
 */

export interface Coordinates {
  latitude: number
  longitude: number
}

export interface LocationWithDistance extends Coordinates {
  distance: number  // in miles
}

export class LocationDomain {
  /**
   * Calculate distance between two points using Haversine formula
   * Returns distance in miles
   */
  calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 3959 // Earth's radius in miles

    const dLat = this.toRad(lat2 - lat1)
    const dLng = this.toRad(lng2 - lng1)

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = R * c

    return Math.round(distance * 10) / 10 // Round to 1 decimal place
  }

  /**
   * Convert degrees to radians
   */
  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180)
  }

  /**
   * Check if coordinates are valid
   */
  isValidCoordinates(lat: number | null | undefined, lng: number | null | undefined): boolean {
    if (lat === null || lat === undefined || lng === null || lng === undefined) {
      return false
    }

    return (
      lat >= -90 && lat <= 90 &&
      lng >= -180 && lng <= 180
    )
  }

  /**
   * Filter items by distance radius
   */
  filterByRadius<T extends { latitude?: number | null; longitude?: number | null }>(
    items: T[],
    centerLat: number,
    centerLng: number,
    radiusMiles: number
  ): Array<T & { distance: number }> {
    const out: Array<T & { distance: number }> = []
    for (const item of items) {
      if (!this.isValidCoordinates(item.latitude, item.longitude)) continue
      const distance = this.calculateDistance(
        centerLat,
        centerLng,
        Number(item.latitude),
        Number(item.longitude),
      )
      if (distance > radiusMiles) continue
      out.push({ ...item, distance } as T & { distance: number })
    }
    out.sort((a, b) => a.distance - b.distance)
    return out
  }

  /**
   * Get bounding box for a given center point and radius
   * Useful for database pre-filtering before calculating exact distances
   */
  getBoundingBox(
    centerLat: number,
    centerLng: number,
    radiusMiles: number
  ): {
    minLat: number
    maxLat: number
    minLng: number
    maxLng: number
  } {
    // Approximate: 1 degree latitude ≈ 69 miles
    // Longitude varies by latitude, so this is a rough approximation
    const latDelta = radiusMiles / 69
    const lngDelta = radiusMiles / (69 * Math.cos(this.toRad(centerLat)))

    return {
      minLat: centerLat - latDelta,
      maxLat: centerLat + latDelta,
      minLng: centerLng - lngDelta,
      maxLng: centerLng + lngDelta,
    }
  }

  /**
   * Convert miles to kilometers
   */
  milesToKilometers(miles: number): number {
    return miles * 1.60934
  }

  /**
   * Convert kilometers to miles
   */
  kilometersToMiles(km: number): number {
    return km * 0.621371
  }
}

// Singleton instance
export const locationDomain = new LocationDomain()

