import type { ListingCandidate, ListingSource } from './types.js'

const AUSTIN = { south: 30.098, west: -97.938, north: 30.517, east: -97.562 }
const OVERPASS = 'https://overpass-api.de/api/interpreter'
const USER_AGENT = 'ShopShop/0.1 (neighborhood directory import)'

const AMENITY: Record<string, readonly [string, string]> = {
  restaurant: ['RESTAURANT', 'Restaurant'],
  fast_food: ['RESTAURANT', 'Restaurant'],
  cafe: ['COFFEE', 'Coffee'],
  bar: ['RESTAURANT', 'Bar'],
  pub: ['RESTAURANT', 'Pub'],
  bakery: ['BAKERY', 'Bakery'],
  ice_cream: ['RESTAURANT', 'Ice cream'],
}

const SHOP: Record<string, readonly [string, string]> = {
  supermarket: ['GROCERY', 'Grocery'],
  grocery: ['GROCERY', 'Grocery'],
  convenience: ['CONVENIENCE', 'Convenience'],
  bakery: ['BAKERY', 'Bakery'],
}

type OsmElement = {
  type: string
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}

function escapeName(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function category(tags: Record<string, string>): readonly [string, string] | null {
  if (tags.amenity && AMENITY[tags.amenity]) return AMENITY[tags.amenity]
  if (tags.shop && SHOP[tags.shop]) return SHOP[tags.shop]
  if (tags.shop) return ['RETAIL', 'Shop']
  if (tags.tourism === 'attraction' || tags.tourism === 'museum' || tags.tourism === 'gallery') return ['ATTRACTION', 'Attraction']
  if (tags.amenity) return ['OTHER', tags.amenity]
  return null
}

function candidate(element: OsmElement): ListingCandidate | null {
  const tags = element.tags
  const latitude = element.lat ?? element.center?.lat
  const longitude = element.lon ?? element.center?.lon
  if (!tags?.name || latitude == null || longitude == null) return null
  const mapped = category(tags)
  if (!mapped) return null
  const street = [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' ') || null
  const zip = /^\d{5}$/.test(tags['addr:postcode'] ?? '') ? tags['addr:postcode'] : null
  const evidence = ['coordinates']
  if (street) evidence.push('street address')
  if (tags.phone) evidence.push('phone')
  if (tags.website) evidence.push('website')
  return {
    source: 'osm',
    sourceId: `${element.type}/${element.id}`,
    name: tags.name,
    category: mapped[0],
    categoryLabel: mapped[1],
    street,
    city: tags['addr:city'] ?? null,
    state: tags['addr:state'] ?? null,
    zip,
    latitude,
    longitude,
    phone: tags.phone ?? null,
    website: tags.website ?? null,
    description: tags.description ?? null,
    evidence,
  }
}

export const osmSource: ListingSource = {
  async search(names) {
    const pattern = names.map(escapeName).join('|')
    const box = `(${AUSTIN.south},${AUSTIN.west},${AUSTIN.north},${AUSTIN.east})`
    const query = `[out:json][timeout:55];(nwr["name"~"^(${pattern})$",i]["amenity"]${box};nwr["name"~"^(${pattern})$",i]["shop"]${box};nwr["name"~"^(${pattern})$",i]["tourism"]${box};);out center tags;`
    const response = await fetch(`${OVERPASS}?data=${encodeURIComponent(query)}`, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
      signal: AbortSignal.timeout(70_000),
    })
    if (!response.ok) throw new Error(`OpenStreetMap lookup failed (${response.status})`)
    const body = await response.json() as { elements?: OsmElement[] }
    return (body.elements ?? []).flatMap((element) => {
      const row = candidate(element)
      return row ? [row] : []
    })
  },
}

export async function austinNeighborhoods(): Promise<Array<{ name: string; latitude: number; longitude: number; zip: string | null }>> {
  const box = `(${AUSTIN.south},${AUSTIN.west},${AUSTIN.north},${AUSTIN.east})`
  const query = `[out:json][timeout:55];(nwr["place"~"^(neighbourhood|suburb)$"]["name"]${box};);out center tags;`
  const response = await fetch(`${OVERPASS}?data=${encodeURIComponent(query)}`, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
    signal: AbortSignal.timeout(70_000),
  })
  if (!response.ok) throw new Error(`OpenStreetMap lookup failed (${response.status})`)
  const body = await response.json() as { elements?: OsmElement[] }
  const rows = (body.elements ?? []).flatMap((element) => {
    const latitude = element.lat ?? element.center?.lat
    const longitude = element.lon ?? element.center?.lon
    const name = element.tags?.name
    if (!name || latitude == null || longitude == null) return []
    const zip = /^\d{5}$/.test(element.tags?.postal_code ?? '') ? element.tags?.postal_code ?? null : null
    return [{ name, latitude, longitude, zip }]
  })
  const byName = new Map(rows.map((row) => [row.name.toLowerCase(), row]))
  return [...byName.values()]
}
