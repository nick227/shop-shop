import { Link, useSearchParams } from 'react-router-dom'
import type { StoreWithDistance } from '@api/types'
import type { RiverPost } from '@api/types'
import { getStoreRoute } from '@shared/lib/utils/navigation/routes'
import { getStoreImageUrl } from '@shared/lib/utils/storeAccessors'
import { hasPhoto, storeTypeLabel, verticalSlugForStore } from './selectHome'
import { recordVertical } from './taste'
import { placeTarget } from '../shell/placeMemory'

function remember(store: StoreWithDistance) {
  const slug = verticalSlugForStore(store)
  if (slug) recordVertical(slug)
}

export function StoreMosaic({
  stores,
  title,
  caption,
}: {
  readonly stores: readonly StoreWithDistance[]
  readonly title: string
  readonly caption: string
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
      </div>
      <div className="mosaic">
        {stores.map((store) => {
          const place = [store.addressCity, store.addressState].filter(Boolean).join(', ')
          return (
            <Link
              key={store.id}
              to={placeTarget(getStoreRoute({ id: store.id, name: store.name }), params.toString())}
              onClick={() => remember(store)}
            >
              {hasPhoto(store) ? (
                <img src={getStoreImageUrl(store, 'standard')} alt="" />
              ) : (
                <div className="tile-fallback" />
              )}
              <p className="mt-2 text-sm font-semibold leading-tight">{store.name}</p>
              <p className="mt-1 text-xs" style={{ color: 'var(--quiet)' }}>
                {storeTypeLabel(store)}
                {place ? ` · ${place}` : ''}
              </p>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

export function StoryStrip({ posts }: { readonly posts: readonly RiverPost[] }) {
  const [params] = useSearchParams()
  const visible = posts.filter((post) => post.media?.[0]?.url || post.mediaUrls?.[0]?.url)
  if (visible.length === 0) return null

  return (
    <section>
      <div className="section-head">
        <div>
          <h2>From the block</h2>
        </div>
      </div>
      <div className="shelf-row">
        {visible.map((post) => {
          const image = post.media?.[0]?.url ?? post.mediaUrls?.[0]?.url
          const href = post.storeId
            ? getStoreRoute({ id: post.storeId, name: post.storeName ?? 'Store' })
            : '/search'
          return (
            <Link key={post.id} to={placeTarget(href, params.toString())} className="story-tile">
              {image ? <img src={image} alt="" /> : <div className="tile-fallback" />}
              <p className="mt-2 line-clamp-2 text-sm font-semibold">{post.storeName ?? 'Store'}</p>
              {post.content ? (
                <p className="mt-1 line-clamp-2 text-xs" style={{ color: 'var(--quiet)' }}>{post.content}</p>
              ) : null}
            </Link>
          )
        })}
      </div>
    </section>
  )
}
