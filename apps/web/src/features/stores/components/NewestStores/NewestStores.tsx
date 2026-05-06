/**
 * Newest marketplace kitchens — compact card grid.
 */
import { useNavigate } from 'react-router-dom'
import { useNewestStores } from '@shared/hooks/hooks/store'
import { StoreCard } from '../StoreCard'
import { getStoreRoute } from '@shared/lib/utils/navigation/routes'
import type { StoreWithDistance } from '@api/types'

export function NewestStores() {
  const navigate = useNavigate()
  const { data: stores, isLoading } = useNewestStores(8)

  const handleStore = (store: StoreWithDistance) => {
    navigate(getStoreRoute({ id: store.id, name: store.name }))
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-4 sm:p-6">
      <h2 className="text-lg font-semibold tracking-tight text-foreground">New kitchens</h2>
      <p className="mt-1 text-sm text-muted-foreground">Recently joined the marketplace.</p>
      {isLoading ? (
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[16/10] animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          {(stores ?? []).map((store) => (
            <StoreCard key={store.id} store={store} onClick={handleStore} />
          ))}
        </div>
      )}
    </section>
  )
}
