import { Link } from 'react-router-dom'
import type { ItemResponse, StoreWithDistance } from '@api/types'
import { getItemRouteSimple } from '@shared/lib/utils/navigation/routes'
import { formatCurrency, formatDistance } from '@shared/lib/utils/format'
import { resolvePrimaryImageUrl } from '@shared/lib/utils/image'
import { useCartStore } from '@stores/cartStore'
import { StoreShelf } from './Shelves'
import {
  deliversToDoor,
  deliveryAddress,
  orderAgainViews,
  savedViews,
} from './signedInSelect'
import type { useSignedInHome } from './useSignedInHome'
import { ViewShelf } from './ViewShelf'
import type { RecentView } from './recentViews'

type Account = ReturnType<typeof useSignedInHome>

interface CartLine {
  readonly itemId?: string | null
  readonly titleSnapshot?: string
  readonly unitPrice?: number | string
  readonly item?: {
    readonly title?: string
    readonly imageUrl?: string
    readonly price?: string | number
    readonly mediaAssets?: readonly { readonly url: string; readonly kind?: string }[]
  }
}

function asRows(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw
  if (typeof raw !== 'string') return []
  try {
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function cartViews(
  raw: unknown,
  storeId: string | undefined,
  stores: readonly StoreWithDistance[],
): RecentView[] {
  const merchant = stores.find((store) => store.id === storeId)
  const views: RecentView[] = []
  for (const row of asRows(raw)) {
    if (!row || typeof row !== 'object') continue
    const line = row as CartLine
    if (!line.itemId) continue
    const title = line.titleSnapshot ?? line.item?.title ?? 'Item'
    const photo = line.item
      ? resolvePrimaryImageUrl(
          line.item.imageUrl,
          line.item.mediaAssets?.map((asset) => ({ url: asset.url, kind: asset.kind ?? 'IMAGE' })),
        )
      : undefined
    views.push({
      id: line.itemId,
      kind: 'item',
      title,
      imageUrl: photo,
      subtitle: [line.unitPrice !== undefined ? formatCurrency(line.unitPrice) : undefined, merchant?.name]
        .filter(Boolean)
        .join(' · '),
      path: getItemRouteSimple({ id: line.itemId, title }),
    })
  }
  return views
}

export function SignedInShelves({
  account,
  stores,
  products,
  hasPlace,
}: {
  readonly account: Account
  readonly stores: readonly StoreWithDistance[]
  readonly products: readonly ItemResponse[]
  readonly hasPlace: boolean
}) {
  const cart = useCartStore((state) => state.cart)
  const cartStoreId = cart?.storeId
  const cartInPlace = !hasPlace || stores.some((store) => store.id === cartStoreId)
  const openCart = cartInPlace ? cartViews(cart?.items, cartStoreId, stores) : []
  const again = account.enabled ? orderAgainViews(account.orders, stores, products) : []
  const saved = account.enabled ? savedViews(account.favorites.items, account.favorites.stores, stores) : []
  const door = deliveryAddress(account.addresses)
  const delivering = account.enabled ? deliversToDoor(stores, door) : []
  const doorLabel = door?.line1 ?? door?.postalCode

  return (
    <>
      <ViewShelf
        title="In your cart"
        views={openCart}
        action={<Link to="/cart" className="min-h-11 text-sm" style={{ color: 'var(--quiet)' }}>Go to cart</Link>}
      />
      <ViewShelf title="Order again" views={again} />
      <ViewShelf title="Saved" views={saved} />
      {doorLabel && delivering.length > 0 ? (
        <StoreShelf
          title={`Delivers to ${doorLabel}`}
          caption=""
          stores={delivering.map((row) => row.store)}
          detail={(store) => {
            const row = delivering.find((entry) => entry.store.id === store.id)
            return row ? formatDistance(row.miles) : ''
          }}
        />
      ) : null}
    </>
  )
}
