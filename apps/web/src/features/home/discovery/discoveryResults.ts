import type { RiverPost, StoreWithDistance } from '@api/types'
import type { DirectoryListing } from '../neighborhood/DirectoryList'
import { mergeCurated, type GuideListing } from '../neighborhood/useNeighborhoodGuide'
import { matchesDirectoryBrowse } from './infiniteFeed'
import { discoveryMapPoints } from './mapResults'
import { realPhoto } from './photo'
import { composeDiscovery, type DiscoveryItem } from './tiles'

export function listingMatchesQuery(listing: DirectoryListing, query: string): boolean {
  const needle = query.trim().toLowerCase()
  if (!needle) return true
  return `${listing.name} ${listing.categoryLabel} ${listing.addressStreet ?? ''}`.toLowerCase().includes(needle)
}

export function listingHasPhoto(listing: { readonly coverUrl?: string | null }): boolean {
  return Boolean(realPhoto(listing.coverUrl))
}

/**
 * The feed, the map, and the hero filter counts all run this, so a count on a filter
 * is the number of results that filter shows.
 */
export function discoveryResults(input: {
  readonly stores: readonly StoreWithDistance[]
  readonly products: readonly DiscoveryItem[]
  readonly stories: readonly RiverPost[]
  readonly directory: readonly DirectoryListing[]
  readonly curated: readonly GuideListing[]
  readonly browse: string
  readonly query: string
  /** Ranks delivery-ready shops first. Never removes a shop, product, story, or listing. */
  readonly deliveryFirst?: boolean
}) {
  const composed = composeDiscovery({
    stores: input.stores,
    products: input.products,
    stories: input.stories,
    browse: input.browse,
    query: input.query,
    deliveryFirst: input.deliveryFirst,
  })
  const visibleListings = mergeCurated(input.directory, input.curated)
    .filter((listing) => listingHasPhoto(listing))
    .filter((listing) => matchesDirectoryBrowse(listing, input.browse) && listingMatchesQuery(listing, input.query))
  const points = discoveryMapPoints(composed.places, visibleListings, input.browse, input.query)
  return { composed, visibleListings, points }
}
