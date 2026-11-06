import type { DiscoveryContext } from './discoveryContext'
import { homepageTitle, type NeighborhoodCard } from '../neighborhood/neighborhoodHero'

export type PlaceKind = 'city' | 'zip' | 'neighborhood' | 'open'
export type DiscoveryEmphasis = 'city' | 'zip' | 'neighborhood' | 'search' | 'category'
export type DiscoveryBand = 'hero' | 'neighborhoods' | 'personal' | 'shops' | 'categories' | 'feed'

const CATEGORY_LABEL: Record<string, string> = {
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

export function discoveryBands(emphasis: DiscoveryEmphasis): readonly DiscoveryBand[] {
  if (emphasis === 'search') return ['hero', 'feed', 'shops', 'neighborhoods']
  if (emphasis === 'category') return ['hero', 'shops', 'feed', 'neighborhoods', 'categories']
  if (emphasis === 'neighborhood') return ['hero', 'neighborhoods', 'shops', 'feed', 'personal', 'categories']
  if (emphasis === 'zip') return ['hero', 'shops', 'personal', 'neighborhoods', 'feed', 'categories']
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
  const where = input.kind === 'neighborhood' && input.focus
    ? input.focus.name
    : input.kind === 'zip' && input.zip
      ? input.zip
      : city
  if (input.emphasis === 'search' || input.emphasis === 'category') {
    const filter = [
      CATEGORY_LABEL[input.category] ?? '',
      input.query.trim() ? `“${input.query.trim()}”` : '',
    ].filter(Boolean).join(' · ')
    return {
      kicker: input.kind === 'neighborhood' ? 'Neighborhood' : input.kind === 'zip' ? `ZIP ${input.zip ?? ''}`.trim() : 'City',
      title: input.kind === 'neighborhood' && input.focus ? input.focus.name : input.kind === 'zip' ? homepageTitle(city, state, []) : city,
      lede: `${input.shopCount} results${filter ? ` for ${filter}` : ''} in ${where}.`,
    }
  }
  if (input.kind === 'neighborhood' && input.focus) {
    return {
      kicker: [city, state].filter(Boolean).join(', ') || 'Neighborhood',
      title: input.focus.name,
      lede: input.focus.headline || input.focus.about || `Places and shops in ${input.focus.name}.`,
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
      kicker: 'Austin Local Guide',
      title: 'Find shops',
      lede: 'Enter a ZIP code for neighborhood delivery, or explore Austin’s neighborhoods below.',
    }
  }
  return {
    kicker: 'City',
    title: city,
    lede: input.areaNames
      ? `Neighborhoods, featured businesses, and local activity across ${city}. ${input.areaNames}.`
      : `Neighborhoods, featured businesses, and local activity across ${city}.`,
  }
}

export function neighborhoodBandCopy(kind: PlaceKind, zip?: string, city?: string): { readonly kicker: string; readonly title: string; readonly label: string } {
  if (kind === 'neighborhood') {
    return { kicker: 'Nearby', title: 'Neighborhoods next to this one', label: 'Nearby neighborhoods' }
  }
  if (kind === 'zip') {
    return {
      kicker: zip ? `Around ${zip}` : 'Nearby',
      title: 'Neighborhoods around this area',
      label: 'Nearby Neighborhoods',
    }
  }
  return {
    kicker: city ? `Explore ${city}` : 'Explore Austin',
    title: kind === 'city' ? 'Popular neighborhoods' : 'Austin neighborhoods',
    label: 'Austin neighborhoods',
  }
}
