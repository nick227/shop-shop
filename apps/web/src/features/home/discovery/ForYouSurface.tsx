import { resolveBrowserAssetUrl } from '@shared/lib/utils/resolveBrowserAssetUrl'
import type { MouseEvent } from 'react'
import { Heart } from 'lucide-react'
import { getStoreRoute } from '@shared/lib/utils/navigation/routes'
import { isInCollection, toggleSavedCollection, useSavedCollection } from '../neighborhood/savedCollection'
import {
  deliveryAddress,
  deliversToDoor,
  orderAgainViews,
  type HomeAddress,
  type HomeOrder,
  type SavedItem,
  type SavedStore,
} from '../neighborhood/signedInSelect'
import { useRecentViews } from '../neighborhood/recentViews'
import { useHomeTaste } from '../neighborhood/taste'
import { selectHome } from '../neighborhood/selectHome'
import type { ItemResponse, StoreWithDistance } from '@api/types'
import type { DiscoveryTile, ProductTile, StoreTile } from './tiles'
import { shoppingFeed } from './recentShopping'

export interface ForYouSuggestion {
  readonly id: string
  readonly kind: 'item' | 'store'
  readonly title: string
  readonly subtitle: string
  readonly reason: string
  readonly image?: string
  readonly path: string
  readonly tile?: DiscoveryTile
}

export function buildForYouSuggestions(input: {
  readonly tiles: readonly DiscoveryTile[]
  readonly storeTiles: readonly StoreTile[]
  readonly stores: readonly StoreWithDistance[]
  readonly products: readonly ItemResponse[]
  readonly orders: readonly HomeOrder[]
  readonly addresses: readonly HomeAddress[]
  readonly savedItems: readonly SavedItem[]
  readonly hasLocation: boolean
  readonly personalSlug?: string
}): readonly ForYouSuggestion[] {
  const suggestions: ForYouSuggestion[] = []
  const seen = new Set<string>()

  const push = (item: ForYouSuggestion) => {
    const key = `${item.kind}:${item.id}`
    if (seen.has(key)) return
    seen.add(key)
    suggestions.push(item)
  }

  // 1. Ordered before items for signed-in shoppers
  for (const view of orderAgainViews(input.orders, input.stores, input.products).slice(0, 2)) {
    const tile = input.tiles.find((entry): entry is ProductTile => entry.kind === 'product' && entry.id === view.id)
    push({
      id: view.id,
      kind: 'item',
      title: view.title,
      subtitle: view.subtitle || 'From your past orders',
      reason: 'Ordered before',
      image: tile?.image ?? view.imageUrl,
      path: view.path,
      tile,
    })
  }

  // 2. Delivers to door for signed-in shoppers with a saved address
  const doorStores = deliversToDoor(input.stores, deliveryAddress(input.addresses))
  for (const { store, miles } of doorStores.slice(0, 2)) {
    const tile = input.storeTiles.find((entry) => entry.id === store.id)
    push({
      id: store.id,
      kind: 'store',
      title: store.name,
      subtitle: `${tile?.typeLabel ?? 'Shop'} · ${miles.toFixed(1)} mi`,
      reason: 'Delivers to you',
      image: tile?.image,
      path: getStoreRoute({ id: store.id, name: store.name }),
      tile,
    })
  }

  return suggestions.slice(0, 6)
}

export function ForYouSurface({
  tiles,
  storeTiles,
  stores,
  products,
  orders,
  addresses,
  savedItems,
  savedStores = [],
  usual,
  hasLocation,
  onOpen,
}: {
  readonly tiles: readonly DiscoveryTile[]
  readonly storeTiles: readonly StoreTile[]
  readonly stores: readonly StoreWithDistance[]
  readonly products: readonly ItemResponse[]
  readonly orders: readonly HomeOrder[]
  readonly addresses: readonly HomeAddress[]
  readonly savedItems: readonly SavedItem[]
  readonly savedStores?: readonly SavedStore[]
  readonly usual?: string
  readonly hasLocation: boolean
  readonly onOpen: (tile: DiscoveryTile, anchor?: DOMRect) => void
}) {
  const taste = useHomeTaste()
  const savedLocal = useSavedCollection()
  const views = useRecentViews()
  const selection = selectHome(stores, products, taste, hasLocation)
  const personal = buildForYouSuggestions({
    tiles,
    storeTiles,
    stores,
    products,
    orders,
    addresses,
    savedItems,
    hasLocation,
    personalSlug: selection.personalSlug,
  })
  const remembered = shoppingFeed({ views, orders, savedItems, savedStores, stores, products })
  const seen = new Set(personal.map((entry) => `${entry.kind}:${entry.id}`))
  const shelf = [...personal]
  for (const entry of [...savedLocal, ...remembered]) {
    const key = `${entry.kind}:${entry.id}`
    if (seen.has(key)) continue
    seen.add(key)
    const saved = savedLocal.some((item) => item.kind === entry.kind && item.id === entry.id)
      || (entry.kind === 'item' && savedItems.some((item) => item.id === entry.id))
      || (entry.kind === 'store' && savedStores.some((store) => store.id === entry.id))
    const tile = tiles.find((item) => item.id === entry.id)
    shelf.push({
      id: entry.id,
      kind: entry.kind,
      title: entry.title,
      subtitle: entry.subtitle ?? '',
      reason: saved ? 'Saved' : 'Recent',
      image: 'imageUrl' in entry ? entry.imageUrl : undefined,
      path: entry.path,
      tile,
    })
    if (shelf.length >= 6) break
  }

  if (shelf.length === 0) return null

  const handleOpen = (entry: ForYouSuggestion, event: MouseEvent<HTMLButtonElement>) => {
    if (entry.tile) {
      const frame = event.currentTarget.querySelector('img')
      onOpen(entry.tile, (frame ?? event.currentTarget).getBoundingClientRect())
    }
  }

  return (
    <section className="personal-shelf" aria-label="For You">
      <div className="shelf-head">
        <h2 className="surface-title">For you</h2>
        {usual ? <p className="surface-note">{usual}</p> : null}
      </div>
      <div className="shelf-list">
        {shelf.map((entry) => {
          const saved = isInCollection(entry.kind, entry.id)
          return (
            <div key={`${entry.kind}-${entry.id}`} className="shelf-card-wrap">
              <button
                type="button"
                className={entry.image ? 'shelf-card' : 'shelf-card is-quiet'}
                onClick={(event) => handleOpen(entry, event)}
              >
                {entry.image ? <img src={resolveBrowserAssetUrl(entry.image)} alt="" className="shelf-thumb" /> : null}
                <span className="shelf-copy">
                  <span className="surface-pill reason-pill">{entry.reason}</span>
                  <strong>{entry.title}</strong>
                  {entry.subtitle ? <span>{entry.subtitle}</span> : null}
                </span>
              </button>
              <button
                type="button"
                className={saved ? 'card-save is-saved' : 'card-save'}
                aria-label={saved ? `Remove ${entry.title} from collection` : `Save ${entry.title} to collection`}
                aria-pressed={saved}
                onClick={() =>
                  toggleSavedCollection({
                    id: entry.id,
                    kind: entry.kind,
                    title: entry.title,
                    subtitle: entry.subtitle,
                    imageUrl: entry.image,
                    path: entry.path,
                  })
                }
              >
                <Heart className="h-4 w-4" fill={saved ? 'currentColor' : 'none'} />
              </button>
            </div>
          )
        })}
      </div>
    </section>
  )
}
