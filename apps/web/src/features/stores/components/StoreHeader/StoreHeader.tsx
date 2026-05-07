import { MapPin, Phone, Clock } from 'lucide-react'
import { Badge } from '@shared/ui/primitives'
import type { StoreResponse, StoreWithRating } from '@api/types'
import { cn } from '@shared/lib/cn'
import { useQuery } from '@tanstack/react-query'
import { StorePreviewMap } from '@features/stores/components/StoreMap/StorePreviewMap'

/**
 * StoreHeader - Modern store header with two-column layout and map
 */

export interface StoreHeaderProps {
  readonly store: StoreResponse & StoreWithRating
  readonly className?: string
}

export function StoreHeader({ store, className, showMap = true }: StoreHeaderProps) {
  const fullAddress = [
    store.addressStreet, 
    store.addressCity, 
    store.addressState, 
    store.addressZip
  ].filter(Boolean).join(', ')

  // Fetch store media for hero display
  const { data: storeMedia } = useQuery({
    queryKey: ['store-media', store.id],
    queryFn: async () => {
      const response = await fetch(`/api/media?storeId=${store.id}`, {
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

  const primaryMedia = storeMedia?.[0]

  return (
    <div className={cn('overflow-hidden rounded-xl border border-border bg-card', className)}>
      <div className="flex flex-col md:flex-row">
        {/* Store Info Section */}
        <div className="flex-1 p-6 space-y-5">
          {/* Store Hero Media */}
          {primaryMedia && (
            <div className="overflow-hidden relative mb-4 bg-gray-100 rounded-lg aspect-video">
              {primaryMedia.kind === 'IMAGE' ? (
                <img
                  src={primaryMedia.url}
                  alt={primaryMedia.altText || store.name}
                  className="object-cover w-full h-full"
                />
              ) : (
                <video
                  src={primaryMedia.url}
                  className="object-cover w-full h-full"
                  controls
                  playsInline
                />
              )}
            </div>
          )}

          {/* Store Name & Status */}
          <div>
            <div className="flex gap-2 justify-between items-start mb-2">
              <h1 className="text-6xl font-bold tracking-tight text-foreground">{store.name}</h1>
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
              <div className="flex gap-2 items-start text-sm">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="text-muted-foreground">{fullAddress}</span>
              </div>
            )}

            {/* Phone */}
            {store.phone && (
              <div className="flex gap-2 items-center text-sm">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <a 
                  href={'tel:' + store.phone}
                  className="transition-colors text-primary hover:underline"
                >
                  {store.phone}
                </a>
              </div>
            )}

            {/* Prep Time */}
            <div className="flex gap-2 items-center text-sm">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                Prep time: {store.prepTimeMin ?? 20} minutes
              </span>
            </div>
          </div>

          {/* Rating & Delivery Info */}
          <div className="flex flex-wrap gap-2">
            {typeof store.averageRating === 'number' ? (
              <Badge variant="secondary">{store.averageRating} Rating</Badge>
            ) : null}
          </div>
        </div>

        {/* Map Column (Wide) */}
        {!!(store.latitude && store.longitude && showMap) && (
          <div className="w-full md:w-[650px] border-t md:border-t-0 md:border-l border-border bg-muted">
            <StorePreviewMap 
              latitude={store.latitude} 
              longitude={store.longitude} 
              height="100%" 
              zoom={15}
            />
          </div>
        )}
      </div>
    </div>
  )
}
