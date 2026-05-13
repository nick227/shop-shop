import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Skeleton } from '@shared/ui/primitives'
import { StoreHeader, type StoreHeaderStore } from '@features/stores/components/StoreHeader'
import { ItemCard } from '@features/products/components/ItemCard'
import type { ItemResponse } from '@api/backend-types'

const MENU_PREVIEW_SKELETON_CARDS = 4

function BrowseDetailSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading kitchen">
      <div className="flex gap-3">
        <Skeleton className="h-14 w-14 shrink-0 rounded-lg" />
        <div className="min-w-0 flex-1 space-y-2 py-0.5">
          <Skeleton className="h-5 w-3/4 max-w-[14rem]" />
          <Skeleton className="h-3.5 w-full max-w-[12rem]" />
        </div>
      </div>
      <Skeleton className="h-4 w-40 rounded" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-24 rounded" />
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {Array.from({ length: MENU_PREVIEW_SKELETON_CARDS }, (_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}

export function RiverBrowseDetailColumn({
  selectedStoreId,
  showDetailError,
  showDetailSkeleton,
  detailStore,
  detailStoreRoute,
  menuSections,
}: Readonly<{
  selectedStoreId: string | undefined
  showDetailError: boolean
  showDetailSkeleton: boolean
  detailStore: StoreHeaderStore | undefined
  detailStoreRoute: string
  menuSections: ReadonlyArray<{ readonly label: string; readonly items: readonly ItemResponse[] }>
}>) {
  let body: ReactNode
  if (!selectedStoreId) {
    body = <p className="text-sm text-gray-600">Choose a kitchen from the list.</p>
  } else if (showDetailError) {
    body = <p className="text-sm text-gray-600">Could not load this kitchen.</p>
  } else if (showDetailSkeleton) {
    body = <BrowseDetailSkeleton />
  } else if (detailStore) {
    body = (
      <div className="space-y-4">
        <div>
          <StoreHeader store={detailStore} showMap={false} fullSize={false} />
          <Link
            to={detailStoreRoute}
            className="mt-3 inline-flex rounded text-sm font-medium text-orange-600 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
          >
            Open full kitchen page →
          </Link>
        </div>

        {menuSections.length === 0 ? (
          <p className="text-sm text-gray-600">No menu items to preview.</p>
        ) : (
          menuSections.map((section) => (
            <section key={section.label}>
              <h3 className="mb-2 text-sm font-semibold text-gray-900">{section.label}</h3>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {section.items.map((item) => (
                  <ItemCard key={item.id} item={item} store={{ id: detailStore.id, name: detailStore.name }} />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    )
  } else {
    body = undefined
  }

  return (
    <div className="flex min-h-0 flex-col">
      <div className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-gray-500">
        Selected kitchen
      </div>
      <div className="max-h-[min(420px,50vh)] flex-1 overflow-y-auto p-3">{body}</div>
    </div>
  )
}
