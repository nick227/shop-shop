/**
 * LocationService - Core location functionality for MVP
 * Single source of truth for all location-related operations
 */

// ===== Location Types =====
export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  source: 'gps' | 'ip' | 'manual';
}

export interface LocationConfig {
  maxDistance: number;      // Default: 25 miles for store discovery
  deliveryRadius: number;  // Default: 15 miles for delivery eligibility
  avgSpeed: number;        // Default: 25 mph for travel time
}

export interface StoreData {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  deliveryFee?: number;
}

export interface StoreWithDistance extends StoreData {
  distance: number;
  travelTime: number;
  isDeliverable: boolean;
}

export interface DeliveryResult {
  isDeliverable: boolean;
  distance: number;
  travelTime: number;
  deliveryFee?: number;
}

// ===== Location Service =====
export class LocationService {
  private static instance: LocationService;
  private cachedLocation: LocationData | null = null;
  private cacheExpiry = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly config: LocationConfig;

  constructor(config: Partial<LocationConfig> = {}) {
    this.config = {
      maxDistance: 25,      // Default: 25 miles for store discovery
      deliveryRadius: 15,  // Default: 15 miles for delivery eligibility
      avgSpeed: 25,        // Default: 25 mph for travel time
      ...config
    };
  }

  static getInstance(config?: Partial<LocationConfig>): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService(config);
    }
    return LocationService.instance;
  }

  /**
   * Get user location with GPS + IP fallback
   */
  async getUserLocation(): Promise<LocationData> {
    // Check cache first
    if (this.cachedLocation && Date.now() < this.cacheExpiry) {
      return this.cachedLocation;
    }

    try {
      // Try GPS first
      const gpsLocation = await this.getGPSLocation();
      this.cacheLocation(gpsLocation);
      return gpsLocation;
    } catch (gpsError) {
      console.warn('GPS location failed, falling back to IP:', gpsError);
      
      try {
        // Fallback to IP location
        const ipLocation = await this.getIPLocation();
        this.cacheLocation(ipLocation);
        return ipLocation;
      } catch (ipError) {
        console.error('Both GPS and IP location failed:', ipError);
        throw new Error('Unable to determine location');
      }
    }
  }

  /**
   * Get GPS location with high precision
   */
  private async getGPSLocation(): Promise<LocationData> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            source: 'gps'
          });
        },
        (error) => {
          switch (error.code) {
            case error.PERMISSION_DENIED: {
              reject(new Error('Location permission denied'));
              break;
            }
            case error.POSITION_UNAVAILABLE: {
              reject(new Error('Location unavailable'));
              break;
            }
            case error.TIMEOUT: {
              reject(new Error('Location request timeout'));
              break;
            }
            default: {
              reject(new Error('Unknown location error'));
              break;
            }
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10_000,
          maximumAge: 0
        }
      );
    });
  }

  /**
   * Get IP-based location fallback
   */
  private async getIPLocation(): Promise<LocationData> {
    // Using a free IP geolocation service
    const response = await fetch('https://ipapi.co/json/');
    if (!response.ok) {
      throw new Error('IP location service unavailable');
    }
    
    const data = await response.json();
    
    if (!data.latitude || !data.longitude) {
      throw new Error('IP location data incomplete');
    }

    return {
      latitude: data.latitude,
      longitude: data.longitude,
      accuracy: 10_000, // IP location is less accurate (~10km)
      source: 'ip'
    };
  }

  /**
   * Cache location data
   */
  private cacheLocation(location: LocationData): void {
    this.cachedLocation = location;
    this.cacheExpiry = Date.now() + this.CACHE_DURATION;
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  getDistance(from: LocationData, to: { latitude: number; longitude: number }): number {
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRadians(to.latitude - from.latitude);
    const dLon = this.toRadians(to.longitude - from.longitude);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(from.latitude)) * Math.cos(this.toRadians(to.latitude)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Calculate travel time based on distance
   */
  getTravelTime(distance: number): number {
    return Math.round((distance / this.config.avgSpeed) * 60); // minutes
  }

  /**
   * Process stores with distance and travel time calculations
   * Pure function - takes stores array, returns processed stores
   */
  getNearbyStores(location: LocationData, stores: StoreData[]): StoreWithDistance[] {
    return stores
      .map(store => ({
        ...store,
        distance: this.getDistance(location, store),
        travelTime: 0,
        isDeliverable: false
      }))
      .map(store => ({
        ...store,
        travelTime: this.getTravelTime(store.distance),
        isDeliverable: this.isDeliverable(store, location)
      }))
      .filter(store => store.distance <= this.config.maxDistance) // Use config
      .sort((a, b) => a.distance - b.distance); // Sort by distance
  }

  /**
   * Check if store delivers to location
   */
  isDeliverable(store: StoreWithDistance, location: LocationData): boolean {
    // Simple distance-based check using config
    return store.distance <= this.config.deliveryRadius;
  }

  /**
   * Helper function to convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

// Export singleton instance with default config
export const locationService = LocationService.getInstance();
