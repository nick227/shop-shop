import { Link, useSearchParams } from 'react-router-dom'
import type { StoreWithDistance } from '@api/types'
import { STORE_TYPE_CONFIG } from '@features/search/config/storeTypes'
import { getStoreImageUrl } from '@shared/lib/utils/storeAccessors'
import { hasPhoto } from './selectHome'
import { recordVertical } from './taste'

export function TypePlates({ stores }: { readonly stores: readonly StoreWithDistance[] }) {
  const [params] = useSearchParams()
  const plates = STORE_TYPE_CONFIG.filter((type) => type.slug)
  const photos = stores.filter(hasPhoto)

  return (
    <section aria-label="Shop by type">
      <div className="section-head">
        <h2>Shop by type</h2>
      </div>
      <div className="plate-grid">
        {plates.map((plate, index) => {
          const next = new URLSearchParams(params)
          next.set('browse', plate.slug)
          next.delete('q')
          const photo = photos[index % Math.max(photos.length, 1)]
          const src = photo ? getStoreImageUrl(photo, 'square') : undefined
          return (
            <Link
              key={plate.slug}
              to={{ pathname: '/search', search: next.toString() }}
              className="plate"
              onClick={() => recordVertical(plate.slug)}
            >
              {src ? <img src={src} alt="" /> : <div className="tile-fallback" />}
              <strong>{plate.label}</strong>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
