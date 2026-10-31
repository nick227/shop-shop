import type { ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import type { ItemResponse, StoreWithDistance } from '@api/types'
import { getItemRouteSimple, getStoreRoute } from '@shared/lib/utils/navigation/routes'
import { formatCurrency } from '@shared/lib/utils/format'
import { resolvePrimaryImageUrl } from '@shared/lib/utils/image'
import { getStoreImageUrl } from '@shared/lib/utils/storeAccessors'
import { hasPhoto, storeTypeLabel, verticalSlugForStore } from './selectHome'
import { recordVertical } from './taste'
import { placeTarget } from '../shell/placeMemory'

function storeName(item: ItemResponse, stores: readonly StoreWithDistance[]): string {
  const match = stores.find((store) => store.id === item.storeId)
  if (match) return match.name
  const named = (item as ItemResponse & { store?: string }).store
  if (named && named !== item.storeId) return named
  return 'Nearby store'
}

export function ProductShelf({
  title,
  caption,
  products,
  stores,
}: {
  readonly title: string
  readonly caption: string
  readonly products: readonly ItemResponse[]
  readonly stores: readonly StoreWithDistance[]
}) {
  const [params] = useSearchParams()
  if (products.length === 0) return null

  return (
    <section>
      <div className="section-head">
        <div>
          <h2>{title}</h2>
          {caption ? <p className="mt-1 text-sm" style={{ color: 'var(--quiet)' }}>{caption}</p> : null}
        </div>
      </div>
      <div className="shelf-row">
        {products.map((item) => {
          const photo = resolvePrimaryImageUrl(
            (item as ItemResponse & { imageUrl?: string }).imageUrl,
            item.mediaAssets,
          )
          const merchant = stores.find((store) => store.id === item.storeId)
          return (
            <Link
              key={item.id}
              to={placeTarget(getItemRouteSimple({ id: item.id, title: item.title }), params.toString())}
              className="product-tile"
              onClick={() => {
                if (!merchant) return
                const slug = verticalSlugForStore(merchant)
                if (slug) recordVertical(slug)
              }}
            >
              {photo ? <img src={photo} alt="" /> : <div className="tile-fallback" />}
              <p className="mt-2 text-sm font-medium">{formatCurrency(item.price)}</p>
              <p className="mt-1 line-clamp-2 text-sm font-medium leading-snug">{item.title}</p>
              <p className="mt-1 line-clamp-1 text-xs" style={{ color: 'var(--quiet)' }}>{storeName(item, stores)}</p>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

export function StoreShelf({
  title,
  caption,
  stores,
  action,
  detail,
}: {
  readonly title: string
  readonly caption: string
  readonly stores: readonly StoreWithDistance[]
  readonly action?: ReactNode
  readonly detail?: (store: StoreWithDistance) => string
}) {
  const [params] = useSearchParams()
  if (stores.length === 0) return null

  return (
    <section>
      <div className="section-head">
        <div>
          <h2>{title}</h2>
          {caption ? <p className="mt-1 text-sm" style={{ color: 'var(--quiet)' }}>{caption}</p> : null}
        </div>
        {action}
      </div>
      <div className="shelf-row">
        {stores.map((store) => (
          <Link
            key={store.id}
            to={placeTarget(getStoreRoute({ id: store.id, name: store.name }), params.toString())}
            className="store-tile"
            onClick={() => {
              const slug = verticalSlugForStore(store)
              if (slug) recordVertical(slug)
            }}
          >
            {hasPhoto(store) ? <img src={getStoreImageUrl(store, 'square')} alt="" /> : <div className="tile-fallback" />}
            <p className="mt-2 line-clamp-2 text-sm font-semibold leading-snug">{store.name}</p>
            <p className="mt-1 text-xs" style={{ color: 'var(--quiet)' }}>{detail ? detail(store) : storeTypeLabel(store)}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}
