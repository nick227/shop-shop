import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { Skeleton } from '@shared/ui/primitives'
import { StoreHeader, type StoreHeaderStore } from '@features/stores/components/StoreHeader'
import { ItemCard } from '@features/products/components/ItemCard'
import type { ItemResponse } from '@api/backend-types'

const MENU_PREVIEW_SKELETON_CARDS = 3
const MENU_PREVIEW_ITEM_COUNT = 3

function BrowseDetailSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading store">
      <div className="flex gap-3">
        <Skeleton className="h-16 w-16 shrink-0 rounded-lg" />
        <div className="min-w-0 flex-1 space-y-2 py-0.5">
          <Skeleton className="h-5 w-3/4 max-w-[14rem]" />
          <Skeleton className="h-3.5 w-full max-w-[12rem]" />
        </div>
      </div>
      <Skeleton className="h-4 w-full max-w-xl rounded" />
      <Skeleton className="h-4 w-3/4 max-w-lg rounded" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-24 rounded" />
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {Array.from({ length: MENU_PREVIEW_SKELETON_CARDS }, (_, i) => (
            <Skeleton key={i} className="h-36 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}

function flattenPreviewItems(
  menuSections: readonly { readonly label: string; readonly items: readonly ItemResponse[] }[],
): readonly ItemResponse[] {
  return menuSections.flatMap((section) => section.items).slice(0, MENU_PREVIEW_ITEM_COUNT)
}

export function RiverBrowseDetailColumn({
  selectedStoreId,
  showDetailError,
  showDetailSkeleton,
  detailStore,
  detailStoreRoute,
  menuSections,
  emptyMessage = 'Random kitchens will appear here.',
  onUserInteract,
}: Readonly<{
  selectedStoreId: string | undefined
  showDetailError: boolean
  showDetailSkeleton: boolean
  detailStore: StoreHeaderStore | undefined
  detailStoreRoute: string
  menuSections: readonly { readonly label: string; readonly items: readonly ItemResponse[] }[]
  emptyMessage?: string
  onUserInteract?: () => void
}>) {
  let body: ReactNode
  if (!selectedStoreId) {
    body = <p className="text-sm text-gray-600">{emptyMessage}</p>
  } else if (showDetailError) {
    body = <p className="text-sm text-gray-600">Could not load this store.</p>
  } else if (showDetailSkeleton) {
    body = <BrowseDetailSkeleton />
  } else if (detailStore) {
    const previewItems = flattenPreviewItems(menuSections)
    body = (
      <article className="flex h-full min-h-0 flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <StoreHeader
            store={detailStore}
            showMap={false}
            fullSize={false}
            className="min-w-0 flex-1 border-0 p-0 shadow-none"
          />
          <Link
            to={detailStoreRoute}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-4 text-sm font-semibold text-orange-700 transition-colors hover:border-orange-300 hover:bg-orange-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
          >
            View store
            <ArrowUpRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>

        {detailStore.description ? (
          <p className="line-clamp-2 min-h-[2.75rem] max-w-3xl text-sm leading-relaxed text-gray-600">
            {detailStore.description}
          </p>
        ) : (
          <div className="min-h-[2.75rem]" aria-hidden />
        )}

        {previewItems.length === 0 ? (
          <div className="flex min-h-[10rem] items-center rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 text-sm text-gray-600">
          </div>
        ) : (
          <section className="min-h-0">
            <h3 className="mb-2 text-sm font-semibold text-gray-900">Menu highlights</h3>
            <div className="grid h-[10rem] auto-cols-[minmax(9rem,1fr)] grid-flow-col gap-2 overflow-x-auto overflow-y-hidden sm:grid-flow-row sm:grid-cols-3 sm:overflow-hidden">
              {previewItems.map((item) => (
                <ItemCard key={item.id} item={item} store={{ id: detailStore.id, name: detailStore.name }} />
              ))}
            </div>
          </section>
        )}
      </article>
    )
  } else {
    body = undefined
  }

  return (
    <div className="flex h-[25rem] w-full min-h-0 flex-col">
      <div
        className="h-full overflow-hidden p-4 sm:p-5"
        onPointerDownCapture={() => onUserInteract?.()}
      >
        {body}
      </div>
    </div>
  )
}
