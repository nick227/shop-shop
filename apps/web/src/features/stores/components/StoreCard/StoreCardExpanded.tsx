/**
 * StoreCardExpanded - Rich store card with full details and actions
 * Perfect for: Featured sections, hero areas, detailed listings
 * Migrated to Tailwind (removed CSS module)
 */
import { memo, useCallback } from 'react'
import { Card, Image, Button, Badge } from '@shared/ui/primitives'
import { ICON, ASPECT_RATIO, LABEL } from '@shared/ui/primitives/Carousel/constants'
import { formatDistance } from '@shared/lib/format'
import { getImageUrl } from '@shared/lib/image'
import type { StoreWithDistance, StoreClickHandler } from '@api/backend-types'
import { cn } from '@shared/lib/cn'

export interface StoreCardExpandedProps {
  readonly store: StoreWithDistance
  readonly onViewMenu?: StoreClickHandler
  readonly onViewDetails?: StoreClickHandler
  readonly showActions?: boolean
  readonly featured?: boolean
}

// Mock constants - should come from store data in real implementation
const MOCK_RATING = '4.8'
const MOCK_RATING_COUNT = '(250+)'
const MOCK_DELIVERY_FEE = '$2.99'
const MOCK_MIN_ORDER = '$10.00'

function StoreCardExpandedComponent({ 
  store, 
  onViewMenu,
  onViewDetails,
  showActions = true,
  featured = false
}: StoreCardExpandedProps) {
  const imageUrl = getImageUrl((store as { imageUrl?: string }).imageUrl, store.id, 'store')

  const handleViewMenu = useCallback(() => onViewMenu?.(store), [onViewMenu, store])
  const handleViewDetails = useCallback(() => onViewDetails?.(store), [onViewDetails, store])

  return (
    <Card 
      className={cn(
        'overflow-hidden tap-scale hover:shadow-xl transition-all',
        featured && 'ring-2 ring-primary'
      )}
    >
      {/* Featured badge */}
      {featured && (
        <div className="absolute top-4 left-4 z-10">
          <Badge variant="default" className="text-sm font-semibold">
            {ICON.STAR} {LABEL.FEATURED}
          </Badge>
        </div>
      )}
      
      {/* Image */}
      <div className="relative">
        <Image
          src={imageUrl}
          alt={store.name}
          fallbackSeed={store.id}
          aspectRatio={ASPECT_RATIO.ULTRA_WIDE}
          containerClassName="w-full"
        />
      </div>
      
      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-2xl font-bold mb-1 line-clamp-1">{store.name}</h3>
            {store.description && (
              <p className="text-muted-foreground line-clamp-2">{store.description}</p>
            )}
          </div>
          
          {/* Rating */}
          <div className="flex flex-col items-end gap-0.5">
            <div className="text-2xl font-bold">{MOCK_RATING}</div>
            <div className="text-yellow-500 text-sm">{ICON.STAR.repeat(5)}</div>
            <div className="text-xs text-muted-foreground">{MOCK_RATING_COUNT}</div>
          </div>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-4">
          {store.distance !== undefined && (
            <div className="flex items-start gap-2">
              <span className="text-xl">{ICON.LOCATION}</span>
              <div>
                <div className="text-xs text-muted-foreground">{LABEL.DISTANCE}</div>
                <div className="text-sm font-medium">{formatDistance(store.distance)}</div>
              </div>
            </div>
          )}
          
          <div className="flex items-start gap-2">
            <span className="text-xl">{ICON.TIME}</span>
            <div>
              <div className="text-xs text-muted-foreground">{LABEL.PREP_TIME}</div>
              <div className="text-sm font-medium">{store.prepTimeMin} min</div>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <span className="text-xl">{ICON.DELIVERY}</span>
            <div>
              <div className="text-xs text-muted-foreground">{LABEL.DELIVERY}</div>
              <div className="text-sm font-medium">{MOCK_DELIVERY_FEE}</div>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <span className="text-xl">{ICON.MONEY}</span>
            <div>
              <div className="text-xs text-muted-foreground">{LABEL.MIN_ORDER}</div>
              <div className="text-sm font-medium">{MOCK_MIN_ORDER}</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex gap-2 pt-2">
            <Button
              variant="primary"
              size="large"
              onClick={handleViewMenu}
              fullWidth
            >
              {LABEL.VIEW_MENU}
            </Button>
            <Button
              variant="secondary"
              size="large"
              onClick={handleViewDetails}
              fullWidth
            >
              {LABEL.STORE_DETAILS}
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}

export const StoreCardExpanded = memo(StoreCardExpandedComponent)

