import type { ReactNode } from 'react'
import { MapPin } from 'lucide-react'
import { Skeleton } from '@shared/ui/primitives'
import { cn } from '@shared/lib/cn'
import { formatDistance } from '@shared/lib/utils/format'
import type { StoreSearchResult } from '@features/search/hooks/useUnifiedSearchApi'

function BrowseListSkeleton({ count }: Readonly<{ count: number }>) {
  return (
    <ul className="space-y-2" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <li key={i}>
          <Skeleton className="h-11 w-full rounded-lg" />
        </li>
      ))}
    </ul>
  )
}

function BrowseMatchRow({
  store,
  selected,
  nearMe,
  onSelect,
}: Readonly<{
  store: StoreSearchResult
  selected: boolean
  nearMe: boolean
  onSelect: (id: string) => void
}>) {
  return (
    <li>
      <button
        type="button"
        aria-pressed={selected}
        onClick={() => onSelect(store.id)}
        className={cn(
          'flex min-h-[2.75rem] w-full min-w-0 flex-row items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors',
          selected ? 'bg-white shadow-sm ring-1 ring-gray-200' : 'hover:bg-white/80',
        )}
      >
        <span className="min-w-0 flex-1 truncate font-medium text-gray-900">{store.name}</span>
        {nearMe && store.distance != undefined ? (
          <span className="flex shrink-0 items-center gap-0.5 text-xs tabular-nums text-gray-500">
            <MapPin className="h-3 w-3 shrink-0" aria-hidden />
            {formatDistance(store.distance)}
          </span>
        ) : undefined}
      </button>
    </li>
  )
}

export function RiverBrowseMatchColumn({
  awaitingGeo,
  geoPending,
  errorMessage,
  browseLoading,
  listSkeletonCount,
  listStores,
  selectedStoreId,
  nearMe,
  onSelectStore,
}: Readonly<{
  awaitingGeo: boolean
  geoPending: boolean
  errorMessage: string | undefined
  browseLoading: boolean
  listSkeletonCount: number
  listStores: readonly StoreSearchResult[]
  selectedStoreId: string | undefined
  nearMe: boolean
  onSelectStore: (id: string) => void
}>) {
  let body: ReactNode
  if (awaitingGeo && geoPending) {
    body = <p className="p-3 text-sm text-gray-600">Getting your location…</p>
  } else if (errorMessage) {
    body = <p className="p-3 text-sm text-red-600">{errorMessage}</p>
  } else if (browseLoading) {
    body = <BrowseListSkeleton count={listSkeletonCount} />
  } else if (listStores.length === 0) {
    body = <p className="p-3 text-sm text-gray-600">No kitchens match this filter yet.</p>
  } else {
    body = (
      <ul className="space-y-1" role="list">
        {listStores.map((s) => (
          <BrowseMatchRow
            key={s.id}
            store={s}
            selected={s.id === selectedStoreId}
            nearMe={nearMe}
            onSelect={onSelectStore}
          />
        ))}
      </ul>
    )
  }

  return (
    <div className="flex min-h-0 flex-col bg-gray-50/50">
      <div className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-gray-500">Matches</div>
      <div className="max-h-[min(420px,50vh)] flex-1 overflow-y-auto p-2">{body}</div>
    </div>
  )
}
