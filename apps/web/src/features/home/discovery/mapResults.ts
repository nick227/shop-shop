import type { DirectoryListing } from '../neighborhood/DirectoryList'
import { matchesDirectoryBrowse } from './infiniteFeed'
import { mapPoints, type DiscoveryStore } from './tiles'

export type ResultPoint = { readonly id: string; readonly name: string; readonly latitude: number; readonly longitude: number }

/** Pins for the same businesses and places the feed is showing. */
export function discoveryMapPoints(
  stores: readonly DiscoveryStore[],
  listings: readonly DirectoryListing[],
  browse: string,
  query: string,
): readonly ResultPoint[] {
  const q = query.trim().toLowerCase()
  const points = mapPoints(stores)
  const seen = new Set(points.map((point) => point.name.toLowerCase()))
  for (const listing of listings) {
    if (!matchesDirectoryBrowse(listing, browse)) continue
    if (q && !`${listing.name} ${listing.categoryLabel} ${listing.addressStreet ?? ''}`.toLowerCase().includes(q)) continue
    if (listing.latitude == null || listing.longitude == null) continue
    if (seen.has(listing.name.toLowerCase())) continue
    seen.add(listing.name.toLowerCase())
    points.push({
      id: `directory:${listing.slug}`,
      name: listing.name,
      latitude: listing.latitude,
      longitude: listing.longitude,
    })
  }
  return points
}
