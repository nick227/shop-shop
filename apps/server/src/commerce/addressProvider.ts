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
import { createEnhancedGeocodingService, lookupPostalCode, prisma } from '@packages/db'

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

type FetchLike = (url: string) => Promise<{ ok: boolean; json: () => Promise<unknown> }>

interface MapboxFeature {
  readonly id?: string
  readonly geometry?: { readonly coordinates?: readonly [number, number] }
  readonly properties?: {
    readonly mapbox_id?: string
    readonly feature_type?: string
    readonly full_address?: string
    readonly name?: string
    readonly coordinates?: { readonly latitude?: number; readonly longitude?: number; readonly accuracy?: string }
    readonly context?: {
      readonly address?: { readonly name?: string }
      readonly postcode?: { readonly name?: string }
      readonly place?: { readonly name?: string }
      readonly region?: { readonly region_code?: string }
    }
  }
}

const PRECISE_ACCURACY = new Set(['rooftop', 'parcel', 'point', 'interpolated'])

export function mapboxProvider(token: string, fetcher: FetchLike = fetch as unknown as FetchLike): AddressProvider {
  const base = 'https://api.mapbox.com/search/geocode/v6/forward'
  const request = async (params: Record<string, string>): Promise<MapboxFeature[]> => {
    const qs = new URLSearchParams({ access_token: token, country: 'us', types: 'address', ...params })
    const response = await fetcher(`${base}?${qs.toString()}`)
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
      const features = await request({
        q: `${address.line1}, ${address.city}, ${address.state} ${address.postalCode}`,
        autocomplete: 'false',
        limit: '1',
      }).catch(() => [])
      const top = features[0]
      const lng = top?.properties?.coordinates?.longitude ?? top?.geometry?.coordinates?.[0]
      const lat = top?.properties?.coordinates?.latitude ?? top?.geometry?.coordinates?.[1]
      if (lat === undefined || lng === undefined) return postalCenter(address)
      // A match in a different ZIP is not the address the shopper typed.
      if (top?.properties?.context?.postcode?.name && top.properties.context.postcode.name !== address.postalCode.slice(0, 5)) {
        return postalCenter(address)
      }
      const accuracy = top?.properties?.coordinates?.accuracy ?? ''
      return { lat, lng, precision: top?.properties?.feature_type === 'address' && PRECISE_ACCURACY.has(accuracy) ? 'address' : 'street' }
    },
  }
}

export function positionstackProvider(apiKey: string): AddressProvider {
  const service = createEnhancedGeocodingService(prisma, { apiKey, enableCache: true, cacheTTLHours: 24 * 30 })
  return {
    name: 'positionstack',
    suggests: false,
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

export function addressProvider(env: NodeJS.ProcessEnv = process.env): AddressProvider {
  if (cached && env === process.env) return cached
  const chosen = env.ADDRESS_PROVIDER?.toLowerCase()
  let provider: AddressProvider
  if ((chosen === 'mapbox' || !chosen) && configured(env.MAPBOX_ACCESS_TOKEN)) provider = mapboxProvider(env.MAPBOX_ACCESS_TOKEN!)
  else if ((chosen === 'positionstack' || !chosen) && configured(env.GEOCODING_API_KEY)) provider = positionstackProvider(env.GEOCODING_API_KEY!)
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
