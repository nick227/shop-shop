import type { MouseEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ItemResponse, StoreWithDistance } from '@api/types'
import { useRecentViews } from '../neighborhood/recentViews'
import type { HomeOrder, SavedItem, SavedStore } from '../neighborhood/signedInSelect'
import type { DiscoveryTile } from './tiles'
import { shoppingFeed } from './recentShopping'

function Face({ image, label }: { readonly image?: string; readonly label: string }) {
  if (image) return <img src={image} alt="" className="tile-tall" />
  return <div className="brand-fall tile-tall" aria-hidden="true"><span>{label.slice(0, 1)}</span></div>
}

export function RecentFeed({
  orders,
  savedItems,
  savedStores,
  stores,
  products,
  tiles,
  onOpen,
}: {
  readonly orders: readonly HomeOrder[]
  readonly savedItems: readonly SavedItem[]
  readonly savedStores: readonly SavedStore[]
  readonly stores: readonly StoreWithDistance[]
  readonly products: readonly ItemResponse[]
  readonly tiles: readonly DiscoveryTile[]
  readonly onOpen: (tile: DiscoveryTile, anchor?: DOMRect) => void
}) {
  const navigate = useNavigate()
  const views = useRecentViews()
  const feed = shoppingFeed({ views, orders, savedItems, savedStores, stores, products })

  const open = (id: string, kind: 'item' | 'store', path: string, event: MouseEvent<HTMLButtonElement>) => {
    const tile = tiles.find((entry) => entry.id === id && (kind === 'item' ? entry.kind === 'product' : entry.kind === 'store'))
    if (!tile) {
      navigate(path)
      return
    }
    const frame = event.currentTarget.querySelector('img, .brand-fall')
    onOpen(tile, (frame ?? event.currentTarget).getBoundingClientRect())
  }

  return (
    <section className="recent-feed" aria-label="Your shopping">
      <p className="tile-kicker">Your shopping</p>
      <h2>Recent</h2>
      {feed.length === 0 ? (
        <p className="discover-lede">What you open and order collects here, and becomes the top of your feed.</p>
      ) : (
        <div className="recent-row">
          {feed.map((view) => (
            <button key={`${view.kind}-${view.id}`} type="button" className="portrait-card" onClick={(event) => open(view.id, view.kind, view.path, event)}>
              <Face image={view.imageUrl} label={view.title} />
              <strong>{view.title}</strong>
              {view.subtitle ? <p>{view.subtitle}</p> : null}
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
