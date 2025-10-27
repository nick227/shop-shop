import { MapPin, Phone, Clock } from 'lucide-react'
import { Badge } from '@ui'
import type { StoreResponse } from '../../../../api/backend-types'
import { cn } from '@utils/cn'

/**
 * StoreHeader - Modern store header with Tailwind + icons
 */

export interface StoreHeaderProps {
  readonly store: StoreResponse
  readonly className?: string
}

export function StoreHeader({ store, className }: StoreHeaderProps) {
  const fullAddress = [store.addressStreet, store.city, store.state, store.zipCode]
    .filter(Boolean)
    .join(', ')

  return (
    <div className={cn('space-y-4', className)}>
      {/* Store Name & Status */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <h1 className="text-3xl font-bold">{store.name}</h1>
          {!store.isPublished && (
            <Badge variant="warning">Draft</Badge>
          )}
        </div>
        
        {store.description && (
          <p className="text-muted-foreground">{store.description}</p>
        )}
      </div>

      {/* Meta Information */}
      <div className="space-y-2">
        {/* Address */}
        {fullAddress && (
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
            <span className="text-muted-foreground">{fullAddress}</span>
          </div>
        )}

        {/* Phone */}
        {store.phone && (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <a 
              href={'tel:' + store.phone + ''}
              className="text-primary hover:underline"
            >
              {store.phone}
            </a>
          </div>
        )}

        {/* Prep Time */}
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">
            Prep time: {store.prepTimeMin ?? 20} minutes
          </span>
        </div>
      </div>

      {/* Rating & Delivery Info */}
      <div className="flex gap-2">
        <Badge variant="secondary">⭐ 4.8 Rating</Badge>
        <Badge variant="secondary">🚚 Free delivery</Badge>
      </div>
    </div>
  )
}

