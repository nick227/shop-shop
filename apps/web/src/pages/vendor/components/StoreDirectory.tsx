import { useMemo, useState } from 'react'
import { SearchInput, SegmentedControl } from '@shared/ui/primitives'
import { storePlace, storeStatus } from '@layouts/VendorLayout/storeStatus'
import type { VendorStore } from '@shared/hooks/hooks/vendor'
import { StoreDirectoryRow } from './StoreDirectoryRow'

type StatusFilter = 'all' | 'published' | 'draft'

interface StoreDirectoryProps {
  readonly stores: readonly VendorStore[]
  readonly currentStoreId: string
  readonly onOpen: (storeId: string) => void
  readonly onSettings: (storeId: string) => void
}

function storeMeta(store: VendorStore): string {
  return [storeStatus(store).label, storePlace(store)].filter(Boolean).join(' · ')
}

function matchesQuery(store: VendorStore, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return store.name.toLowerCase().includes(q) || (store.description ?? '').toLowerCase().includes(q)
}

function matchesStatus(store: VendorStore, filter: StatusFilter): boolean {
  if (filter === 'published') return Boolean(store.isPublished)
  if (filter === 'draft') return !store.isPublished
  return true
}

export function StoreDirectory({ stores, currentStoreId, onOpen, onSettings }: StoreDirectoryProps) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')

  const publishedCount = stores.filter((store) => store.isPublished).length
  const filters = [
    { id: 'all', label: 'All', count: stores.length },
    { id: 'published', label: 'Published', count: publishedCount },
    { id: 'draft', label: 'Drafts', count: stores.length - publishedCount },
  ] as const

  const visible = useMemo(
    () =>
      [...stores]
        .filter((store) => matchesQuery(store, query) && matchesStatus(store, status))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [stores, query, status],
  )

  const filterEmptyLabel = status === 'published' ? 'No published stores.' : 'No drafts.'
  const emptyLabel = query.trim() ? `No stores match “${query.trim()}”.` : filterEmptyLabel

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SegmentedControl label="Store status" items={filters} value={status} onChange={setStatus} />
        <div className="w-full sm:w-64">
          <SearchInput
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search stores"
            aria-label="Search stores"
          />
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="border-y border-border py-8 text-sm text-muted-foreground">{emptyLabel}</p>
      ) : (
        <ul className="border-t border-border">
          {visible.map((store) => (
            <StoreDirectoryRow
              key={store.id}
              store={store}
              meta={storeMeta(store)}
              isCurrent={store.id === currentStoreId}
              onOpen={() => onOpen(store.id)}
              onSettings={() => onSettings(store.id)}
            />
          ))}
        </ul>
      )}
    </div>
  )
}
