import type { MouseEvent } from 'react'
import { formatDistance } from '@shared/lib/utils/format'
import { CategoryCircles } from './CategoryCircles'
import { marketBlocks } from './marketBlocks'
import type { DiscoveryTile, ProductTile, StoreTile } from './tiles'

function Face({ image, label, tall }: { readonly image?: string; readonly label: string; readonly tall?: boolean }) {
  if (image) return <img src={image} alt="" className={tall ? 'tile-tall' : 'tile-photo'} />
  return <div className={tall ? 'brand-fall tile-tall' : 'brand-fall tile-photo'} aria-hidden="true"><span>{label.slice(0, 1)}</span></div>
}

function openFrom(event: MouseEvent<HTMLButtonElement>, tile: DiscoveryTile, onOpen: (tile: DiscoveryTile, anchor: DOMRect) => void) {
  const frame = event.currentTarget.querySelector('img, .brand-fall')
  onOpen(tile, (frame ?? event.currentTarget).getBoundingClientRect())
}

function Portrait({ tile, onOpen }: { readonly tile: ProductTile; readonly onOpen: (tile: DiscoveryTile, anchor: DOMRect) => void }) {
  return (
    <button type="button" className="portrait-card" onClick={(event) => openFrom(event, tile, onOpen)}>
      <Face image={tile.image} label={tile.title} tall />
      <strong>{tile.title}</strong>
      <p>{tile.price} · {tile.storeName}</p>
    </button>
  )
}

function Feature({ tile, onOpen }: { readonly tile: StoreTile; readonly onOpen: (tile: DiscoveryTile, anchor: DOMRect) => void }) {
  return (
    <button type="button" className="feature-hero" onClick={(event) => openFrom(event, tile, onOpen)}>
      <Face image={tile.image} label={tile.name} />
      <span>
        <p className="tile-kicker">{tile.typeLabel}</p>
        <strong>{tile.name}</strong>
        <p>{tile.distance != undefined ? formatDistance(tile.distance) : 'Nearby'}</p>
      </span>
    </button>
  )
}

export function MarketFeed({
  tiles,
  nearest,
  onOpen,
}: {
  readonly tiles: readonly DiscoveryTile[]
  readonly nearest: readonly StoreTile[]
  readonly onOpen: (tile: DiscoveryTile, anchor: DOMRect) => void
}) {
  const blocks = marketBlocks(tiles, nearest)
  if (blocks.length === 1) {
    return (
      <>
        <CategoryCircles />
        <p className="discover-empty">Nothing in this corner yet. Try another type, or widen the neighborhood.</p>
      </>
    )
  }
  return (
    <div className="market-feed" id="market">
      {blocks.map((block) => {
        if (block.type === 'circles') return <CategoryCircles key="circles" />
        if (block.type === 'statement') {
          return (
            <section key={block.id} className="feed-say">
              <p className="tile-kicker">{block.kicker}</p>
              <h2>{block.text}</h2>
            </section>
          )
        }
        if (block.type === 'callout') {
          return (
            <button key={block.tile.id} type="button" className="feed-special" onClick={(event) => openFrom(event, block.tile, onOpen)}>
              <p className="tile-kicker">Specials</p>
              <strong>{block.tile.title}</strong>
              <p>{block.tile.price} · {block.tile.storeName}</p>
            </button>
          )
        }
        if (block.type === 'hero') return <Feature key={block.tile.id} tile={block.tile} onOpen={onOpen} />
        return (
          <div key={block.id} className="portrait-grid">
            {block.tiles.map((tile) => <Portrait key={tile.id} tile={tile} onOpen={onOpen} />)}
          </div>
        )
      })}
    </div>
  )
}
