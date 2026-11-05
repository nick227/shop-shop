import type { Prisma } from '../generated/client/index.js'
import type { ExtendedPrismaClient } from '../client.js'

export type GeoScopeInput = {
  readonly scope: string
  readonly city?: string
  readonly state?: string
  readonly zip?: string
  readonly place?: string
  readonly latitude?: number
  readonly longitude?: number
  readonly radiusMiles?: number
}

export type StoreScope =
  | { readonly kind: 'where'; readonly where: Prisma.StoreWhereInput }
  | { readonly kind: 'radius'; readonly where: Prisma.StoreWhereInput; readonly latitude: number; readonly longitude: number; readonly radiusMiles: number }

type ScopeDb = Pick<ExtendedPrismaClient, 'place' | 'postalCode'>

const SCOPES = new Set(['city', 'neighborhood', 'zip', 'radius'])

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function num(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return undefined
}

/** Item search uses the same ZIP radius as stores, without a separate scope control. */
export function itemGeoScope(filters: Record<string, unknown>): GeoScopeInput | null {
  const explicit = readGeoScopeInput(filters)
  if (explicit) return explicit
  const radiusRequested = filters.radiusMiles !== undefined && filters.radiusMiles !== ''
  const latitude = num(filters.latitude)
  const longitude = num(filters.longitude)
  if (!radiusRequested && latitude === undefined && longitude === undefined) return null
  return {
    scope: 'radius',
    latitude,
    longitude,
    radiusMiles: num(filters.radiusMiles),
  }
}

/** Null when the request is not asking for a geographic scope. */
export function readGeoScopeInput(filters: Record<string, unknown>): GeoScopeInput | null {
  const scope = text(filters.scope)
  if (!SCOPES.has(scope)) return null
  return {
    scope,
    city: text(filters.city) || undefined,
    state: text(filters.state).toUpperCase() || undefined,
    zip: text(filters.zip) || undefined,
    place: text(filters.place) || undefined,
    latitude: num(filters.latitude),
    longitude: num(filters.longitude),
    radiusMiles: num(filters.radiusMiles),
  }
}

/** Null means the scope was requested and could not be resolved. Callers must return an empty set. */
export async function storeWhereForScope(db: ScopeDb, input: GeoScopeInput): Promise<StoreScope | null> {
  if (input.scope === 'city') return cityScope(db, input.city, input.state)
  if (input.scope === 'neighborhood') return neighborhoodScope(db, input.place)
  if (input.scope === 'zip') return zipScope(db, input.zip)
  if (input.scope === 'radius') return radiusScope(input)
  return null
}

async function cityScope(db: ScopeDb, city: string | undefined, state: string | undefined): Promise<StoreScope | null> {
  if (!city || !state) return null
  const place = await db.place.findFirst({
    where: { kind: 'CITY', name: city, state },
    select: { id: true, name: true, state: true, children: { select: { id: true } } },
  })
  if (!place) return null
  const placeIds = [place.id, ...place.children.map((child) => child.id)]
  return {
    kind: 'where',
    where: {
      OR: [
        { placeId: { in: placeIds } },
        { placeId: null, addressCity: place.name, addressState: place.state ?? state },
      ],
    },
  }
}

async function neighborhoodScope(db: ScopeDb, slug: string | undefined): Promise<StoreScope | null> {
  if (!slug) return null
  const place = await db.place.findFirst({
    where: { kind: 'NEIGHBORHOOD', slug },
    select: { id: true },
  })
  if (!place) return null
  return { kind: 'where', where: { placeId: place.id } }
}

async function zipScope(db: ScopeDb, zip: string | undefined): Promise<StoreScope | null> {
  const code = (zip ?? '').replace(/\D/g, '').slice(0, 5)
  if (code.length !== 5) return null
  const postal = await db.postalCode.findUnique({ where: { code }, select: { code: true } })
  if (!postal) return null
  return {
    kind: 'where',
    where: {
      OR: [
        { addressZip: code },
        { place: { kind: 'NEIGHBORHOOD', postalLinks: { some: { postalCode: code } } } },
      ],
    },
  }
}

function radiusScope(input: GeoScopeInput): StoreScope | null {
  const latitude = input.latitude
  const longitude = input.longitude
  if (latitude === undefined || longitude === undefined) return null
  if (latitude === 0 || longitude === 0) return null
  const radiusMiles = input.radiusMiles && input.radiusMiles > 0 ? input.radiusMiles : 25
  const latDelta = radiusMiles / 69
  const lngDelta = radiusMiles / (69 * Math.max(0.2, Math.cos((latitude * Math.PI) / 180)))
  return {
    kind: 'radius',
    latitude,
    longitude,
    radiusMiles,
    where: {
      latitude: { not: null, gte: latitude - latDelta, lte: latitude + latDelta },
      longitude: { not: null, gte: longitude - lngDelta, lte: longitude + lngDelta },
    },
  }
}
