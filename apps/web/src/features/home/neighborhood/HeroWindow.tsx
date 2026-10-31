import { Link } from 'react-router-dom'
import type { StoreWithDistance } from '@api/types'
import { getStoreRoute } from '@shared/lib/utils/navigation/routes'
import { getStoreImageUrl } from '@shared/lib/utils/storeAccessors'
import { hasPhoto, storeTypeLabel, verticalSlugForStore } from './selectHome'
import { recordVertical } from './taste'

function deliveryLine(store: StoreWithDistance): string {
  const prep = store.prepTimeMin ? `${store.prepTimeMin} min prep` : 'Local'
  if (store.deliveryEnabled && store.pickupEnabled) return `Delivery or pickup · ${prep}`
  if (store.deliveryEnabled) return `Delivers · ${prep}`
  if (store.pickupEnabled) return `Pickup · ${prep}`
  return prep
}

export function HeroWindow({ store }: { readonly store: StoreWithDistance }) {
  const href = getStoreRoute({ id: store.id, name: store.name })
  const place = [store.addressCity, store.addressState].filter(Boolean).join(', ')

  return (
    <Link
      to={href}
      className="hero-window"
      onClick={() => {
        const slug = verticalSlugForStore(store)
        if (slug) recordVertical(slug)
      }}
    >
      {hasPhoto(store) ? (
        <img src={getStoreImageUrl(store, 'hero')} alt="" />
      ) : (
        <div className="hero-fallback" />
      )}
      <div className="mt-3">
        <p className="shop-mono text-xs" style={{ color: 'var(--quiet)' }}>
          {storeTypeLabel(store)}
          {place ? ` · ${place}` : ''}
        </p>
        <h2 className="shop-display mt-1 text-3xl font-bold leading-none">{store.name}</h2>
        <p className="mt-2 text-sm" style={{ color: 'var(--quiet)' }}>{deliveryLine(store)}</p>
      </div>
    </Link>
  )
}
