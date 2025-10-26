/**
 * StoreCardCompact - Minimal store card for sidebars, carousels, quick lists
 * Perfect for: Horizontal scrolls, related stores, quick suggestions
 * Migrated to Tailwind (removed CSS module)
 */
import { memo, useCallback } from 'react'
import { Image } from '@ui'
import { ICON, TIME_SUFFIX, ASPECT_RATIO, ARIA_LABEL } from '@ui/Carousel/constants'
import { formatDistance } from '@utils/format'
import { getImageUrl } from '@utils/image'
import type { StoreWithDistance, StoreClickHandler } from '@api/types'
import { cn } from '@utils/cn'

export interface StoreCardCompactProps {
  store: StoreWithDistance
  onClick?: StoreClickHandler | undefined
  showDistance?: boolean | undefined
  showMeta?: boolean | undefined
  className?: string | undefined
}

function StoreCardCompactComponent({ 
  store, 
  onClick, 
  showDistance = true,
  showMeta = true,
  className
}: StoreCardCompactProps) {
  const handleClick = useCallback(() => onClick?.(store), [onClick, store])
  
  // @ts-expect-error - imageUrl will be added to Store type
  const imageUrl = getImageUrl(store.imageUrl, store.id, 'store')

  return (
    <button
      type="button"
      className={cn(
        'flex gap-3 p-3 rounded-lg border border-border bg-background tap-scale hover:shadow-md transition-all text-left w-full',
        className
      )}
      onClick={handleClick}
      aria-label={ARIA_LABEL.VIEW_STORE(store.name)}
    >
      {/* Image */}
      <div className="flex-shrink-0 w-20 h-20">
        <Image
          src={imageUrl}
          alt={store.name}
          fallbackSeed={store.id}
          aspectRatio={ASPECT_RATIO.SQUARE}
          containerClassName="w-full h-full rounded-md overflow-hidden"
        />
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-sm line-clamp-1 mb-1">{store.name}</h4>
        
        {showMeta && (
          <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
            {showDistance && store.distance !== undefined && (
              <span>
                {ICON.LOCATION} {formatDistance(store.distance)}
              </span>
            )}
            <span>
              {ICON.TIME} {store.prepTimeMin}{TIME_SUFFIX}
            </span>
          </div>
        )}
      </div>
    </button>
  )
}

export const StoreCardCompact = memo(StoreCardCompactComponent)

