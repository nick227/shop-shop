/**
 * Address lookup behind one interface: suggestions while typing, and a map position with an honest
 * precision for delivery.
 *
 * - `mapbox` (MAPBOX_ACCESS_TOKEN): autocomplete and rooftop/street-level positions.
 * - `positionstack` (GEOCODING_API_KEY): positions only, no autocomplete.
 * - `postal`: no service configured; only the ZIP code's center, which is never precise.
 *
 * ADDRESS_PROVIDER=mapbox|positionstack|postal picks one explicitly; otherwise the best configured.
 */
import { cleanPostalCode, countryIso2, createEnhancedGeocodingService, lookupPostalCode, MapsCoGeocodingAdapter, POSITIONSTACK_BASE_URL, prisma } from '@packages/db'

export type LocationPrecision = 'address' | 'street' | 'postal'

export interface AddressSuggestion {
  readonly id: string
  readonly label: string
  readonly line1: string
  readonly city: string
  readonly state: string
  readonly postalCode: string
}

export interface LocatedAddress {
  readonly lat: number
  readonly lng: number
  readonly precision: LocationPrecision
}

export interface AddressQuery {
  readonly line1: string
  readonly city: string
  readonly state: string
  readonly postalCode: string
}

export interface AddressProvider {
  readonly name: 'mapbox' | 'positionstack' | 'postal'
  readonly suggests: boolean
  suggest(query: string, near?: { lat: number; lng: number }): Promise<AddressSuggestion[]>
  reverse?(lat: number, lng: number): Promise<(Partial<AddressQuery> & { country?: string }) | null>
  locate(address: AddressQuery): Promise<LocatedAddress | null>
}

const configured = (value: string | undefined) => Boolean(value && !/^your[_-]/i.test(value))

/** Last resort for everyone: the ZIP code's center. */
async function postalCenter(address: AddressQuery): Promise<LocatedAddress | null> {
  const zip = await lookupPostalCode(prisma, address.postalCode.slice(0, 5)).catch(() => null)
  return zip ? { lat: zip.latitude, lng: zip.longitude, precision: 'postal' } : null
}

export function postalProvider(): AddressProvider {
  return { name: 'postal', suggests: false, suggest: async () => [], locate: postalCenter }
}

type FetchLike = (url: string, init?: { signal?: AbortSignal }) => Promise<{ ok: boolean; json: () => Promise<unknown> }>

/** A lookup slower than this is treated as failed; checkout shouldn't hang on a geocoder. */
const LOOKUP_TIMEOUT_MS = 4000

interface MapboxFeature {
  readonly id?: string
  readonly geometry?: { readonly coordinates?: readonly [number, number] }
  readonly properties?: {
    readonly mapbox_id?: string
    readonly feature_type?: string
    readonly full_address?: string
    readonly name?: string
    readonly coordinates?: { readonly latitude?: number; readonly longitude?: number; readonly accuracy?: string }
    readonly match_code?: { readonly confidence?: string; readonly address_number?: string; readonly street?: string; readonly postcode?: string }
    readonly context?: {
      readonly address?: { readonly name?: string }
      readonly postcode?: { readonly name?: string }
      readonly place?: { readonly name?: string }
      readonly country?: { readonly country_code?: string }
      readonly region?: { readonly region_code?: string }
    }
  }
}

const PRECISE_ACCURACY = new Set(['rooftop', 'parcel', 'point', 'interpolated'])

/** Mapbox's API, or (outside production only) a local stand-in for browser tests. */
function mapboxBase(env: NodeJS.ProcessEnv = process.env): string {
  const override = env.NODE_ENV === 'production' ? undefined : env.MAPBOX_API_BASE
  return `${override ?? 'https://api.mapbox.com'}/search/geocode/v6/forward`
}

export function mapboxProvider(token: string, fetcher: FetchLike = fetch as unknown as FetchLike): AddressProvider {
  const base = mapboxBase()
  const request = async (params: Record<string, string>): Promise<MapboxFeature[]> => {
    const qs = new URLSearchParams({ access_token: token, country: 'us', types: 'address', ...params })
    const response = await fetcher(`${base}?${qs.toString()}`, { signal: AbortSignal.timeout(LOOKUP_TIMEOUT_MS) })
    if (!response.ok) return []
    const body = (await response.json()) as { features?: MapboxFeature[] }
    return body.features ?? []
  }
  const toSuggestion = (feature: MapboxFeature): AddressSuggestion | null => {
    const p = feature.properties
    const line1 = p?.context?.address?.name ?? p?.name
    const city = p?.context?.place?.name
    const state = p?.context?.region?.region_code
    const postalCode = p?.context?.postcode?.name
    if (!line1 || !city || !state || !postalCode) return null
    return { id: p?.mapbox_id ?? feature.id ?? `${line1}-${postalCode}`, label: p?.full_address ?? `${line1}, ${city}, ${state} ${postalCode}`, line1, city, state, postalCode }
  }
  return {
    name: 'mapbox',
    suggests: true,
    async reverse(lat, lng) {
      const qs = new URLSearchParams({ access_token: token, latitude: String(lat), longitude: String(lng), permanent: 'true', types: 'address', limit: '1' })
      const response = await fetcher(`${base.replace(/forward$/, 'reverse')}?${qs}`, { signal: AbortSignal.timeout(LOOKUP_TIMEOUT_MS) })
      if (!response.ok) throw new Error('Address lookup failed')
      const body = await response.json() as { features?: MapboxFeature[] }
      const p = body.features?.[0]?.properties
      if (!p) return null
      return { line1: p.context?.address?.name ?? p.name, city: p.context?.place?.name, state: p.context?.region?.region_code, postalCode: p.context?.postcode?.name, country: p.context?.country?.country_code?.toUpperCase() }
    },
    async suggest(query, near) {
      if (query.trim().length < 3) return []
      const features = await request({
        q: query.trim(),
        autocomplete: 'true',
        limit: '5',
        ...(near ? { proximity: `${near.lng},${near.lat}` } : {}),
      }).catch(() => [])
      return features.flatMap((feature) => {
        const suggestion = toSuggestion(feature)
        return suggestion ? [suggestion] : []
      })
    },
    async locate(address) {
      const features = await request({ ...structuredQuery(address), autocomplete: 'false', limit: '3' }).catch(() => null)
      // The service failed or timed out: only the ZIP center is known, and that is never precise.
      if (features === null) return postalCenter(address)
      const top = features[0]
      const position = featurePosition(top)
      if (!top || !position) return postalCenter(address)
      // A match in a different ZIP is not the address the shopper typed.
      if (top.properties?.context?.postcode?.name && top.properties.context.postcode.name !== address.postalCode.slice(0, 5)) {
        return postalCenter(address)
      }
      return { ...position, precision: isPrecise(top) && !isAmbiguous(top, features.slice(1)) ? 'address' : 'street' }
    },
  }
}

/** Mapbox's structured search when the street line starts with a house number; free text otherwise. */
function structuredQuery(address: AddressQuery): Record<string, string> {
  const parts = /^\s*(\d+[A-Za-z]?(?:-\d+)?)\s+(.+)$/.exec(address.line1)
  if (!parts) return { q: `${address.line1}, ${address.city}, ${address.state} ${address.postalCode}` }
  return { address_number: parts[1], street: parts[2], place: address.city, region: address.state, postcode: address.postalCode.slice(0, 5) }
}

function featurePosition(feature: MapboxFeature | undefined): { lat: number; lng: number } | null {
  const lng = feature?.properties?.coordinates?.longitude ?? feature?.geometry?.coordinates?.[0]
  const lat = feature?.properties?.coordinates?.latitude ?? feature?.geometry?.coordinates?.[1]
  return lat === undefined || lng === undefined ? null : { lat, lng }
}

/** A house-level point that Mapbox itself is confident is the address asked for. */
function isPrecise(feature: MapboxFeature): boolean {
  const p = feature.properties
  if (p?.feature_type !== 'address' || !PRECISE_ACCURACY.has(p.coordinates?.accuracy ?? '')) return false
  const match = p.match_code
  // Without a match code (older responses) the accuracy alone decides; with one, it must be strong.
  if (!match) return true
  return (match.confidence === 'exact' || match.confidence === 'high') && match.address_number !== 'unmatched' && match.street !== 'unmatched'
}

/** Another equally strong match far from the first (same number on two similar streets): we can't tell which. */
function isAmbiguous(top: MapboxFeature, others: readonly MapboxFeature[]): boolean {
  const first = featurePosition(top)
  if (!first) return true
  return others.some((other) => {
    const at = featurePosition(other)
    if (!at || !isPrecise(other) || other.properties?.match_code?.confidence !== top.properties?.match_code?.confidence) return false
    const metres = Math.hypot((at.lat - first.lat) * 111_000, (at.lng - first.lng) * 111_000 * Math.cos((first.lat * Math.PI) / 180))
    return metres > 150
  })
}

export function positionstackProvider(apiKey: string, baseUrl: string = POSITIONSTACK_BASE_URL, fallbackApiKey?: string): AddressProvider {
  const service = createEnhancedGeocodingService(prisma, { apiKey, baseUrl, fallbackApiKey, enableCache: true, cacheTTLHours: 24 * 30 })
  const fallback = fallbackApiKey ? new MapsCoGeocodingAdapter(fallbackApiKey) : undefined
  return {
    name: 'positionstack',
    suggests: false,
    async reverse(lat, lng) {
      const primary = async () => {
        const qs = new URLSearchParams({ access_key: apiKey, query: `${lat},${lng}`, limit: '1' })
        const response = await fetch(`${baseUrl.replace(/\/$/, '')}/reverse?${qs}`, { signal: AbortSignal.timeout(LOOKUP_TIMEOUT_MS) })
        if (!response.ok) throw new Error('Address lookup failed')
        const body = await response.json() as { data?: { number?: string; street?: string; locality?: string; region_code?: string; postal_code?: string; country_code?: string }[] }
        const hit = body.data?.[0]
        return hit ? { line1: hit.street ? [hit.number, hit.street].filter(Boolean).join(' ') : undefined, city: hit.locality, state: hit.region_code, postalCode: cleanPostalCode(hit.postal_code), country: countryIso2(hit.country_code) } : null
      }
      if (!fallback) return primary()
      // Positionstack failing or finding nothing is not the last word when maps.co can answer.
      const first = await primary().catch(() => undefined)
      if (first) return first
      try {
        return (await fallback.reverse(lat, lng)) ?? first ?? null
      } catch {
        if (first === null) return null
        throw new Error('Address lookup failed')
      }
    },
    suggest: async () => [],
    async locate(address) {
      const hit = await service
        .geocodeAddress(`${address.line1}, ${address.city}, ${address.state} ${address.postalCode}`)
        .catch(() => null)
      if (!hit) return postalCenter(address)
      return { lat: hit.latitude, lng: hit.longitude, precision: hit.confidence === 'high' ? 'address' : 'street' }
    },
  }
}

let cached: AddressProvider | null = null

/** Tests swap in a provider (or null to go back to the configured one). */
export function setAddressProviderForTesting(provider: AddressProvider | null) {
  cached = provider
}

export function addressProvider(env: NodeJS.ProcessEnv = process.env): AddressProvider {
  if (cached && env === process.env) return cached
  const chosen = env.ADDRESS_PROVIDER?.toLowerCase()
  let provider: AddressProvider
  if ((chosen === 'mapbox' || !chosen) && configured(env.MAPBOX_ACCESS_TOKEN)) provider = mapboxProvider(env.MAPBOX_ACCESS_TOKEN!)
  else if ((chosen === 'positionstack' || !chosen) && configured(env.GEOCODING_API_KEY)) provider = positionstackProvider(env.GEOCODING_API_KEY!, env.GEOCODING_API_URL || POSITIONSTACK_BASE_URL, configured(env.GEOCODE_API_KEY) ? env.GEOCODE_API_KEY : undefined)
  else provider = postalProvider()
  if (env === process.env) cached = provider
  return provider
}

/**
 * Whether delivery may be decided from an imprecise position (ZIP center). Off in production unless
 * ALLOW_APPROXIMATE_DELIVERY=true; on elsewhere so development works without a geocoding account.
 */
export function approximateDeliveryAllowed(env: NodeJS.ProcessEnv = process.env): boolean {
  if (env.ALLOW_APPROXIMATE_DELIVERY !== undefined) return env.ALLOW_APPROXIMATE_DELIVERY === 'true'
  return env.NODE_ENV !== 'production'
}
