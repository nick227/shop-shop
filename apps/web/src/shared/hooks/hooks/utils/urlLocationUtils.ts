/**
 * URL Location Utilities
 * 
 * Extracted utility functions for URL location processing
 */

import { locationValidator } from '@shared/lib/utils/validation/unified'
import type { LocationData } from '@shared/types'

// Re-export LocationData for use in other modules


// ========================================
// Location Comparison Utilities
// ========================================

export function isSameLocation(a: LocationData | undefined, b: LocationData | undefined): boolean {
  if (!a || !b) return a === b
  return (
    a.latitude === b.latitude &&
    a.longitude === b.longitude &&
    a.radiusMiles === b.radiusMiles &&
    a.city === b.city &&
    a.state === b.state &&
    a.zip === b.zip &&
    a.source === b.source
  )
}

// ========================================
// Display Name Utilities
// ========================================

export function buildDisplayName(params: {
  city?: string
  state?: string
  zip?: string
}): string {
  const parts: string[] = []
  if (params.city) parts.push(params.city)
  if (params.state && locationValidator.validateState(params.state).valid) parts.push(params.state)
  if (params.zip && locationValidator.validateZipCode(params.zip).valid) parts.push(params.zip)
  return parts.length > 0 ? parts.join(', ') : 'Your Location'
}

// ========================================
// Coordinate Processing Utilities
// ========================================

export function processCoordinateParams(params: {
  latitude?: string
  longitude?: string
  radiusMiles?: string
  city?: string
  state?: string
  zip?: string
}): { valid: boolean; location?: LocationData; error?: string } {
  if (!params.latitude || !params.longitude) {
    return { valid: false, error: 'Coordinates required' }
  }
  
  const validation = locationValidator.validateCoordinates(
    params.latitude,
    params.longitude,
    params.radiusMiles
  )
  
  if (!validation.valid || !validation.data) {
    return { valid: false, error: validation.error }
  }
  
  // Validate and sanitize optional fields
  const cityResult = params.city ? locationValidator.sanitizeCityName(params.city) : { valid: false, data: undefined }
  const city = cityResult.valid ? cityResult.data : undefined
  const stateResult = params.state ? locationValidator.validateState(params.state) : { valid: false, data: undefined }
  const state = stateResult.valid ? stateResult.data : undefined
  const zipResult = params.zip ? locationValidator.validateZipCode(params.zip) : { valid: false, data: undefined }
  const zip = zipResult.valid ? zipResult.data : undefined
  
  const location: LocationData = {
    latitude: validation.data.latitude,
    longitude: validation.data.longitude,
    radiusMiles: validation.data.radius,
    displayName: buildDisplayName(params),
    source: 'search' as const,
    city,
    state,
    zip,
  }
  
  return { valid: true, location }
}

// ========================================
// City/State Processing Utilities
// ========================================

export function processCityStateParams(params: {
  city?: string
  state?: string
  radiusMiles?: string
}): { valid: boolean; location?: LocationData; error?: string } {
  if (!params.city || !params.state) {
    return { valid: false, error: 'City and state required' }
  }
  
  const cityResult = locationValidator.sanitizeCityName(params.city)
  const city = cityResult.valid ? cityResult.data : undefined
  const stateResult = locationValidator.validateState(params.state)
  const state = stateResult.valid ? stateResult.data : undefined
  
  if (!city || !state) {
    return { valid: false, error: 'Invalid city or state' }
  }
  
  const location: LocationData = {
    latitude: 0, // Will be geocoded
    longitude: 0, // Will be geocoded
    radiusMiles: params.radiusMiles ? Number.parseFloat(params.radiusMiles) : 25,
    displayName: buildDisplayName(params),
    source: 'search' as const,
    city,
    state,
    zip: undefined,
  }
  
  return { valid: true, location }
}

// ========================================
// ZIP Processing Utilities
// ========================================

export function processZipParams(params: {
  zip?: string
  radiusMiles?: string
}): { valid: boolean; location?: LocationData; error?: string } {
  if (!params.zip) {
    return { valid: false, error: 'ZIP code required' }
  }
  
  if (!locationValidator.validateZipCode(params.zip).valid) {
    return { valid: false, error: 'Invalid ZIP code' }
  }
  
  // For ZIP 94102 (San Francisco), use known coordinates
  // This is a temporary solution until full geocoding is implemented
  if (params.zip === '94102') {
    const radius = params.radiusMiles ? Number.parseFloat(params.radiusMiles) : 25
    
    const location: LocationData = {
      latitude: 37.7749,
      longitude: -122.4194,
      radiusMiles: radius,
      displayName: 'San Francisco, CA (' + params.zip + ')',
      source: 'search' as const,
      city: 'San Francisco',
      state: 'CA',
      zip: params.zip,
    }
    
    return { valid: true, location }
  }
  
  return { valid: false, error: 'ZIP code not supported yet' }
}

// ========================================
// URL Parameter Type Detection
// ========================================

export type UrlParamType = 'coordinates' | 'cityState' | 'zip' | 'none'

export function detectUrlParamType(params: {
  latitude?: string
  longitude?: string
  city?: string
  state?: string
  zip?: string
}): UrlParamType {
  if (params.latitude && params.longitude) {
    return 'coordinates'
  }
  if (params.city && params.state) {
    return 'cityState'
  }
  if (params.zip) {
    return 'zip'
  }
  return 'none'
}

// ========================================
// Main Processing Function
// ========================================

export function processUrlParams(params: {
  latitude?: string
  longitude?: string
  radiusMiles?: string
  city?: string
  state?: string
  zip?: string
}): { valid: boolean; location?: LocationData; error?: string } {
  const paramType = detectUrlParamType(params)
  
  switch (paramType) {
    case 'coordinates': {
      return processCoordinateParams(params)
    }
    case 'cityState': {
      return processCityStateParams(params)
    }
    case 'zip': {
      return processZipParams(params)
    }
    default: {
      return { valid: false, error: 'No valid location parameters found' }
    }
  }
}

export {type LocationData} from '@shared/types'