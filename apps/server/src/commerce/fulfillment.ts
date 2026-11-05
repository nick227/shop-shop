/**
 * Fulfillment: where an order goes and whether the store can take it there.
 *
 * Delivery eligibility, in order: the store delivers at all; the address can be placed on a map; it falls
 * inside one of the store's active delivery zones (or, without zones, within the store's delivery radius);
 * and the subtotal meets the zone's or store's delivery minimum. The fee is the zone's, else the store's
 * delivery charge, else the platform default.
 */
import {
  createEnhancedGeocodingService,
  findDeliveryZoneForAddress,
  haversineMiles,
  lookupPostalCode,
  prisma,
} from '@packages/db'
import { AppError } from '../middleware/errors.js'
import { DEFAULT_DELIVERY_FEE } from './pricingPolicy.js'

export interface DeliveryAddressInput {
  readonly label?: string | null
  readonly line1: string
  readonly line2?: string | null
  readonly city: string
  readonly state: string
  readonly postalCode: string
  readonly country?: string | null
  readonly instructions?: string | null
}

export interface ResolvedDestination {
  readonly addressId: string | null
  readonly address: DeliveryAddressInput
  readonly lat: number
  readonly lng: number
  /** True when only the ZIP code could be placed (no street-level geocoding). */
  readonly approximate: boolean
}

export type DeliveryUnavailableCode =
  | 'STORE_DOES_NOT_DELIVER'
  | 'ADDRESS_REQUIRED'
  | 'ADDRESS_NOT_FOUND'
  | 'OUTSIDE_DELIVERY_AREA'
  | 'BELOW_DELIVERY_MINIMUM'
  | 'STORE_LOCATION_MISSING'

export type DeliveryEligibility =
  | {
      readonly available: true
      readonly fee: number
      readonly minimum: number | null
      readonly distanceMiles: number | null
      readonly zoneName: string | null
    }
  | {
      readonly available: false
      readonly code: DeliveryUnavailableCode
      readonly message: string
      readonly minimum: number | null
      /** How much more the shopper needs to add, for BELOW_DELIVERY_MINIMUM. */
      readonly shortBy: number | null
    }

export interface FulfillmentStore {
  readonly id: string
  readonly deliveryEnabled: boolean
  readonly pickupEnabled: boolean
  readonly deliveryCharge: unknown
  readonly deliveryDistance: unknown
  readonly deliveryMinimum: unknown
  readonly latitude: unknown
  readonly longitude: unknown
}

const num = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(String(value))
  return Number.isFinite(parsed) ? parsed : null
}
const money = (value: number) => `$${value.toFixed(2)}`

const cleanText = (value: unknown, max: number) => (typeof value === 'string' ? value.trim().slice(0, max) : '')

export function normalizeAddressInput(raw: unknown): DeliveryAddressInput {
  const input = (raw ?? {}) as Record<string, unknown>
  const address = {
    label: cleanText(input.label, 40) || null,
    line1: cleanText(input.line1, 120),
    line2: cleanText(input.line2, 60) || null,
    city: cleanText(input.city, 60),
    state: cleanText(input.state, 2).toUpperCase(),
    postalCode: cleanText(input.postalCode, 10),
    country: cleanText(input.country, 2).toUpperCase() || 'US',
    instructions: cleanText(input.instructions, 280) || null,
  }
  if (!address.line1 || !address.city || !/^[A-Z]{2}$/.test(address.state) || !/^\d{5}(-\d{4})?$/.test(address.postalCode)) {
    throw new AppError(400, 'Enter a street address, city, two-letter state and ZIP code.')
  }
  return address
}

let geocoder: ReturnType<typeof createEnhancedGeocodingService> | null | undefined
function streetGeocoder() {
  if (geocoder !== undefined) return geocoder
  const apiKey = process.env.GEOCODING_API_KEY
  geocoder = apiKey && !apiKey.startsWith('your') ? createEnhancedGeocodingService(prisma, { apiKey, enableCache: true, cacheTTLHours: 24 * 30 }) : null
  return geocoder
}

/** A map position for an address: street-level when geocoding is configured, otherwise the ZIP's center. */
export async function locateAddress(address: DeliveryAddressInput): Promise<{ lat: number; lng: number; approximate: boolean } | null> {
  const service = streetGeocoder()
  if (service) {
    const hit = await service
      .geocodeAddress(`${address.line1}, ${address.city}, ${address.state} ${address.postalCode}`)
      .catch(() => null)
    if (hit) return { lat: hit.latitude, lng: hit.longitude, approximate: false }
  }
  const zip = await lookupPostalCode(prisma, address.postalCode.slice(0, 5)).catch(() => null)
  return zip ? { lat: zip.latitude, lng: zip.longitude, approximate: true } : null
}

const geoOf = (geo: unknown): { lat: number; lng: number } | null => {
  const g = (geo ?? {}) as Record<string, unknown>
  const lat = num(g.lat ?? g.latitude)
  const lng = num(g.lng ?? g.longitude)
  return lat !== null && lng !== null ? { lat, lng } : null
}

/**
 * The delivery destination from a saved address (which must be the shopper's) or a typed one.
 * Returns null when there is none; throws on someone else's address.
 */
export async function resolveDestination(
  input: { deliveryAddressId?: string | null; deliveryAddress?: unknown },
  userId: string | null,
): Promise<ResolvedDestination | 'NOT_FOUND' | null> {
  if (input.deliveryAddressId) {
    if (!userId) throw new AppError(401, 'Sign in to use a saved address')
    const saved = await prisma.address.findUnique({ where: { id: input.deliveryAddressId } })
    if (!saved || saved.userId !== userId || saved.isActive === false) throw new AppError(404, 'That address is no longer available')
    const address: DeliveryAddressInput = {
      label: saved.label,
      line1: saved.line1,
      line2: saved.line2,
      city: saved.city,
      state: saved.state,
      postalCode: saved.postalCode,
      country: saved.country,
      instructions: saved.instructions,
    }
    const stored = geoOf(saved.geo)
    const located = stored ? { ...stored, approximate: Boolean((saved.geo as { approximate?: boolean } | null)?.approximate) } : await locateAddress(address)
    if (!located) return 'NOT_FOUND'
    if (!stored) await prisma.address.update({ where: { id: saved.id }, data: { geo: located } }).catch(() => undefined)
    return { addressId: saved.id, address, ...located }
  }
  if (input.deliveryAddress) {
    const address = normalizeAddressInput(input.deliveryAddress)
    const located = await locateAddress(address)
    return located ? { addressId: null, address, ...located } : 'NOT_FOUND'
  }
  return null
}

export async function deliveryEligibility(
  store: FulfillmentStore,
  destination: ResolvedDestination | 'NOT_FOUND' | null,
  subtotal: number,
): Promise<DeliveryEligibility> {
  const storeMinimum = num(store.deliveryMinimum)
  const unavailable = (code: DeliveryUnavailableCode, message: string, minimum: number | null = storeMinimum, shortBy: number | null = null) =>
    ({ available: false, code, message, minimum, shortBy }) as const

  if (!store.deliveryEnabled) return unavailable('STORE_DOES_NOT_DELIVER', 'This store offers pickup only.')
  if (destination === null) return unavailable('ADDRESS_REQUIRED', 'Add a delivery address to see if this store delivers to you.')
  if (destination === 'NOT_FOUND') return unavailable('ADDRESS_NOT_FOUND', 'We couldn’t find that address. Check the street and ZIP code.')

  const storeLat = num(store.latitude)
  const storeLng = num(store.longitude)
  const distanceMiles =
    storeLat !== null && storeLng !== null ? Math.round(haversineMiles({ latitude: storeLat, longitude: storeLng }, { latitude: destination.lat, longitude: destination.lng }) * 10) / 10 : null

  const zones = await prisma.deliveryZone.count({ where: { storeId: store.id, isActive: true } })
  let fee: number
  let minimum = storeMinimum
  let zoneName: string | null = null
  if (zones > 0) {
    const zone = await findDeliveryZoneForAddress(store.id, { lat: destination.lat, lng: destination.lng })
    if (!zone) return unavailable('OUTSIDE_DELIVERY_AREA', 'This address is outside the store’s delivery area.')
    fee = Number(zone.baseFee)
    minimum = num(zone.minOrder) ?? storeMinimum
    zoneName = zone.name
  } else {
    const radius = num(store.deliveryDistance)
    if (radius !== null) {
      if (distanceMiles === null) return unavailable('STORE_LOCATION_MISSING', 'This store hasn’t set its location for delivery yet.')
      if (distanceMiles > radius) {
        return unavailable('OUTSIDE_DELIVERY_AREA', `This address is ${distanceMiles} miles away; the store delivers within ${radius} miles.`)
      }
    }
    fee = num(store.deliveryCharge) ?? DEFAULT_DELIVERY_FEE
  }

  if (minimum !== null && subtotal < minimum) {
    const shortBy = Math.round((minimum - subtotal) * 100) / 100
    return unavailable('BELOW_DELIVERY_MINIMUM', `Delivery needs a ${money(minimum)} minimum. Add ${money(shortBy)} more, or choose pickup.`, minimum, shortBy)
  }
  return { available: true, fee: Math.round(fee * 100) / 100, minimum, distanceMiles, zoneName }
}
