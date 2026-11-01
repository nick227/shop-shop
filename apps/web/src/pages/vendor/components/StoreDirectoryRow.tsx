import { Button } from '@shared/ui/primitives'
import { useHaptics } from '@shared/hooks/useHaptics'
import type { VendorStore } from '@shared/hooks/hooks/vendor'
import { StoreAvatar } from '@layouts/VendorLayout/StoreAvatar'

interface StoreDirectoryRowProps {
  readonly store: VendorStore
  readonly meta: string
  readonly isCurrent: boolean
  readonly onOpen: () => void
  readonly onSettings: () => void
}

export function StoreDirectoryRow({ store, meta, isCurrent, onOpen, onSettings }: StoreDirectoryRowProps) {
  const haptics = useHaptics()

  return (
    <li className="border-b border-border">
      <div className="flex items-center gap-3 py-3">
        <button
          type="button"
          onClick={() => {
            haptics.light()
            onOpen()
          }}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-lg p-1 text-left hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`Open ${store.name}`}
        >
          <StoreAvatar name={store.name} imageUrl={store.imageUrl} />
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-foreground">{store.name}</span>
            <span className="block truncate text-xs text-muted-foreground">
              {meta}
              {isCurrent ? ' · Current' : ''}
            </span>
          </span>
        </button>
        <Button type="button" variant="outline" size="small" onClick={onSettings}>
          Settings
        </Button>
      </div>
    </li>
  )
}
