/**
 * Newest marketplace kitchens — compact card grid.
 */
import { Link, useNavigate } from 'react-router-dom'
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
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">New kitchens</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">Recently joined the marketplace.</p>
        </div>
        <Link
          to="/search"
          className="shrink-0 text-sm font-medium text-primary hover:underline"
        >
          View all →
        </Link>
      </div>

      {isLoading ? (
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="aspect-[16/10] animate-pulse bg-muted" />
              <div className="space-y-2 p-3">
                <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
              </div>
            </div>
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
