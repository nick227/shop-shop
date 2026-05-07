/**
 * StoreCard — scannable: name, description, distance, delivery mode.
 */
import { memo, useMemo } from 'react'
import { Card, CardContent, Badge } from '@shared/ui/primitives'
import { MapPin } from 'lucide-react'
import type { StoreWithDistance, StoreClickHandler } from '@api/types'
import { formatDistance } from '@shared/lib/format'
import { getStoreImageUrl } from '@shared/lib/utils/storeAccessors'
import { cn } from '@shared/lib/cn'

export interface StoreCardProps {
  readonly store: StoreWithDistance
  readonly onClick?: StoreClickHandler
  readonly className?: string
}

function storeHookLabel(store: StoreWithDistance): string {
  const d = store.deliveryEnabled === true
  const p = store.pickupEnabled === true
  if (d && p) return 'Delivery · Pickup'
  if (d) return 'Delivery'
  if (p) return 'Pickup'
  return 'Local vendor'
}

function locationLabel(store: StoreWithDistance): string {
  if (store.distance !== undefined) return formatDistance(store.distance)
  if (store.addressCity && store.addressState) return `${store.addressCity}, ${store.addressState}`
  return 'Near you'
}

function StoreCardComponent({ store, onClick, className }: StoreCardProps) {
  const handleClick = useMemo(() => (onClick ? () => onClick(store) : undefined), [onClick, store])
  const hook = useMemo(() => storeHookLabel(store), [store])
  const location = useMemo(() => locationLabel(store), [store])

  return (
    <Card
      onClick={handleClick}
      className={cn(
        'overflow-hidden tap-scale hover:shadow-lg transition-all cursor-pointer',
        className
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        <img
          src={getStoreImageUrl(store, 'standard')}
          alt={store.name}
          className="h-full w-full object-cover"
          loading="lazy"
        />
        {!store.isPublished && (
          <div className="absolute right-2 top-2">
            <Badge variant="warning">Draft</Badge>
          </div>
        )}
      </div>

      <CardContent className="p-3">
        <h3 className="line-clamp-1 text-base font-semibold leading-tight">{store.name}</h3>
        {store.description && (
          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{store.description}</p>
        )}
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            {location}
          </span>
          <Badge variant="secondary" className="shrink-0 text-xs font-normal">
            {hook}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}

export const StoreCard = memo(StoreCardComponent)
