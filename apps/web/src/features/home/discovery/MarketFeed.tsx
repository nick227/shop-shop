import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import { Heart, BookOpen } from 'lucide-react'
import { getItemRouteSimple, getStoreRoute } from '@shared/lib/utils/navigation/routes'
import { formatDistance } from '@shared/lib/utils/format'
import type { DirectoryListing } from '../neighborhood/DirectoryList'
import { PlaceCard } from '../neighborhood/PlaceCard'
import {
  isInCollection,
  toggleSavedCollection,
  useSavedCollection,
} from '../neighborhood/savedCollection'
import { CategoryCircles } from './CategoryCircles'
import { buildInfiniteFeed, type InfiniteFeedEntry } from './infiniteFeed'
import { marketBlocks } from './marketBlocks'
import type { DiscoveryTile, ProductTile, StoreTile, StoryTile } from './tiles'

const PAGE_SIZE = 12

function openFrom(event: MouseEvent<HTMLButtonElement>, tile: DiscoveryTile, onOpen: (tile: DiscoveryTile, anchor: DOMRect) => void) {
  const frame = event.currentTarget.querySelector('img, .product-fallback, .business-monogram')
  onOpen(tile, (frame ?? event.currentTarget).getBoundingClientRect())
}

function ProductFeedCard({ tile, onOpen }: { readonly tile: ProductTile; readonly onOpen: (tile: DiscoveryTile, anchor: DOMRect) => void }) {
  const saved = isInCollection('item', tile.id)
  return (
    <div className="feed-card-wrap is-product-cell">
      <button type="button" className="feed-product-card" onClick={(event) => openFrom(event, tile, onOpen)}>
      {tile.image ? (
        <div className="product-media-box">
          <img src={tile.image} alt="" className="product-square-img" />
          <span className="product-price-tag">{tile.price}</span>
        </div>
      ) : null}
        <div className="product-card-body">
          <strong>{tile.title}</strong>
          <p>{tile.price} · {tile.storeName}</p>
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
        className={`feed-business-card${tile.image ? ' has-photo' : ' is-quiet'}`}
        onClick={(event) => openFrom(event, tile, onOpen)}
      >
        {tile.image ? (
          <img src={tile.image} alt="" className="feed-business-img" />
        ) : null}
        <div className="feed-business-body">
          <strong>{tile.name}</strong>
          <p>{tile.typeLabel}{distance}</p>
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
      className="feed-story-card is-wide-cell"
      onClick={(event) => openFrom(event, tile, onOpen)}
    >
      {tile.image ? <img src={tile.image} alt="" className="feed-story-img" /> : null}
      <div className="feed-story-body">
        <span className="story-kicker-pill">
          <BookOpen className="h-3.5 w-3.5" />
          {tile.kicker ?? 'Local story'}
        </span>
        <strong>{tile.title}</strong>
        <p>{tile.body}</p>
        {tile.storeName ? <span className="story-attribution">From {tile.storeName}</span> : null}
      </div>
    </button>
  )
}

function BandArt({ image, label }: { readonly image?: string; readonly label: string }) {
  if (image) return <img src={image} alt="" />
  return (
    <div className="feed-band-monogram" aria-hidden="true">
      <span>{label.slice(0, 2).toUpperCase()}</span>
    </div>
  )
}

function BandCopy({ kicker, title, detail }: { readonly kicker: string; readonly title: string; readonly detail?: string }) {
  return (
    <div className="feed-band-copy">
      <p className="tile-kicker">{kicker}</p>
      <strong>{title}</strong>
      {detail ? <p className="feed-detail">{detail}</p> : null}
    </div>
  )
}

function renderMixedEntry(
  entry: InfiniteFeedEntry,
  onOpen: (tile: DiscoveryTile, anchor: DOMRect) => void,
) {
  if (entry.kind === 'product') return <ProductFeedCard key={entry.key} tile={entry.tile} onOpen={onOpen} />
  if (entry.kind === 'store') return <StoreFeedCard key={entry.key} tile={entry.tile} onOpen={onOpen} />
  if (entry.kind === 'story') return <StoryFeedCard key={entry.key} tile={entry.tile} onOpen={onOpen} />
  const isAttraction = entry.kind === 'attraction'
  return (
    <div key={entry.key} className={`feed-place-cell${isAttraction ? ' is-attraction-cell' : ' is-directory-cell'}`}>
      <PlaceCard
        variant={isAttraction ? 'attraction' : 'business'}
        place={entry.card}
      />
    </div>
  )
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

  const allBlocks = marketBlocks(tiles, nearest)
  const blocks = showCategories ? allBlocks : allBlocks.filter((block) => block.type !== 'circles')
  if (blocks.length === 0 && mixedEntries.length === 0) return null

  const visibleEntries = mixedEntries.slice(0, visibleCount)
  const hasMore = visibleCount < mixedEntries.length
  const credit = listings.find((listing) => listing.attribution)?.attribution

  return (
    <section className="market-feed surface-band" id="market" aria-label="Infinite Discovery Feed">
      <div className="surface-head">
        <h2 className="surface-title">Discover</h2>
      </div>
      {showCategories ? <CategoryCircles /> : null}
      {blocks.slice(0, 1).map((block) => {
        if (block.type === 'statement' && block.image) {
          return (
            <section key={block.id} className="feed-band">
              <BandArt image={block.image} label={block.label} />
              <BandCopy kicker={block.kicker} title={block.text} />
            </section>
          )
        }
        if (block.type === 'callout' && block.tile.image) {
          return (
            <button key={block.tile.id} type="button" className="feed-band" onClick={(event) => openFrom(event, block.tile, onOpen)}>
              <BandArt image={block.tile.image} label={block.tile.title} />
              <BandCopy kicker="Specials" title={block.tile.title} detail={`${block.tile.price} · ${block.tile.storeName}`} />
            </button>
          )
        }
        if (block.type === 'hero' && block.tile.image) {
          const distance = block.tile.distance != undefined ? formatDistance(block.tile.distance) : 'Nearby'
          return (
            <button key={block.tile.id} type="button" className="feed-band" onClick={(event) => openFrom(event, block.tile, onOpen)}>
              <BandArt image={block.tile.image} label={block.tile.name} />
              <BandCopy kicker={block.tile.typeLabel} title={block.tile.name} detail={distance} />
            </button>
          )
        }
        return null
      })}
      {visibleEntries.length > 0 ? (
        <div className="discovery-mixed-grid">
          {visibleEntries.map((entry) => renderMixedEntry(entry, onOpen))}
        </div>
      ) : null}
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
      {credit ? <p className="discover-lede">{credit}</p> : null}
    </section>
  )
}
