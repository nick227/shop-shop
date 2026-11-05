import type { GeoBox } from './geo.js'
import { osmElementCandidate, overpassBox, overpassElements } from './osm-source.js'
import type { ListingCandidate } from './types.js'

const FILTERS = [
  '["name"]["amenity"~"^(restaurant|fast_food|cafe|bar|pub|ice_cream|bakery|theatre|cinema|arts_centre|library)$"]',
  '["name"]["shop"]',
  '["name"]["tourism"~"^(attraction|museum|gallery|viewpoint|zoo|theme_park)$"]',
  '["name"]["leisure"~"^(park|stadium|nature_reserve)$"]',
]

export async function loadAustinBusinesses(box: GeoBox): Promise<ListingCandidate[]> {
  const bounds = overpassBox(box)
  const found = new Map<string, ListingCandidate>()
  for (const filter of FILTERS) {
    const query = `[out:json][timeout:120];(nwr${filter}${bounds};);out center tags;`
    const elements = await overpassElements(query, 150_000)
    for (const element of elements) {
      const candidate = osmElementCandidate(element)
      if (candidate) found.set(candidate.sourceId, candidate)
    }
  }
  return [...found.values()]
}
