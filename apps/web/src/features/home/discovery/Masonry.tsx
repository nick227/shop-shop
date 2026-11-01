import { formatDistance } from '@shared/lib/utils/format'
import type { DiscoveryTile } from './tiles'

function Frame({ image, label, tall }: { readonly image?: string; readonly label: string; readonly tall?: boolean }) {
  if (image) return <img src={image} alt="" className={tall ? 'tile-tall' : 'tile-photo'} />
  return <div className={tall ? 'brand-fall tile-tall' : 'brand-fall tile-photo'} aria-hidden="true"><span>{label.slice(0, 1)}</span></div>
}

export function Masonry({
  tiles,
  onOpen,
}: {
  readonly tiles: readonly DiscoveryTile[]
  readonly onOpen: (tile: DiscoveryTile, anchor: DOMRect) => void
}) {
  if (tiles.length === 0) {
    return <p className="discover-empty">Nothing in this corner yet. Try another type, or widen the neighborhood.</p>
  }
  return (
    <div className="masonry" id="market">
      {tiles.map((tile) => (
        <button
          key={`${tile.kind}-${tile.id}`}
          type="button"
          className={`masonry-card is-${tile.kind}`}
          onClick={(event) => {
            const frame = event.currentTarget.querySelector('img, .brand-fall')
            onOpen(tile, (frame ?? event.currentTarget).getBoundingClientRect())
          }}
        >
          {tile.kind === 'story' ? (
            <>
              <Frame image={tile.image} label={tile.title} tall />
              <p className="tile-kicker">{tile.kicker}</p>
              <strong>{tile.title}</strong>
              <p>{tile.body}</p>
            </>
          ) : null}
          {tile.kind === 'store' ? (
            <>
              <Frame image={tile.image} label={tile.name} />
              <strong>{tile.name}</strong>
              <p>{tile.typeLabel}{tile.distance != undefined ? ` · ${formatDistance(tile.distance)}` : ''}</p>
            </>
          ) : null}
          {tile.kind === 'product' ? (
            <>
              <Frame image={tile.image} label={tile.title} tall />
              <strong>{tile.title}</strong>
              <p>{tile.price} · {tile.storeName}</p>
            </>
          ) : null}
        </button>
      ))}
    </div>
  )
}
