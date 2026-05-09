/**
 * Newest marketplace kitchens — compact card grid.
 */
import { useNavigate } from 'react-router-dom'
import { useNewestStores } from '@shared/hooks/hooks/store'
import { StoreCard } from '../StoreCard'
import { getStoreRoute } from '@shared/lib/utils/navigation/routes'
import type { StoreWithDistance } from '@api/types'
import { usePublicMediaList } from '@shared/hooks/hooks/vendor/usePublicMediaList'
import { getStoreImageUrl } from '@shared/lib/utils/storeAccessors'

function NewestStoreCardWithMedia({ store, onClick }: { readonly store: StoreWithDistance; readonly onClick: (store: StoreWithDistance) => void }) {
  const { data: storeMedia } = usePublicMediaList({ storeId: store.id })
  const primaryImage = storeMedia?.find((m) => m.kind === 'IMAGE' || !m.kind)?.url

  return (
    <StoreCard
      store={{
        ...store,
        imageUrl: primaryImage ?? store.imageUrl ?? getStoreImageUrl(store, 'standard'),
      }}
      onClick={onClick}
    />
  )
}

export function NewestStores() {
  const navigate = useNavigate()
  const { data: stores, isLoading } = useNewestStores(8)

  const handleStore = (store: StoreWithDistance) => {
    navigate(getStoreRoute({ id: store.id, name: store.name }))
  }

  return (
    <section className="p-4 rounded-2xl border border-border bg-card sm:p-6">
      <div className="flex gap-4 justify-between items-start">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">New kitchens</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">Recently joined the marketplace.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 mt-4 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="aspect-[16/10] animate-pulse bg-muted" />
              <div className="p-3 space-y-2">
                <div className="w-3/4 h-4 rounded animate-pulse bg-muted" />
                <div className="w-1/2 h-3 rounded animate-pulse bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 mt-4 md:grid-cols-4">
          {(stores ?? []).map((store) => (
            <NewestStoreCardWithMedia key={store.id} store={store} onClick={handleStore} />
          ))}
        </div>
      )}
    </section>
  )
}
