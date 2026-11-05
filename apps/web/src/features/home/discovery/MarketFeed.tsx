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

function BandArt({ image, label }: { readonly image?: string; readonly label: string }) {
  if (image) return <img src={image} alt="" />
  return <div className="brand-fall" aria-hidden="true"><span>{label.slice(0, 1)}</span></div>
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

export function MarketFeed({
  tiles,
  nearest,
  onOpen,
  showCategories = true,
}: {
  readonly tiles: readonly DiscoveryTile[]
  readonly nearest: readonly StoreTile[]
  readonly onOpen: (tile: DiscoveryTile, anchor: DOMRect) => void
  readonly showCategories?: boolean
}) {
  const allBlocks = marketBlocks(tiles, nearest)
  const blocks = showCategories ? allBlocks : allBlocks.filter((block) => block.type !== 'circles')
  if (blocks.length === 0) return null

  return (
    <div className="market-feed" id="market">
      {blocks.map((block) => {
        if (block.type === 'circles') return <CategoryCircles key="circles" />
        if (block.type === 'statement') {
          return (
            <section key={block.id} className="feed-band">
              <BandArt image={block.image} label={block.label} />
              <BandCopy kicker={block.kicker} title={block.text} />
            </section>
          )
        }
        if (block.type === 'callout') {
          return (
            <button key={block.tile.id} type="button" className="feed-band" onClick={(event) => openFrom(event, block.tile, onOpen)}>
              <BandArt image={block.tile.image} label={block.tile.title} />
              <BandCopy kicker="Specials" title={block.tile.title} detail={`${block.tile.price} · ${block.tile.storeName}`} />
            </button>
          )
        }
        if (block.type === 'hero') {
          const distance = block.tile.distance != undefined ? formatDistance(block.tile.distance) : 'Nearby'
          return (
            <button key={block.tile.id} type="button" className="feed-band" onClick={(event) => openFrom(event, block.tile, onOpen)}>
              <BandArt image={block.tile.image} label={block.tile.name} />
              <BandCopy kicker={block.tile.typeLabel} title={block.tile.name} detail={distance} />
            </button>
          )
        }
        return (
          <div key={block.id} className="portrait-grid">
            {block.tiles.map((tile) => <Portrait key={tile.id} tile={tile} onOpen={onOpen} />)}
          </div>
        )
      })}
    </div>
  )
}
