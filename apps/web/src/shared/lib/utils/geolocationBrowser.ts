/**
 * Browser geolocation helpers — shared copy of error semantics used in LocationService.
 */

export function getBrowserGeolocationBlockReason(): string | undefined {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return 'Location is not supported in this browser.'
  }
  if (typeof globalThis !== 'undefined' && globalThis.isSecureContext === false) {
    return 'Use HTTPS or http://127.0.0.1 / http://localhost so the browser can show the location prompt.'
  }
  return undefined
}

export function messageForGeolocationPositionError(error: GeolocationPositionError): string {
  switch (error.code) {
    case error.PERMISSION_DENIED: {
      return 'Location was blocked or denied. Allow location for this site in your browser settings (or use HTTPS / localhost).'
    }
    case error.POSITION_UNAVAILABLE: {
      return 'Your device could not determine a position. Turn on OS location services and try again.'
    }
    case error.TIMEOUT: {
      return 'Location request timed out. Try again, or browse without “near me”.'
    }
    default: {
      return error.message ? `Location error: ${error.message}` : 'Could not read your location.'
    }
  }
}
