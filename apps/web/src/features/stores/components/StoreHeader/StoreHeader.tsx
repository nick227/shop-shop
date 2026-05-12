import { Badge } from '@shared/ui/primitives'
import type { MediaApiResponse } from '@api/types'
import { cn } from '@shared/lib/cn'
import { useMediaList } from '@shared/hooks/hooks/vendor/useMediaList'
import { getImageUrl } from '@shared/lib/utils/image'
import type { StoreHeaderStore } from './storeHeaderTypes'
import { StoreHeaderFull } from './StoreHeaderFull'

export type { StoreHeaderStore } from './storeHeaderTypes'

export interface StoreHeaderProps {
  readonly store: StoreHeaderStore
  readonly className?: string
  readonly showMap?: boolean
  readonly fullSize?: boolean
}

export function StoreHeader({ store, className, showMap = true, fullSize = true }: StoreHeaderProps) {
  const fullAddress = [store.addressStreet, store.addressCity, store.addressState, store.addressZip]
    .filter(Boolean)
    .join(', ')

  const { data: storeMedia } = useMediaList({ storeId: fullSize ? store.id : undefined })
  const primaryMedia: MediaApiResponse | undefined = storeMedia?.[0]
  const storeImageUrl = getImageUrl(
    store.imageUrl,
    store.id,
    'store',
    store.mediaAssets ? [...store.mediaAssets] : undefined,
  )

  if (!fullSize) {
    return (
      <div
        className={cn(
          'flex gap-4 rounded-xl border border-border bg-card p-4 shadow-sm',
          className,
        )}
      >
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg ring-1 ring-border">
          <img src={storeImageUrl} alt={store.name} className="h-full w-full object-cover" />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">{store.name}</h2>
            {!store.isPublished ? <Badge variant="warning">Draft</Badge> : undefined}
          </div>
          {fullAddress ? <p className="text-sm text-muted-foreground">{fullAddress}</p> : undefined}
        </div>
      </div>
    )
  }

  return (
    <StoreHeaderFull
      store={store}
      className={className}
      fullAddress={fullAddress}
      storeImageUrl={storeImageUrl}
      heroMedia={primaryMedia}
      showMap={showMap}
    />
  )
}
