import type { DiscoveryContext } from './discoveryContext'
import { homepageTitle, type NeighborhoodCard } from '../neighborhood/neighborhoodHero'

export type PlaceKind = 'city' | 'zip' | 'neighborhood' | 'open'
export type DiscoveryEmphasis = 'city' | 'zip' | 'neighborhood' | 'search' | 'category'
export type DiscoveryBand = 'hero' | 'neighborhoods' | 'personal' | 'shops' | 'categories' | 'feed'

export const CATEGORY_LABEL: Record<string, string> = {
  food: 'Food',
  grocery: 'Grocery',
  convenience: 'Convenience',
  retail: 'Retail',
  arts: 'Arts',
  outdoors: 'Outdoors',
}

export function placeKind(context: DiscoveryContext, pathname: string): PlaceKind {
  if (context.neighborhood) return 'neighborhood'
  if (context.zip) return 'zip'
  if (context.city || pathname === '/neighborhoods') return 'city'
  return 'open'
}

/** Search and category change what leads. The place kind still names the header. */
export function discoveryEmphasis(context: DiscoveryContext, kind: PlaceKind): DiscoveryEmphasis {
  if (context.q.trim()) return 'search'
  if (context.category) return 'category'
  if (kind === 'open') return 'city'
  return kind
}

/** One order for every context so a filter or place change does not rebuild the page. */
export function discoveryBands(_emphasis?: DiscoveryEmphasis): readonly DiscoveryBand[] {
  return ['hero', 'neighborhoods', 'shops', 'personal', 'feed', 'categories']
}

export function provisionalPlaceName(slug: string, neighborhood: boolean): string {
  const body = neighborhood ? slug.replace(/^[a-z]+-[a-z]{2}-/i, '') : slug.replace(/-[a-z]{2}$/i, '')
  return body.split('-').filter(Boolean).map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}

export function heroIdentity(input: {
  readonly kind: PlaceKind
  readonly emphasis: DiscoveryEmphasis
  readonly city?: string
  readonly state?: string
  readonly zip?: string
  readonly focus?: NeighborhoodCard
  readonly shopCount: number
  readonly areaNames: string
  readonly category: string
  readonly query: string
}): { readonly kicker: string; readonly title: string; readonly lede: string } {
  const city = input.city || 'Austin'
  const state = input.state || 'TX'
  if (input.kind === 'neighborhood' && input.focus) {
    return {
      kicker: [city, state].filter(Boolean).join(', ') || 'Neighborhood',
      title: input.focus.name,
      lede: input.focus.headline || input.focus.about || 'Independent shops, kitchens, and local places nearby.',
    }
  }
  if (input.kind === 'zip' && input.zip) {
    return {
      kicker: `ZIP ${input.zip}`,
      title: homepageTitle(city, state, []),
      lede: input.shopCount > 0
        ? `${input.shopCount} shops near ${input.zip}${input.areaNames ? `, including ${input.areaNames}` : ''}.`
        : `Shops and neighborhoods around ${input.zip}.`,
    }
  }
  if (input.kind === 'open') {
    return {
      kicker: 'Local guide',
      title: 'Find shops',
      lede: 'Enter a ZIP code for neighborhood delivery, or explore Austin’s neighborhoods below.',
    }
  }
  return {
    kicker: 'City',
    title: city,
    lede: input.areaNames
      ? `Independent shops and neighborhood guides: ${input.areaNames}.`
      : 'Independent shops and neighborhood guides.',
  }
}

export function neighborhoodBandCopy(kind: PlaceKind, _zip?: string, city?: string): { readonly kicker: string; readonly title: string; readonly label: string } {
  if (kind === 'neighborhood') {
    return { kicker: 'Nearby', title: 'Neighborhoods', label: 'Nearby neighborhoods' }
  }
  if (kind === 'zip') {
    return { kicker: 'Nearby', title: 'Neighborhoods', label: 'Nearby Neighborhoods' }
  }
  return {
    kicker: city ? city : 'Austin',
    title: 'Neighborhoods',
    label: 'Austin neighborhoods',
  }
}

export function resultsNote(count: number, category: string, query: string): string | undefined {
  if (!category && !query.trim()) return undefined
  const filter = [CATEGORY_LABEL[category] ?? '', query.trim()].filter(Boolean).join(' · ')
  const noun = count === 1 ? 'place' : 'places'
  return filter ? `${count} ${noun} · ${filter}` : `${count} ${noun}`
}
