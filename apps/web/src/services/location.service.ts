/**
 * Unified Location Service
 * Consolidates all location functionality with localStorage persistence
 */

import type { LocationData, LocationPreferences, LocationInput } from '../types/location.types'

const STORAGE_KEYS = {
  PREFERENCES: 'location_preferences',
  CURRENT_LOCATION: 'current_location',
  LOCATION_HISTORY: 'location_history'
} as const

const MAX_HISTORY_SIZE = 5
const DEFAULT_RADIUS = 25

// OPTIMIZED: Object pool for reducing GC pressure
// class ObjectPool<T> {
//   private readonly pool: T[] = []
//   private readonly createFn: () => T
//   
//   constructor(createFn: () => T, initialSize = 10) {
//     this.createFn = createFn
//     // Pre-allocate objects
//     for (let i = 0; i < initialSize; i++) {
//       this.pool.push(createFn())
//     }
//   }
//   
//   acquire(): T {
//     return this.pool.pop() ?? this.createFn()
//   }
//   
//   release(obj: T): void {
//     if (this.pool.length < 20) { // Limit pool size
//       this.pool.push(obj)
//     }
//   }
// }

export class LocationService {
  private static instance: LocationService
  private preferences: LocationPreferences
  
  // OPTIMIZED: Cache parsed data to avoid repeated JSON operations
  private _cachedCurrentLocation: LocationData | undefined = undefined
  private _cachedHistory: LocationData[] | undefined = undefined
  private readonly _cachedPreferences: LocationPreferences | undefined = undefined

  private constructor() {
    this.preferences = this.loadPreferences()
  }

  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService()
    }
    return LocationService.instance
  }

  // OPTIMIZED: Factory method to eliminate object creation duplication
  private createLocationData(
    latitude: number,
    longitude: number,
    source: LocationData["source"],
    displayName: string,
    additionalData: Partial<LocationData> = {}
  ): LocationData {
    return {
      latitude,
      longitude,
      radiusMiles: this.preferences.preferredRadius,
      source,
      displayName,
      timestamp: Date.now(),
      ...additionalData
    }
  }

  /**
   * OPTIMIZED: Get current location from browser geolocation
   */
  async getLocationFromGeolocation(): Promise<LocationData> {
    if (!navigator.geolocation) {
      throw new Error('Geolocation is not supported by your browser')
    }

    return new Promise((resolve, reject) => {
      // eslint-disable-next-line sonarjs/no-intrusive-permissions
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = this.createLocationData(
            position.coords.latitude,
            position.coords.longitude,
            'geolocation',
            'Your Location',
            { accuracy: position.coords.accuracy }
          )
          
          this.saveCurrentLocation(location)
          this.addToHistory(location)
          resolve(location)
        },
        (error) => {
          let errorMessage: string
          switch (error.code) {
            case error.PERMISSION_DENIED: {
              errorMessage = 'Location permission denied. Please enable location access in your browser settings.'
              break
            }
            case error.POSITION_UNAVAILABLE: {
              errorMessage = 'Location information is unavailable. Please try again.'
              break
            }
            case error.TIMEOUT: {
              errorMessage = 'Location request timed out. Please try again.'
              break
            }
            default: {
              errorMessage = 'Unable to get your location: ' + error.message
            }
          }
          reject(new Error(errorMessage))
        },
        {
          enableHighAccuracy: true,
          timeout: 10_000,
          maximumAge: 300_000 // 5 minutes
        }
      )
    })
  }

  /**
   * Get location from ZIP code
   */
  async getLocationFromZip(zipCode: string): Promise<LocationData> {
    // Import geocoding service dynamically to avoid circular dependencies
    const { geocodeZip } = await import('./geocoding')
    
    // Use geocoding service with comprehensive USA ZIP code coverage (41,482 codes)
    const result = await geocodeZip(zipCode)
    if (!result) {
      throw new Error('ZIP code ' + zipCode + ' not found. Please enter a valid US ZIP code.')
    }

    // Validate US coordinates
    if (!this.isUSCoordinates(result.latitude, result.longitude)) {
      throw new Error('ZIP code ' + zipCode + ' appears to be outside the US. Please enter a valid US ZIP code.')
    }

    const location = this.createLocationData(
      result.latitude,
      result.longitude,
      'zip',
      result.displayName,
      {
        city: result.city,
        state: result.state,
        zip: result.zip
      }
    )

    this.saveCurrentLocation(location)
    this.addToHistory(location)
    return location
  }

  /**
   * Get location from city/state
   */
  async getLocationFromCity(city: string, state: string): Promise<LocationData> {
    const { geocodeCity } = await import('./geocoding')
    
    // Use geocoding service with comprehensive USA coverage
    const result = await geocodeCity(city, state)
    if (!result) {
      throw new Error('City "' + city + ', ' + state + '" not found. Please enter a valid US city.')
    }

    // Validate US coordinates
    if (!this.isUSCoordinates(result.latitude, result.longitude)) {
      throw new Error('City "' + city + ', ' + state + '" not found in US. Please enter a valid US city.')
    }

    const location: LocationData = {
      latitude: result.latitude,
      longitude: result.longitude,
      radiusMiles: this.preferences.preferredRadius,
      source: 'city',
      displayName: result.displayName,
      city: result.city,
      state: result.state,
      timestamp: Date.now()
    }

    this.saveCurrentLocation(location)
    this.addToHistory(location)
    return location
  }

  /**
   * Get location from full address
   */
  async getLocationFromAddress(address: string): Promise<LocationData> {
    const { geocodeAddress } = await import('./geocoding')
    
    const result = await geocodeAddress(address)
    if (!result) {
      throw new Error('Address "' + address + '" not found. Please enter a valid US address.')
    }

    const location: LocationData = {
      latitude: result.latitude,
      longitude: result.longitude,
      radiusMiles: this.preferences.preferredRadius,
      source: 'address',
      displayName: result.displayName,
      city: result.city,
      state: result.state,
      zip: result.zip,
      timestamp: Date.now()
    }

    this.saveCurrentLocation(location)
    this.addToHistory(location)
    return location
  }

  // OPTIMIZED: Strategy pattern to eliminate switch complexity
  private readonly locationStrategies = {
    geolocation: () => this.getLocationFromGeolocation(),
    zip: (value: string) => this.getLocationFromZip(value),
    city: (value: string, state?: string) => {
      if (!state) throw new Error('State is required for city lookup')
      return this.getLocationFromCity(value, state)
    },
    address: (value: string) => this.getLocationFromAddress(value)
  } as const

  /**
   * OPTIMIZED: Unified method using strategy pattern
   */
  async getLocation(input: LocationInput): Promise<LocationData> {
    const strategy = this.locationStrategies[input.type]
    if (!strategy) {
      throw new Error('Unknown location input type: ' + input.type)
    }
    
    // Single execution path - no branching complexity
    return strategy(input.value, input.state)
  }

  /**
   * Get current saved location (with caching)
   */
  getCurrentLocation(): LocationData | undefined {
    if (this._cachedCurrentLocation !== undefined) {
      return this._cachedCurrentLocation
    }
    
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_LOCATION)
      this._cachedCurrentLocation = stored ? JSON.parse(stored) : undefined
      return this._cachedCurrentLocation
    } catch {
      this._cachedCurrentLocation = undefined
      return undefined
    }
  }

  /**
   * Save current location (with cache invalidation)
   */
  private saveCurrentLocation(location: LocationData): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_LOCATION, JSON.stringify(location))
      this._cachedCurrentLocation = location // Update cache
    } catch (error: unknown) {
      console.warn('Failed to save current location:', error)
    }
  }

  /**
   * Get location history (with caching)
   */
  getLocationHistory(): LocationData[] {
    if (this._cachedHistory !== undefined) {
      return this._cachedHistory
    }
    
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.LOCATION_HISTORY)
      this._cachedHistory = stored ? JSON.parse(stored) : []
      return this._cachedHistory || []
    } catch {
      this._cachedHistory = []
      return []
    }
  }

  /**
   * Add location to history
   */
  private addToHistory(location: LocationData): void {
    const history = this.getLocationHistory()
    
    // MEMORY OPTIMIZED: In-place deduplication and insertion
    // Find and remove duplicate in single pass
    let writeIndex = 0
    for (let readIndex = 0; readIndex < history.length; readIndex++) {
      const existing = history[readIndex]
      if (!existing) continue
      // Keep if different location
      if (existing.latitude !== location.latitude || existing.longitude !== location.longitude) {
        if (writeIndex !== readIndex) {
          history[writeIndex] = existing
        }
        writeIndex++
      }
    }
    
    // Truncate to size limit - 1 (to make room for new location)
    const maxExisting = Math.min(writeIndex, MAX_HISTORY_SIZE - 1)
    history.length = maxExisting
    
    // Insert new location at front
    history.unshift(location)
    
    try {
      localStorage.setItem(STORAGE_KEYS.LOCATION_HISTORY, JSON.stringify(history))
      this._cachedHistory = history // Update cache
    } catch (error: unknown) {
      console.warn('Failed to save location history:', error)
    }
  }

  /**
   * Get user preferences
   */
  getPreferences(): LocationPreferences {
    return { ...this.preferences }
  }

  /**
   * Update user preferences
   */
  updatePreferences(updates: Partial<LocationPreferences>): void {
    this.preferences = { ...this.preferences, ...updates }
    this.savePreferences()
  }

  /**
   * Set default location
   */
  setDefaultLocation(location: LocationData): void {
    this.preferences.defaultLocation = location
    this.savePreferences()
  }

  /**
   * Clear all location data
   */
  clearAllData(): void {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_LOCATION)
    localStorage.removeItem(STORAGE_KEYS.LOCATION_HISTORY)
    localStorage.removeItem(STORAGE_KEYS.PREFERENCES)
    this.preferences = this.getDefaultPreferences()
  }

  /**
   * Load preferences from localStorage
   */
  private loadPreferences(): LocationPreferences {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PREFERENCES)
      if (stored) {
        return { ...this.getDefaultPreferences(), ...JSON.parse(stored) }
      }
    } catch (error: unknown) {
      console.warn('Failed to load location preferences:', error)
    }
    return this.getDefaultPreferences()
  }

  /**
   * Save preferences to localStorage
   */
  private savePreferences(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(this.preferences))
    } catch (error: unknown) {
      console.warn('Failed to save location preferences:', error)
    }
  }

  /**
   * Get default preferences
   */
  private getDefaultPreferences(): LocationPreferences {
    return {
      preferredRadius: DEFAULT_RADIUS,
      allowGeolocation: true,
      locationHistory: [],
      lastUsedMethod: 'zip'
    }
  }

  /**
   * Validate US coordinates
   */
  private isUSCoordinates(lat: number, lon: number): boolean {
    return lat >= 24.5 && lat <= 49 && lon >= -125 && lon <= -66
  }

  /**
   * Update location radius
   */
  updateLocationRadius(radius: number): void {
    const current = this.getCurrentLocation()
    if (current) {
      const updated = { ...current, radiusMiles: radius }
      this.saveCurrentLocation(updated)
    }
    this.preferences.preferredRadius = radius
    this.savePreferences()
  }
}

// Export singleton instance
export const locationService = LocationService.getInstance()
