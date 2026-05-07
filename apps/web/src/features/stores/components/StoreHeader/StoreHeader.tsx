import { MapPin, Phone, Clock } from 'lucide-react'
import { Badge } from '@shared/ui/primitives'
import type { MediaApiResponse, StoreResponse, StoreWithRating } from '@api/types'
import { cn } from '@shared/lib/cn'
import { StorePreviewMap } from '@features/stores/components/StoreMap/StorePreviewMap'
import { useMediaList } from '@shared/hooks/hooks/vendor/useMediaList'

/**
 * StoreHeader - Modern store header with two-column layout and map
 */

export interface StoreHeaderProps {
  readonly store: StoreResponse & StoreWithRating
  readonly className?: string
  readonly showMap?: boolean
  readonly fullSize?: boolean
}

export function StoreHeader({ store, className, showMap = true, fullSize = true }: StoreHeaderProps) {
  const fullAddress = [
    store.addressStreet, 
    store.addressCity, 
    store.addressState, 
    store.addressZip
  ].filter(Boolean).join(', ')

  const { data: storeMedia } = useMediaList({ storeId: fullSize ? store.id : undefined })
  const primaryMedia: MediaApiResponse | undefined = storeMedia?.[0]

  return (
    <div className={cn('overflow-hidden rounded-xl border border-border bg-card', className)}>
      <div className="flex flex-col md:flex-row">
        {/* Store Info Section */}
        <div className="flex-1 p-6 space-y-5">
          {/* Store Hero Media */}
          {fullSize && primaryMedia && (
            <div className="overflow-hidden relative mb-4 bg-gray-100 rounded-lg aspect-video">
              {primaryMedia.kind === 'IMAGE' ? (
                <img
                  src={primaryMedia.url}
                  alt={primaryMedia.altText ?? store.name}
                  className="object-cover w-full h-full"
                />
              ) : (
                <video
                  src={primaryMedia.url}
                  className="object-cover w-full h-full"
                  controls
                  playsInline
                >
                  <track kind="captions" />
                </video>
              )}
            </div>
          )}

          {/* Store Name & Status */}
          <div>
            <div className="flex gap-2 justify-between items-start mb-2">
              <h1
                className={cn(
                  'font-bold tracking-tight text-foreground',
                  fullSize ? 'text-6xl' : 'text-3xl',
                )}
              >
                {store.name}
              </h1>
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
            ) : undefined}
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
