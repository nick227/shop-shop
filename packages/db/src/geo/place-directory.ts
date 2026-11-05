import type { ExtendedPrismaClient } from '../client.js'
import type { GeocodingResult } from '../services/geocoding-cache.service.js'
import { GAZETTEER_CITIES, GAZETTEER_NEIGHBORHOODS, GAZETTEER_ZIPS } from './gazetteer.js'

type PlaceDb = Pick<ExtendedPrismaClient, 'place' | 'postalCode' | 'placePostalCode' | 'store' | 'unresolvedStorePlace'>

export async function ensureGazetteer(db: PlaceDb): Promise<void> {
  for (const city of GAZETTEER_CITIES) {
    await db.place.upsert({
      where: { slug: city.slug },
      create: { ...city, kind: 'CITY', country: 'US' },
      update: { name: city.name, state: city.state, latitude: city.latitude, longitude: city.longitude },
    })
  }

  for (const zip of GAZETTEER_ZIPS) {
    await db.postalCode.upsert({
      where: { code: zip.code },
      create: zip,
      update: { cityPlaceId: zip.cityPlaceId, latitude: zip.latitude, longitude: zip.longitude },
    })
  }

  for (const area of GAZETTEER_NEIGHBORHOODS) {
    const { postalCodes, boundaryJson, ...place } = area
    await db.place.upsert({
      where: { slug: place.slug },
      create: { ...place, kind: 'NEIGHBORHOOD', country: 'US', boundaryJson: boundaryJson ?? undefined },
      update: {
        name: place.name,
        parentId: place.parentId,
        state: place.state,
        latitude: place.latitude,
        longitude: place.longitude,
        boundaryJson: boundaryJson ?? undefined,
      },
    })
    for (const postalCode of postalCodes) {
      await db.placePostalCode.upsert({
        where: { placeId_postalCode: { placeId: place.id, postalCode } },
        create: { placeId: place.id, postalCode },
        update: {},
      })
    }
  }
}

export async function lookupPostalCode(db: Pick<PlaceDb, 'postalCode'>, code: string): Promise<GeocodingResult | null> {
  const row = await db.postalCode.findUnique({
    where: { code },
    include: { city: true },
  })
  if (!row) return null
  const state = row.city.state ?? ''
  return {
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    city: row.city.name,
    state,
    zip: row.code,
    country: row.city.country,
    formattedAddress: `${row.city.name}, ${state} ${row.code}`,
    confidence: 'high',
    source: 'manual',
  }
}

type StoreRow = {
  id: string
  addressCity: string | null
  addressState: string | null
  addressZip: string | null
  latitude: unknown
  longitude: unknown
}

function normalizeZip(value: string | null): string {
  const digits = (value ?? '').replace(/\D/g, '')
  return digits.length >= 5 ? digits.slice(0, 5) : ''
}

/** Attach each store to a neighborhood when the ZIP has exactly one, otherwise to its city. */
export async function backfillStorePlaces(db: PlaceDb): Promise<{ assigned: number; unresolved: number }> {
  await ensureGazetteer(db)
  const postals = await db.postalCode.findMany({
    include: { places: { include: { place: { select: { id: true, kind: true } } } } },
  })
  const cities = await db.place.findMany({ where: { kind: 'CITY' }, select: { id: true, name: true, state: true } })
  const postalByCode = new Map(postals.map((row) => [row.code, row]))
  const stores = await db.store.findMany({
    select: { id: true, addressCity: true, addressState: true, addressZip: true, latitude: true, longitude: true },
  })

  let assigned = 0
  let unresolved = 0
  for (const store of stores) {
    const placeId = placeForStore(store, postalByCode, cities)
    if (placeId) {
      await db.store.update({ where: { id: store.id }, data: { placeId } })
      await db.unresolvedStorePlace.deleteMany({ where: { storeId: store.id } })
      assigned += 1
      continue
    }
    const zip = normalizeZip(store.addressZip)
    const reason = zip ? 'UNKNOWN_ZIP' : store.addressCity?.trim() ? 'UNKNOWN_CITY' : 'NO_LOCATION'
    await db.store.update({ where: { id: store.id }, data: { placeId: null } })
    await db.unresolvedStorePlace.upsert({
      where: { storeId: store.id },
      create: {
        storeId: store.id,
        reason,
        addressCity: store.addressCity,
        addressState: store.addressState,
        addressZip: store.addressZip,
      },
      update: {
        reason,
        addressCity: store.addressCity,
        addressState: store.addressState,
        addressZip: store.addressZip,
      },
    })
    unresolved += 1
  }
  return { assigned, unresolved }
}

function placeForStore(
  store: StoreRow,
  postalByCode: Map<string, { cityPlaceId: string; places: { place: { id: string; kind: string } }[] }>,
  cities: { id: string; name: string; state: string | null }[],
): string | null {
  const zip = normalizeZip(store.addressZip)
  const postal = zip ? postalByCode.get(zip) : undefined
  if (postal) {
    const neighborhoods = postal.places.filter((link) => link.place.kind === 'NEIGHBORHOOD')
    return neighborhoods.length === 1 ? neighborhoods[0].place.id : postal.cityPlaceId
  }
  const cityName = store.addressCity?.trim().toLowerCase()
  const state = store.addressState?.trim().toUpperCase()
  if (!cityName) return null
  const city = cities.find((entry) => entry.name.toLowerCase() === cityName && (!state || entry.state === state))
  return city?.id ?? null
}
