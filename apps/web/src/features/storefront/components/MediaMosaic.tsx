/**
 * MediaMosaic - the storefront's visual centerpiece: a swipeable carousel of products shoppers can open or
 * add straight away, beside the vendor's own photos, videos and product tiles.
 */
import { useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { ItemResponse } from '@api/types'
import { cn } from '@shared/lib/cn'
import type { StorefrontMedia } from '../api'
import { ProductTile } from './ProductTile'

export type ResolvedMosaicTile =
  | { readonly type: 'media'; readonly media: StorefrontMedia }
  | { readonly type: 'item'; readonly item: ItemResponse }

export function MediaMosaic({ products, tiles, storeName }: {
  readonly products: readonly ItemResponse[]
  readonly tiles: readonly ResolvedMosaicTile[]
  readonly storeName: string
}) {
  if (products.length === 0 && tiles.length === 0) return null
  return (
    <section aria-label={`${storeName} highlights`} className={cn(products.length > 0 && tiles.length > 0 && 'sf-mosaic')}>
      {products.length > 0 ? <ProductCarousel products={products} /> : null}
      {tiles.length > 0 ? (
        <div className="sf-mosaic-tiles" data-count={tiles.length}>
          {tiles.map((tile) =>
            tile.type === 'item' ? (
              <ProductTile key={`item-${tile.item.id}`} item={tile.item} variant="hero" className="min-h-[10rem]" />
            ) : (
              <MediaTile key={`media-${tile.media.id}`} media={tile.media} />
            ),
          )}
        </div>
      ) : null}
    </section>
  )
}

function MediaTile({ media }: { readonly media: StorefrontMedia }) {
  const shared = 'h-full min-h-[10rem] w-full rounded-2xl object-cover bg-muted'
  if (media.kind === 'VIDEO') {
    return (
      // Muted and looping like a photo; the controls let shoppers pause or unmute.
      <video src={media.url} className={shared} muted loop playsInline autoPlay controls aria-label={media.altText ?? 'Video'}>
        <track kind="captions" />
      </video>
    )
  }
  return <img src={media.url} alt={media.altText ?? ''} loading="lazy" className={shared} />
}

function ProductCarousel({ products }: { readonly products: readonly ItemResponse[] }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)

  const go = (next: number) => {
    const track = trackRef.current
    if (!track) return
    const bounded = (next + products.length) % products.length
    track.scrollTo({ left: bounded * track.clientWidth, behavior: 'smooth' })
    setIndex(bounded)
  }

  return (
    <div className="relative h-full" role="region" aria-roledescription="carousel" aria-label="Featured products">
      <div
        ref={trackRef}
        className="sf-row h-full"
        style={{ gridAutoColumns: '100%' }}
        onScroll={(e) => {
          const track = e.currentTarget
          if (track.clientWidth > 0) setIndex(Math.round(track.scrollLeft / track.clientWidth))
        }}
      >
        {products.map((item, i) => (
          <div key={item.id} role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${products.length}`} className="h-full">
            <ProductTile item={item} variant="hero" className="min-h-[18rem]" />
          </div>
        ))}
      </div>
      {products.length > 1 ? (
        <>
          <div className="absolute right-3 top-3 z-20 flex gap-1.5">
            <button
              type="button"
              onClick={() => go(index - 1)}
              aria-label="Previous product"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-background/90 text-foreground shadow"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => go(index + 1)}
              aria-label="Next product"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-background/90 text-foreground shadow"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          <div className="pointer-events-none absolute left-4 top-4 z-20 flex gap-1" aria-hidden>
            {products.map((item, i) => (
              <span key={item.id} className={cn('h-1.5 rounded-full bg-white/80 transition-all', i === index ? 'w-5' : 'w-1.5 opacity-60')} />
            ))}
          </div>
        </>
      ) : null}
    </div>
  )
}
