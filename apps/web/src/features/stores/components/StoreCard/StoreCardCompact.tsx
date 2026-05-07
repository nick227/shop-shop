/**
 * StoreCardCompact - Minimal store card for sidebars, carousels, quick lists
 * Perfect for: Horizontal scrolls, related stores, quick suggestions
 * Migrated to Tailwind (removed CSS module)
 */
import { memo, useCallback } from 'react'
import { Image, ICON, TIME_SUFFIX, ASPECT_RATIO, ARIA_LABEL } from '@shared/ui/primitives'
import { formatDistance } from '@shared/lib/format'
import { getImageUrl } from '@shared/lib/utils/image'
import type { StoreWithDistance, StoreClickHandler } from '@api/types'
import { cn } from '@shared/lib/cn'

export interface StoreCardCompactProps {
  readonly store: StoreWithDistance
  readonly onClick?: StoreClickHandler
  readonly showDistance?: boolean
  readonly showMeta?: boolean
  /** Lighter, smaller — e.g. fallback carousel. */
  readonly variant?: 'default' | 'fallback'
  readonly className?: string
}

function hookLabel(store: StoreWithDistance): string {
  const d = store.deliveryEnabled === true
  const p = store.pickupEnabled === true
  if (d && p) return 'Delivery · Pickup'
  if (d) return 'Delivery'
  if (p) return 'Pickup'
  return 'Store'
}

function StoreCardCompactComponent({
  store,
  onClick,
  showDistance = true,
  showMeta = true,
  variant = 'default',
  className
}: StoreCardCompactProps) {
  const handleClick = useCallback(() => onClick?.(store), [onClick, store])

  const imageUrl = getImageUrl((store as { imageUrl?: string }).imageUrl, store.id, 'store', (store as any).mediaAssets)
  const fallback = variant === 'fallback'
  const imgSize = fallback ? 'h-14 w-14' : 'h-20 w-20'

  return (
    <button
      type="button"
      className={cn(
        'flex w-full gap-2 rounded-lg border text-left tap-scale transition-all',
        fallback
          ? 'border-white/15 bg-white/5 p-2 hover:bg-white/10'
          : 'gap-3 border-border bg-background p-3 hover:shadow-md',
        className
      )}
      onClick={handleClick}
      aria-label={ARIA_LABEL.VIEW_STORE(store.name)}
    >
      <div className={cn('flex-shrink-0', imgSize)}>
        <Image
          src={imageUrl}
          alt={store.name}
          fallbackSeed={store.id}
          aspectRatio={ASPECT_RATIO.SQUARE}
          containerClassName="h-full w-full overflow-hidden rounded-md"
        />
      </div>

      <div className="min-w-0 flex-1">
        <h4 className={cn('line-clamp-1 font-semibold', fallback ? 'text-xs text-white' : 'mb-1 text-sm')}>
          {store.name}
        </h4>
        {showMeta && (
          <div className={cn('text-muted-foreground', fallback ? 'mt-0.5 text-[10px] text-white/75' : 'flex flex-col gap-0.5 text-xs')}>
            {showDistance && store.distance !== undefined && (
              <span>
                {ICON.LOCATION} {formatDistance(store.distance)}
              </span>
            )}
            {fallback ? (
              <span className="line-clamp-1">{hookLabel(store)}</span>
            ) : (
              <span>
                {ICON.TIME} {store.prepTimeMin}
                {TIME_SUFFIX}
              </span>
            )}
          </div>
        )}
      </div>
    </button>
  )
}

export const StoreCardCompact = memo(StoreCardCompactComponent)

