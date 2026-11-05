import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { getItemRouteSimple, getStoreRoute } from '@shared/lib/utils/navigation/routes'
import { formatDistance } from '@shared/lib/utils/format'
import type { DirectoryListing } from '../neighborhood/DirectoryList'
import {
  isInCollection,
  toggleSavedCollection,
  useSavedCollection,
} from '../neighborhood/savedCollection'
import { CategoryCircles } from './CategoryCircles'
import { buildInfiniteFeed, type InfiniteFeedEntry } from './infiniteFeed'
import type { DiscoveryTile, ProductTile, StoreTile, StoryTile } from './tiles'

const PAGE_SIZE = 16

function openFrom(event: MouseEvent<HTMLButtonElement>, tile: DiscoveryTile, onOpen: (tile: DiscoveryTile, anchor: DOMRect) => void) {
  const frame = event.currentTarget.querySelector('img, .product-fallback, .business-monogram')
  onOpen(tile, (frame ?? event.currentTarget).getBoundingClientRect())
}

function ProductFeedCard({ tile, onOpen }: { readonly tile: ProductTile; readonly onOpen: (tile: DiscoveryTile, anchor: DOMRect) => void }) {
  const saved = isInCollection('item', tile.id)
  return (
    <div className="feed-card-wrap is-product-cell">
      <button
        type="button"
        className={`feed-product-card${tile.image ? ' has-photo' : ' is-typographic'}`}
        onClick={(event) => openFrom(event, tile, onOpen)}
      >
        {tile.image ? (
          <div className="product-media-box">
            <img src={tile.image} alt="" className="product-square-img" />
            <span className="product-price-tag">{tile.price}</span>
          </div>
        ) : (
          <div className="product-typo-head">
            <span className="product-store-kicker">{tile.storeName}</span>
            <span className="product-price-pill">{tile.price}</span>
          </div>
        )}
        <div className="product-card-body">
          <strong>{tile.title}</strong>
          <p>{tile.storeName}</p>
          <span className="product-add">{tile.price} · Add</span>
          {tile.credit ? <span className="media-credit">{tile.credit}</span> : null}
        </div>
      </button>
      <button
        type="button"
        className={saved ? 'card-save is-saved' : 'card-save'}
        aria-label={saved ? `Remove ${tile.title} from collection` : `Save ${tile.title} to collection`}
        aria-pressed={saved}
        onClick={() =>
          toggleSavedCollection({
            id: tile.id,
            kind: 'item',
            title: tile.title,
            subtitle: `${tile.price} · ${tile.storeName}`,
            imageUrl: tile.image,
            path: getItemRouteSimple({ id: tile.id, title: tile.title }),
          })
        }
      >
        <Heart className="h-4 w-4" fill={saved ? 'currentColor' : 'none'} />
      </button>
    </div>
  )
}

function StoreFeedCard({ tile, onOpen }: { readonly tile: StoreTile; readonly onOpen: (tile: DiscoveryTile, anchor: DOMRect) => void }) {
  const saved = isInCollection('store', tile.id)
  const distance = tile.distance != undefined ? ` · ${formatDistance(tile.distance)}` : ''
  return (
    <div className={`feed-card-wrap is-business-cell${tile.image ? ' has-photo' : ' is-quiet'}`}>
      <button
        type="button"
        className="feed-business-card is-brand"
        onClick={(event) => openFrom(event, tile, onOpen)}
      >
        {tile.image ? (
          <img src={tile.image} alt="" className="feed-business-img" />
        ) : (
          <span className="store-mark" aria-hidden="true">{tile.name.slice(0, 1)}</span>
        )}
        <div className="feed-business-body">
          <span className="place-card-kicker">{tile.typeLabel}{distance}</span>
          <strong>{tile.name}</strong>
          {tile.credit ? <span className="media-credit">{tile.credit}</span> : null}
          <span className="store-action">Order</span>
        </div>
      </button>
      <button
        type="button"
        className={saved ? 'card-save is-saved' : 'card-save'}
        aria-label={saved ? `Remove ${tile.name} from collection` : `Save ${tile.name} to collection`}
        aria-pressed={saved}
        onClick={() =>
          toggleSavedCollection({
            id: tile.id,
            kind: 'store',
            title: tile.name,
            subtitle: `${tile.typeLabel}${distance}`,
            imageUrl: tile.image,
            path: getStoreRoute({ id: tile.id, name: tile.name }),
          })
        }
      >
        <Heart className="h-4 w-4" fill={saved ? 'currentColor' : 'none'} />
      </button>
    </div>
  )
}

function StoryFeedCard({ tile, onOpen }: { readonly tile: StoryTile; readonly onOpen: (tile: DiscoveryTile, anchor: DOMRect) => void }) {
  return (
    <button
      type="button"
      className={`feed-story-card${tile.image ? ' has-photo' : ' is-typographic'}`}
      onClick={(event) => openFrom(event, tile, onOpen)}
    >
      <div className="feed-story-body">
        <span className="story-kicker-pill">{tile.kicker ?? 'Local story'}</span>
        <strong>{tile.title}</strong>
        <p>{tile.body}</p>
        {tile.credit ? <span className="media-credit">{tile.credit}</span> : null}
        <span className="story-read">Read</span>
      </div>
      {tile.image ? <img src={tile.image} alt="" className="feed-story-img" /> : null}
    </button>
  )
}

function DirectoryFeedCard({ listing }: { readonly listing: DirectoryListing }) {
  const miles = listing.distance == null ? null : `${listing.distance.toFixed(1)} mi`
  const directions = listing.latitude != null && listing.longitude != null
    ? `https://www.google.com/maps/dir/?api=1&destination=${listing.latitude},${listing.longitude}`
    : null
  return (
    <article className="directory-row">
      <Link className="directory-row-name" to={`/directory/${listing.slug}`}>
        <strong>{listing.name}</strong>
        <span>{[listing.categoryLabel, listing.addressStreet, miles].filter(Boolean).join(' · ')}</span>
      </Link>
      <span className="directory-row-actions">
        {listing.phone ? <a href={`tel:${listing.phone}`}>Call</a> : null}
        {directions ? <a href={directions} target="_blank" rel="noreferrer">Directions</a> : null}
        {listing.website ? <a href={listing.website} target="_blank" rel="noreferrer">Website</a> : null}
      </span>
    </article>
  )
}

type EditorialRow =
  | { readonly kind: 'products'; readonly key: string; readonly items: readonly (InfiniteFeedEntry & { readonly kind: 'product' })[] }
  | { readonly kind: 'story'; readonly key: string; readonly item: InfiniteFeedEntry & { readonly kind: 'story' } }
  | { readonly kind: 'stores'; readonly key: string; readonly items: readonly (InfiniteFeedEntry & { readonly kind: 'store' })[] }
  | { readonly kind: 'directory'; readonly key: string; readonly items: readonly (InfiniteFeedEntry & { readonly kind: 'directory' | 'attraction' })[] }

function takeRow<T>(items: readonly T[], index: number, size: number): { readonly slice: readonly T[]; readonly next: number } | undefined {
  if (index >= items.length) return undefined
  const slice = items.slice(index, index + size)
  if (slice.length === 0) return undefined
  return { slice, next: index + slice.length }
}

function groupIntoEditorialRows(entries: readonly InfiniteFeedEntry[]): readonly EditorialRow[] {
  const products = entries.filter((entry): entry is InfiniteFeedEntry & { readonly kind: 'product' } => entry.kind === 'product')
  const stories = entries.filter((entry): entry is InfiniteFeedEntry & { readonly kind: 'story' } => entry.kind === 'story')
  const stores = entries.filter((entry): entry is InfiniteFeedEntry & { readonly kind: 'store' } => entry.kind === 'store')
  const directory = entries.filter((entry): entry is InfiniteFeedEntry & { readonly kind: 'directory' | 'attraction' } => entry.kind === 'directory' || entry.kind === 'attraction')

  const rows: EditorialRow[] = []
  let pIdx = 0
  let sIdx = 0
  let storeIdx = 0
  let dirIdx = 0
  let cycle = 0

  while (pIdx < products.length || sIdx < stories.length || storeIdx < stores.length || dirIdx < directory.length) {
    const productRow = takeRow(products, pIdx, 4)
    if (productRow) {
      pIdx = productRow.next
      rows.push({ kind: 'products', key: `row-products-${cycle}`, items: productRow.slice })
    }
    const storeRow = takeRow(stores, storeIdx, 2)
    if (storeRow) {
      storeIdx = storeRow.next
      rows.push({ kind: 'stores', key: `row-stores-${cycle}`, items: storeRow.slice })
    }
    const story = stories[sIdx]
    if (story) {
      sIdx += 1
      rows.push({ kind: 'story', key: `row-story-${story.key}`, item: story })
    }
    const directoryRow = takeRow(directory, dirIdx, 3)
    if (directoryRow) {
      dirIdx = directoryRow.next
      rows.push({ kind: 'directory', key: `row-directory-${cycle}`, items: directoryRow.slice })
    }
    cycle += 1
    if (cycle > entries.length + 2) break
  }

  return rows
}

export function MarketFeed({
  tiles,
  nearest,
  storeTiles,
  stories = [],
  listings = [],
  browse = '',
  query = '',
  excludeIds,
  onOpen,
  showCategories = true,
}: {
  readonly tiles: readonly DiscoveryTile[]
  readonly nearest: readonly StoreTile[]
  readonly storeTiles?: readonly StoreTile[]
  readonly stories?: readonly StoryTile[]
  readonly listings?: readonly DirectoryListing[]
  readonly browse?: string
  readonly query?: string
  readonly excludeIds?: ReadonlySet<string>
  readonly onOpen: (tile: DiscoveryTile, anchor: DOMRect) => void
  readonly showCategories?: boolean
}) {
  useSavedCollection()
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  const mixedEntries = useMemo(
    () =>
      buildInfiniteFeed({
        tiles,
        storeTiles: storeTiles ?? nearest,
        stories,
        listings,
        browse,
        query,
        excludeIds,
      }),
    [browse, excludeIds, listings, nearest, query, storeTiles, stories, tiles],
  )

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [browse, query])

  useEffect(() => {
    const node = sentinelRef.current
    if (!node || typeof IntersectionObserver === 'undefined') return
    if (visibleCount >= mixedEntries.length) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, mixedEntries.length))
        }
      },
      { rootMargin: '240px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [mixedEntries.length, visibleCount])

  if (mixedEntries.length === 0) return null

  const visibleEntries = mixedEntries.slice(0, visibleCount)
  const editorialRows = groupIntoEditorialRows(visibleEntries)
  const hasMore = visibleCount < mixedEntries.length
  const credit = listings.find((listing) => listing.attribution)?.attribution

  return (
    <section className="market-feed surface-band" id="market" aria-label="Infinite Discovery Feed">
      <div className="surface-head">
        <div className="surface-head-titles">
          <p className="tile-kicker">Local Marketplace &amp; Guide</p>
          <h2 className="surface-title">Discover</h2>
        </div>
        <p className="surface-note">Products, neighborhood businesses, and local places.</p>
      </div>
      {showCategories ? <CategoryCircles /> : null}
      <div className="discovery-mixed-grid">
        {editorialRows.map((row) => {
          if (row.kind === 'products') {
            return (
              <div key={row.key} className={`feed-row-products cols-${row.items.length}`}>
                {row.items.map((entry) => (
                  <ProductFeedCard key={entry.key} tile={entry.tile} onOpen={onOpen} />
                ))}
              </div>
            )
          }
          if (row.kind === 'story') {
            return (
              <div key={row.key} className="feed-row-story">
                <StoryFeedCard tile={row.item.tile} onOpen={onOpen} />
              </div>
            )
          }
          if (row.kind === 'stores') {
            return (
              <div key={row.key} className={`feed-row-places cols-${row.items.length}`}>
                {row.items.map((entry) => (
                  <StoreFeedCard key={entry.key} tile={entry.tile} onOpen={onOpen} />
                ))}
              </div>
            )
          }
          return (
            <div key={row.key} className="feed-row-directory">
              {row.items.map((entry) => (
                <DirectoryFeedCard key={entry.key} listing={entry.listing} />
              ))}
            </div>
          )
        })}
      </div>
      {hasMore ? (
        <div ref={sentinelRef} className="feed-more">
          <button
            type="button"
            className="feed-more-btn"
            onClick={() => setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, mixedEntries.length))}
          >
            More discoveries as you scroll ({mixedEntries.length - visibleCount} more)
          </button>
        </div>
      ) : null}
      {credit ? <p className="discover-credit">{credit}</p> : null}
    </section>
  )
}
