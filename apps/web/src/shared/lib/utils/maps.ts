import { locationValidator } from '@shared/lib/utils/validation/unified'

export interface LatLng { latitude: number; longitude: number }

function isBrowser() {
  return typeof window !== 'undefined' && typeof navigator !== 'undefined'
}

/** Stable precision for URLs and Leaflet (reduces jitter / duplicate renders). */
const COORD_DECIMALS = 6

function normalizeLatLng(latitude: number, longitude: number): LatLng {
  return {
    latitude: Number(latitude.toFixed(COORD_DECIMALS)),
    longitude: Number(longitude.toFixed(COORD_DECIMALS)),
  }
}

export function coerceValidLatLng(input: unknown): LatLng | undefined {
  if (!input || typeof input !== 'object') return undefined
  const maybe = input as { latitude?: unknown; longitude?: unknown }
  const lat = typeof maybe.latitude === 'number' ? maybe.latitude : Number(maybe.latitude)
  const lng = typeof maybe.longitude === 'number' ? maybe.longitude : Number(maybe.longitude)
  const result = locationValidator.validateCoordinates(lat, lng)
  return result.valid
    ? normalizeLatLng(result.data!.latitude, result.data!.longitude)
    : undefined
}

export function coerceValidLatLngFromGeo(input: unknown): LatLng | undefined {
  if (!input || typeof input !== 'object') return undefined
  const maybe = input as { latitude?: unknown; longitude?: unknown; lat?: unknown; lng?: unknown }
  const latitude = maybe.latitude ?? maybe.lat
  const longitude = maybe.longitude ?? maybe.lng
  return coerceValidLatLng({ latitude, longitude })
}

function detectPlatform() {
  if (!isBrowser()) return 'web'
  const ua = navigator.userAgent || ''
  const isIOS = /iPad|iPhone|iPod/.test(ua)
  const isAndroid = ua.includes('Android')
  if (isIOS) return 'ios'
  if (isAndroid) return 'android'
  return 'web'
}

/**
 * Returns a URL that should open the native maps app on iOS/Android, and works on desktop web too.
 */
export function buildNavigateUrl(params: {
  origin?: LatLng
  destination: LatLng
  destinationLabel?: string
}) {
  const platform = detectPlatform()
  const o = params.origin
  const d = params.destination
  const dLabel = params.destinationLabel

  const origin = o ? `${o.latitude},${o.longitude}` : undefined
  const destination = `${d.latitude},${d.longitude}`

  if (platform === 'ios') {
    // Apple Maps deep link
    const base = new URL('https://maps.apple.com/')
    if (origin) base.searchParams.set('saddr', origin)
    base.searchParams.set('daddr', destination)
    if (dLabel) base.searchParams.set('q', dLabel)
    return base.toString()
  }

  // Android + Web: Google Maps URL works well and hands off to the app when installed
  const url = new URL('https://www.google.com/maps/dir/')
  url.searchParams.set('api', '1')
  if (origin) url.searchParams.set('origin', origin)
  url.searchParams.set('destination', destination)
  url.searchParams.set('travelmode', 'driving')
  return url.toString()
}

export function openNavigate(params: {
  origin?: LatLng
  destination: LatLng
  destinationLabel?: string
}) {
  const url = buildNavigateUrl(params)
  if (!isBrowser()) return url

  // Prefer same-tab — reliable on mobile for handing off to Maps.
  window.location.assign(url)
  return url
}

/** Same destination URL in a new tab (fallback when same-tab navigation is blocked). */
export function openNavigateNewTab(params: {
  origin?: LatLng
  destination: LatLng
  destinationLabel?: string
}) {
  const url = buildNavigateUrl(params)
  if (!isBrowser()) return url
  window.open(url, '_blank', 'noopener,noreferrer')
  return url
}

const EARTH_RADIUS_MI = 3958.8

/** Great-circle distance in statute miles. */
export function haversineMiles(a: LatLng, b: LatLng): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.latitude - a.latitude)
  const dLon = toRad(b.longitude - a.longitude)
  const lat1 = toRad(a.latitude)
  const lat2 = toRad(b.latitude)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
  return EARTH_RADIUS_MI * c
}

export function formatMilesDistance(miles: number): string {
  if (!Number.isFinite(miles) || miles < 0) return ''
  if (miles < 10) return `${miles.toFixed(1)} mi away`
  return `${Math.round(miles)} mi away`
}
