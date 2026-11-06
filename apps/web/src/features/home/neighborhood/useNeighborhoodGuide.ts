import { useQuery } from '@tanstack/react-query'
import type { DirectoryListing } from './DirectoryList'
import { apiOrigin } from './loadDiscovery'

export type GuideListing = {
  readonly id: string
  readonly slug: string
  readonly name: string
  readonly category: string
  readonly categoryLabel: string
  readonly addressStreet: string | null
  readonly website: string | null
  readonly phone: string | null
  readonly latitude: number | null
  readonly longitude: number | null
  readonly featured: boolean
  readonly distance: number | null
}

function asDirectory(listing: GuideListing): DirectoryListing {
  return {
    id: listing.id,
    slug: listing.slug,
    name: listing.name,
    category: listing.category,
    categoryLabel: listing.categoryLabel,
    addressStreet: listing.addressStreet,
    website: listing.website,
    phone: listing.phone,
    latitude: listing.latitude,
    longitude: listing.longitude,
    featured: listing.featured,
    distance: listing.distance ?? 99,
    attribution: null,
    merchant: false,
  }
}

/** Admin-curated places for this neighborhood, ahead of the radius directory. */
export function mergeCurated(listings: readonly DirectoryListing[], curated: readonly GuideListing[]): DirectoryListing[] {
  const featured = new Set(curated.filter((listing) => listing.featured).map((listing) => listing.id))
  const seen = new Set(listings.map((listing) => listing.id))
  const extra = curated.filter((listing) => !seen.has(listing.id)).map(asDirectory)
  return [...extra, ...listings].map((listing) => (featured.has(listing.id) ? { ...listing, featured: true } : listing))
}

export function useNeighborhoodGuide(slug?: string) {
  return useQuery({
    queryKey: ['neighborhood-guide', slug],
    enabled: Boolean(slug),
    queryFn: async () => {
      const response = await fetch(`${apiOrigin()}/api/places/${slug}/guide`)
      if (!response.ok) return []
      const body = await response.json() as { sections?: { listings: GuideListing[] }[] }
      return body.sections?.flatMap((section) => section.listings) ?? []
    },
  })
}
