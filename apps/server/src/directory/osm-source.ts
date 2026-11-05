import type { ListingCandidate, ListingSource } from './types.js'

const AUSTIN = { south: 30.098, west: -97.938, north: 30.517, east: -97.562 }
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.openstreetmap.fr/api/interpreter',
]
const USER_AGENT = 'ShopShop/0.1 (neighborhood directory import)'

const AMENITY: Record<string, readonly [string, string]> = {
  restaurant: ['RESTAURANT', 'Restaurant'],
  fast_food: ['RESTAURANT', 'Restaurant'],
  cafe: ['COFFEE', 'Coffee'],
  bar: ['RESTAURANT', 'Bar'],
  pub: ['RESTAURANT', 'Pub'],
  bakery: ['BAKERY', 'Bakery'],
  ice_cream: ['RESTAURANT', 'Ice cream'],
  theatre: ['ENTERTAINMENT', 'Entertainment'],
  cinema: ['ENTERTAINMENT', 'Entertainment'],
  arts_centre: ['ENTERTAINMENT', 'Entertainment'],
  library: ['ATTRACTION', 'Library'],
}

const SHOP: Record<string, readonly [string, string]> = {
  supermarket: ['GROCERY', 'Grocery'],
  grocery: ['GROCERY', 'Grocery'],
  convenience: ['CONVENIENCE', 'Convenience'],
  bakery: ['BAKERY', 'Bakery'],
}

export type OsmElement = {
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
  if (tags.leisure === 'park' || tags.leisure === 'nature_reserve') return ['ATTRACTION', 'Park']
  if (tags.leisure === 'stadium') return ['ENTERTAINMENT', 'Entertainment']
  if (tags.tourism === 'attraction' || tags.tourism === 'museum' || tags.tourism === 'gallery' || tags.tourism === 'viewpoint' || tags.tourism === 'zoo' || tags.tourism === 'theme_park') return ['ATTRACTION', 'Attraction']
  if (tags.amenity) return ['OTHER', tags.amenity]
  return null
}

export function osmElementCandidate(element: OsmElement): ListingCandidate | null {
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

export async function overpassElements(query: string, timeoutMs: number): Promise<OsmElement[]> {
  let lastError = 'OpenStreetMap lookup failed'
  for (const [index, endpoint] of OVERPASS_ENDPOINTS.entries()) {
    const budget = index === 0 ? Math.min(timeoutMs, 20_000) : timeoutMs
    try {
      const response = await fetch(`${endpoint}?data=${encodeURIComponent(query)}`, {
        headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
        signal: AbortSignal.timeout(budget),
      })
      if (!response.ok) {
        lastError = `OpenStreetMap lookup failed (${response.status})`
        continue
      }
      const body = await response.json() as { elements?: OsmElement[] }
      return body.elements ?? []
    } catch (error) {
      lastError = error instanceof Error ? error.message : lastError
    }
  }
  throw new Error(lastError)
}

export function overpassBox(box: { south: number; west: number; north: number; east: number }): string {
  return `(${box.south},${box.west},${box.north},${box.east})`
}

export const osmSource: ListingSource = {
  async search(names) {
    const pattern = names.map(escapeName).join('|')
    const box = overpassBox(AUSTIN)
    const query = `[out:json][timeout:55];(nwr["name"~"^(${pattern})$",i]["amenity"]${box};nwr["name"~"^(${pattern})$",i]["shop"]${box};nwr["name"~"^(${pattern})$",i]["tourism"]${box};);out center tags;`
    const elements = await overpassElements(query, 70_000)
    return elements.flatMap((element) => {
      const row = osmElementCandidate(element)
      return row ? [row] : []
    })
  },
}

export async function austinNeighborhoods(bounds = AUSTIN): Promise<Array<{ name: string; latitude: number; longitude: number; zip: string | null }>> {
  const box = overpassBox(bounds)
  const query = `[out:json][timeout:90];(nwr["place"~"^(neighbourhood|suburb)$"]["name"]${box};);out center tags;`
  const elements = await overpassElements(query, 120_000)
  const rows = elements.flatMap((element) => {
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
