import type { DirectoryListing } from '../neighborhood/DirectoryList'
import type { PlaceCardData } from '../neighborhood/PlaceCard'
import { placeCardFromListing } from '../neighborhood/PlaceCard'
import type { DiscoveryTile, ProductTile, StoreTile, StoryTile } from './tiles'

export type InfiniteFeedEntry =
  | { readonly kind: 'product'; readonly id: string; readonly key: string; readonly tile: ProductTile }
  | { readonly kind: 'store'; readonly id: string; readonly key: string; readonly tile: StoreTile }
  | { readonly kind: 'story'; readonly id: string; readonly key: string; readonly tile: StoryTile }
  | {
      readonly kind: 'directory' | 'attraction'
      readonly id: string
      readonly key: string
      readonly card: PlaceCardData
      readonly listing: DirectoryListing
    }

function isAttractionListing(listing: DirectoryListing): boolean {
  const label = listing.categoryLabel
  return (
    listing.category === 'ATTRACTION'
    || listing.category === 'ENTERTAINMENT'
    || label === 'Park'
    || label === 'Library'
  )
}

export function matchesDirectoryBrowse(listing: DirectoryListing, browse: string): boolean {
  if (!browse) return true
  const slug = browse.toLowerCase()
  const label = listing.categoryLabel
  if (slug === 'food') {
    return (
      listing.category === 'RESTAURANT'
      || listing.category === 'COFFEE'
      || listing.category === 'BAKERY'
      || label === 'Bar'
      || label === 'Pub'
      || label === 'Ice cream'
    )
  }
  if (slug === 'grocery') return listing.category === 'GROCERY'
  if (slug === 'convenience') return listing.category === 'CONVENIENCE'
  if (slug === 'retail' || slug === 'shopping') {
    return listing.category === 'RETAIL' || listing.category === 'GROCERY' || listing.category === 'CONVENIENCE'
  }
  if (slug === 'arts' || slug === 'entertainment') {
    return listing.category === 'ENTERTAINMENT' || listing.category === 'ATTRACTION'
  }
  if (slug === 'outdoors' || slug === 'parks') {
    return label === 'Park' || label === 'Library' || listing.category === 'ATTRACTION'
  }
  return true
}

/**
 * Interleaves products, businesses (stores + directory), local stories, and attractions
 * while avoiding duplicate IDs across the feed.
 */
export function buildInfiniteFeed(input: {
  readonly tiles: readonly DiscoveryTile[]
  readonly storeTiles: readonly StoreTile[]
  readonly stories: readonly StoryTile[]
  readonly listings: readonly DirectoryListing[]
  readonly browse?: string
  readonly query?: string
  readonly excludeIds?: ReadonlySet<string>
}): readonly InfiniteFeedEntry[] {
  const browse = (input.browse ?? '').trim().toLowerCase()
  const query = (input.query ?? '').trim().toLowerCase()
  const exclude = input.excludeIds ?? new Set<string>()
  const onlyDirectoryCategory = browse === 'arts' || browse === 'outdoors'

  const products: ProductTile[] = onlyDirectoryCategory
    ? []
    : input.tiles.filter((tile): tile is ProductTile => tile.kind === 'product')

  const stores: StoreTile[] = onlyDirectoryCategory
    ? []
    : input.storeTiles.filter((store) => !exclude.has(`store:${store.id}`))

  const storyPool = input.stories.filter((story) => {
    if (!query) return true
    return `${story.title} ${story.body}`.toLowerCase().includes(query)
  })
  const storyByStore = new Map<string, StoryTile>()
  for (const story of storyPool) {
    const key = story.storeId || story.id
    const current = storyByStore.get(key)
    if (!current || (!current.image && story.image)) storyByStore.set(key, story)
  }
  const stories = [...storyByStore.values()]

  const filteredListings = input.listings.filter((listing) => {
    if (!matchesDirectoryBrowse(listing, browse)) return false
    if (!query) return true
    return `${listing.name} ${listing.categoryLabel} ${listing.addressStreet ?? ''}`.toLowerCase().includes(query)
  })

  const attractions = filteredListings.filter(isAttractionListing)
  const businesses = filteredListings.filter((listing) => !isAttractionListing(listing))

  const seen = new Set<string>()
  const feed: InfiniteFeedEntry[] = []

  const addEntry = (entry: InfiniteFeedEntry | undefined) => {
    if (!entry) return
    if (seen.has(entry.key)) return
    seen.add(entry.key)
    feed.push(entry)
  }

  let pIdx = 0
  let sIdx = 0
  let bIdx = 0
  let stIdx = 0
  let aIdx = 0

  const totalPool = products.length + stores.length + businesses.length + stories.length + attractions.length
  for (let round = 0; round < totalPool && feed.length < 60; round += 1) {
    // 2 products per cycle for strong shopping depth
    if (pIdx < products.length) {
      const tile = products[pIdx++]!
      addEntry({ kind: 'product', id: tile.id, key: `product:${tile.id}`, tile })
    }
    if (pIdx < products.length) {
      const tile = products[pIdx++]!
      addEntry({ kind: 'product', id: tile.id, key: `product:${tile.id}`, tile })
    }
    // 1 orderable merchant store
    if (sIdx < stores.length) {
      const tile = stores[sIdx++]!
      addEntry({ kind: 'store', id: tile.id, key: `store:${tile.id}`, tile })
    }
    // 1 directory business
    if (bIdx < businesses.length) {
      const listing = businesses[bIdx++]!
      addEntry({
        kind: 'directory',
        id: listing.id,
        key: `directory:${listing.id}`,
        card: placeCardFromListing(listing),
        listing,
      })
    }
    // 1 local story
    if (stIdx < stories.length) {
      const tile = stories[stIdx++]!
      addEntry({ kind: 'story', id: tile.id, key: `story:${tile.id}`, tile })
    }
    // 1 attraction / outdoors place
    if (aIdx < attractions.length) {
      const listing = attractions[aIdx++]!
      addEntry({
        kind: 'attraction',
        id: listing.id,
        key: `attraction:${listing.id}`,
        card: placeCardFromListing(listing),
        listing,
      })
    }
  }

  return feed
}

