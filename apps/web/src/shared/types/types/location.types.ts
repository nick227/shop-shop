/**
 * Shared Location Types;
 * Centralized type definitions for location functionality;
 */

export interface LocationData {
  latitude: number;
  longitude: number;
  radiusMiles: number;
  source: 'geolocation' | 'zip' | 'manual' | 'search' | 'city' | 'address'
  displayName?: string;
  city?: string;
  state?: string;
  zip?: string;
  accuracy?: number // For geolocation accuracy;
  timestamp?: number // When location was obtained;
}

export interface LocationPreferences {
  defaultLocation?: LocationData;
  preferredRadius: number;
  allowGeolocation: boolean;
  locationHistory: LocationData[]
  lastUsedMethod: 'geolocation' | 'zip' | 'city' | 'address'
}

export interface LocationInput {
  type: 'geolocation' | 'zip' | 'city' | 'address'
  value: string;
  state?: string // For city input;
}
