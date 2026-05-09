import type React from 'react'
import { MapPin, Phone, Clock, Globe, Youtube, Instagram, Facebook, Twitter, MessageCircle, MessageSquare, Music, Ghost } from 'lucide-react'
import { Badge } from '@shared/ui/primitives'
import type { MediaApiResponse, StoreResponse, StoreWithRating, StoreSocialLinks } from '@api/types'
import { cn } from '@shared/lib/cn'
import { StorePreviewMap } from '@features/stores/components/StoreMap/StorePreviewMap'
import { useMediaList } from '@shared/hooks/hooks/vendor/useMediaList'
import { getImageUrl } from '@shared/lib/utils/image'

function buildSocialUrl(platform: keyof StoreSocialLinks, value: string): string {
  const v = value.trim()
  const handle = v.startsWith('@') ? v.slice(1) : v
  switch (platform) {
    case 'youtube':   return `https://youtube.com/@${handle}`
    case 'instagram': return `https://instagram.com/${handle}`
    case 'facebook':  return `https://facebook.com/${handle}`
    case 'tiktok':    return `https://tiktok.com/@${handle}`
    case 'twitter':   return `https://x.com/${handle}`
    case 'whatsapp':  return `https://wa.me/${v.replace(/\D/g, '')}`
    case 'discord':   return v.startsWith('http') ? v : `https://discord.gg/${v}`
    case 'snapchat':  return `https://snapchat.com/add/${handle}`
  }
}

const SOCIAL_ICONS: Record<keyof StoreSocialLinks, React.ReactNode> = {
  youtube:   <Youtube className="w-4 h-4" />,
  instagram: <Instagram className="w-4 h-4" />,
  facebook:  <Facebook className="w-4 h-4" />,
  tiktok:    <Music className="w-4 h-4" />,
  twitter:   <Twitter className="w-4 h-4" />,
  whatsapp:  <MessageCircle className="w-4 h-4" />,
  discord:   <MessageSquare className="w-4 h-4" />,
  snapchat:  <Ghost className="w-4 h-4" />,
}

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
  const storeImageUrl = getImageUrl(
    (store as { imageUrl?: string }).imageUrl,
    store.id,
    'store',
    (store as { mediaAssets?: { url: string; kind: string }[] }).mediaAssets,
  )
  const heroMedia = fullSize ? primaryMedia : undefined
  const heroNode = (() => {
    if (!heroMedia) {
      return (
        <img
          src={storeImageUrl}
          alt={store.name}
          className="object-cover w-full h-full"
        />
      )
    }

    if (heroMedia.kind === 'IMAGE') {
      return (
        <img
          src={heroMedia.url}
          alt={heroMedia.altText ?? store.name}
          className="object-cover w-full h-full"
        />
      )
    }

    return (
      <video
        src={heroMedia.url}
        className="object-cover w-full h-full"
        controls
        playsInline
      >
        <track kind="captions" />
      </video>
    )
  })()

  return (
    <div className={cn('overflow-hidden rounded-xl border border-border bg-card', className)}>
      <div className="flex flex-col md:flex-row">
        {/* Store Info Section */}
        <div className="flex-1 p-6">
          <div className="flex flex-col gap-6 md:flex-row md:gap-8">
            {/* Logo / hero — left column */}
            <div className="shrink-0 flex justify-center md:justify-start">
              {!fullSize && (
                <div className="overflow-hidden bg-gray-100 rounded-lg w-16 h-16 md:w-20 md:h-20">
                  <img
                    src={storeImageUrl}
                    alt={store.name}
                    className="object-cover w-full h-full"
                  />
                </div>
              )}
              {fullSize && (heroMedia ?? storeImageUrl) && (
                <div className="overflow-hidden relative w-full max-w-md mx-auto bg-gray-100 rounded-lg aspect-video md:mx-0 md:w-52 md:max-w-none md:aspect-square">
                  {heroNode}
                </div>
              )}
            </div>

            {/* Name, description, meta */}
            <div className="flex-1 min-w-0 space-y-5">
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

                {/* Custom Domain */}
                {(store as any).customDomain && (
                  <div className="flex gap-2 items-center text-sm">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <a
                      href={(store as any).customDomain}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="transition-colors text-primary hover:underline"
                    >
                      {(store as any).customDomain.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}

                {/* Social Links */}
                {(() => {
                  const links = (store as any).socialLinksJson as StoreSocialLinks | undefined
                  if (!links) return null
                  const entries = Object.entries(links).filter(([, v]) => v) as [keyof StoreSocialLinks, string][]
                  if (entries.length === 0) return null
                  return (
                    <div className="flex flex-wrap gap-3 pt-1">
                      {entries.map(([platform, value]) => (
                        <a
                          key={platform}
                          href={buildSocialUrl(platform, value)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary"
                          aria-label={platform}
                        >
                          {SOCIAL_ICONS[platform]}
                        </a>
                      ))}
                    </div>
                  )
                })()}
              </div>

              {/* Rating & Delivery Info */}
              <div className="flex flex-wrap gap-2">
                {typeof store.averageRating === 'number' ? (
                  <Badge variant="secondary">{store.averageRating} Rating</Badge>
                ) : undefined}
              </div>
            </div>
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
