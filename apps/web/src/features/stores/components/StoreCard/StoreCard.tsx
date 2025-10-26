/**
 * StoreCard - Modern store card with Tailwind
 * Domain component using SDK types
 * Memoized for performance optimization
 */
import { memo, useMemo } from 'react'
import { Card, CardContent, Badge } from '@ui'
import { MapPin, Clock, Star, DollarSign } from 'lucide-react'
import { parseStore } from '@api/types'
import { formatDistance } from '@utils/format'
import { getStoreImageUrl } from '@utils/storeAccessors'
import type { StoreWithDistance, StoreClickHandler } from '@api/types'
import { cn } from '@utils/cn'

export interface StoreCardProps {
  store: StoreWithDistance
  onClick?: StoreClickHandler | undefined
  className?: string | undefined
}

function StoreCardComponent({ store, onClick, className }: StoreCardProps) {
  const typedStore = useMemo(() => parseStore(store), [store])
  const handleClick = useMemo(() => onClick ? () => onClick(store) : undefined, [onClick, store])

  return (
    <Card 
      onClick={handleClick} 
      className={cn(
        'overflow-hidden tap-scale hover:shadow-lg transition-all cursor-pointer',
        className
      )}
    >
      {/* Image */}
      <div className="relative aspect-video overflow-hidden bg-muted">
        <img
          src={getStoreImageUrl(store, 'standard')}
          alt={store.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {!store.isPublished && (
          <div className="absolute top-2 right-2">
            <Badge variant="warning">Draft</Badge>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        {/* Name */}
        <h3 className="text-lg font-semibold mb-2 line-clamp-1">{store.name}</h3>
        
        {/* Description */}
        {store.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {store.description}
          </p>
        )}
        
        {/* Meta Info */}
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          {store.distance !== undefined && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              <span>{formatDistance(store.distance)}</span>
            </div>
          )}
          
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            <span>{store.prepTimeMin} min</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
            <span>4.8</span>
          </div>
          
          {(typedStore.fees?.['deliveryFee'] ? (
            <div className="flex items-center gap-1">
              <DollarSign className="h-3.5 w-3.5" />
              <span>${(typedStore.fees["deliveryFee"] as number).toFixed(2)} delivery</span>
            </div>
          ) : null) as React.ReactNode}
        </div>
      </CardContent>
    </Card>
  )
}

// Memoize to prevent unnecessary re-renders
// Using default comparator to ensure UI updates when any prop changes
export const StoreCard = memo(StoreCardComponent)

