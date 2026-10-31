import { useMemo, useState } from 'react'
import { SearchInput } from '@shared/ui/primitives'
import { cn } from '@shared/lib/cn'
import type { StoreResponse } from '@api/types'
import { StoreDirectoryRow } from './StoreDirectoryRow'

type StatusFilter = 'all' | 'published' | 'draft'

interface StoreDirectoryProps {
  readonly stores: readonly StoreResponse[]
  readonly selectedStoreId: string
  readonly onSelect: (storeId: string) => void
  readonly onOpenMenu: (storeId: string) => void
  readonly onEdit: (storeId: string) => void
}

function listingStatus(store: StoreResponse): string {
  if (store.status === 'DISABLED') return 'Disabled'
  if (store.status === 'PAUSED') return 'Paused'
  if (store.isPublished) return 'Published'
  return 'Draft'
}

function storeMeta(store: StoreResponse): string {
  const place = [store.addressCity, store.addressState].filter(Boolean).join(', ')
  const status = listingStatus(store)
  return place ? `${place} · ${status}` : status
}

function matchesQuery(store: StoreResponse, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return store.name.toLowerCase().includes(q) || store.description.toLowerCase().includes(q)
}

function matchesStatus(store: StoreResponse, filter: StatusFilter): boolean {
  if (filter === 'published') return Boolean(store.isPublished)
  if (filter === 'draft') return !store.isPublished
  return true
}

const FILTERS: readonly { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'published', label: 'Published' },
  { id: 'draft', label: 'Drafts' },
]

export function StoreDirectory({
  stores,
  selectedStoreId,
  onSelect,
  onOpenMenu,
  onEdit,
}: StoreDirectoryProps) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')

  const publishedCount = stores.filter((store) => store.isPublished).length
  const counts: Record<StatusFilter, number> = {
    all: stores.length,
    published: publishedCount,
    draft: stores.length - publishedCount,
  }

  const visible = useMemo(
    () =>
      stores
        .filter((store) => matchesQuery(store, query) && matchesStatus(store, status))
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name)),
    [stores, query, status],
  )

  const emptyLabel = query.trim()
    ? `No stores match “${query.trim()}”.`
    : status === 'published'
      ? 'No published stores.'
      : 'No drafts.'

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div role="tablist" aria-label="Store status" className="flex gap-5">
          {FILTERS.map((filter) => {
            const selected = status === filter.id
            return (
              <button
                key={filter.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setStatus(filter.id)}
                className={cn(
                  'border-b-2 pb-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  selected
                    ? 'border-foreground font-medium text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground',
                )}
              >
                {filter.label}
                <span className="ml-1.5 tabular-nums">{counts[filter.id]}</span>
              </button>
            )
          })}
        </div>
        <div className="w-full sm:w-72">
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
              isWorking={store.id === selectedStoreId}
              onSelect={() => onSelect(store.id)}
              onOpenMenu={() => onOpenMenu(store.id)}
              onEdit={() => onEdit(store.id)}
            />
          ))}
        </ul>
      )}
    </div>
  )
}
