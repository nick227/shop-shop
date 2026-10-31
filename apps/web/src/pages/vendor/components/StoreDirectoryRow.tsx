import { Button } from '@shared/ui/primitives'
import { useHaptics } from '@shared/hooks/useHaptics'
import type { StoreResponse } from '@api/types'
import { ActiveStoreOperations } from './ActiveStoreOperations'

interface StoreDirectoryRowProps {
  readonly store: StoreResponse
  readonly meta: string
  readonly isWorking: boolean
  readonly onSelect: () => void
  readonly onOpenMenu: () => void
  readonly onEdit: () => void
}

export function StoreDirectoryRow({
  store,
  meta,
  isWorking,
  onSelect,
  onOpenMenu,
  onEdit,
}: StoreDirectoryRowProps) {
  const haptics = useHaptics()

  return (
    <li className="border-b border-border">
      <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => {
            haptics.light()
            onSelect()
          }}
          className="flex min-w-0 items-start gap-3 rounded-sm text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-pressed={isWorking}
          aria-label={isWorking ? `${store.name} is the working store` : `Work in ${store.name}`}
        >
          <span
            className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-foreground"
            aria-hidden
          >
            {isWorking ? <span className="h-2 w-2 rounded-full bg-foreground" /> : null}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-base font-medium text-foreground">{store.name}</span>
            <span className="mt-0.5 block text-sm text-muted-foreground">
              {meta}
              {isWorking ? ' · Working' : ''}
            </span>
          </span>
        </button>
        <div className="flex shrink-0 gap-2">
          <Button
            type="button"
            variant="outline"
            size="small"
            onClick={() => {
              haptics.light()
              onOpenMenu()
            }}
          >
            Menu
          </Button>
          <Button
            type="button"
            variant="outline"
            size="small"
            onClick={() => {
              haptics.light()
              onEdit()
            }}
          >
            Edit store
          </Button>
        </div>
      </div>
      {isWorking ? <ActiveStoreOperations storeId={store.id} storeName={store.name} /> : null}
    </li>
  )
}
