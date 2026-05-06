// @ts-nocheck
import { MapPin, Phone, Clock } from 'lucide-react'
import { Badge } from '@shared/ui/primitives'
import type { StoreResponse } from '@api/types'
import { cn } from '@shared/lib/cn'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@api/client'

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

  // Fetch store media for hero display
  const { data: storeMedia } = useQuery({
    queryKey: ['store-media', store.id],
    queryFn: async () => {
      const response = await fetch(`/media?storeId=${store.id}`, {
        credentials: 'include',
      })
      if (!response.ok) {
        throw new Error('Failed to fetch store media')
      }
      const data = await response.json()
      return data.data || []
    },
    enabled: !!store.id,
  })

  const primaryMedia = storeMedia?.[0] // First media item is primary

  return (
    <div className={cn('space-y-5 rounded-xl border border-border bg-card p-5', className)}>
      {/* Store Hero Media */}
      {primaryMedia && (
        <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
          {primaryMedia.kind === 'IMAGE' ? (
            <img
              src={primaryMedia.url}
              alt={primaryMedia.altText || store.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <video
              src={primaryMedia.url}
              className="w-full h-full object-cover"
              controls
              playsInline
              poster=""
            />
          )}
        </div>
      )}

      {/* Store Name & Status */}
      <div>
        <div className="mb-2 flex items-start justify-between gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{store.name}</h1>
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
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="text-muted-foreground">{fullAddress}</span>
          </div>
        )}

        {/* Phone */}
        {store.phone && (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <a 
              href={'tel:' + store.phone + ''}
              className="text-primary transition-colors hover:underline"
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
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">⭐ 4.8 Rating</Badge>
        <Badge variant="secondary">🚚 Free delivery</Badge>
      </div>
    </div>
  )
}

