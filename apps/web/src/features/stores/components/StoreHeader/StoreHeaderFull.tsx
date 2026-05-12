import type React from 'react'
import type { MediaApiResponse, StoreSocialLinks } from '@api/types'
import {
  MapPin,
  Phone,
  Clock,
  Globe,
  ExternalLink,
  Star,
} from 'lucide-react'
import { Badge } from '@shared/ui/primitives'
import { cn } from '@shared/lib/cn'
import { StorePreviewMap } from '@features/stores/components/StoreMap/StorePreviewMap'
import type { StoreHeaderStore } from './storeHeaderTypes'
import { StoreHeaderSocialRow } from './StoreHeaderSocialRow'

function directionsUrl(lat: number | string, lng: number | string): string {
  const dest = `${lat},${lng}`
  const encoded = encodeURIComponent(dest)
  return `https://www.google.com/maps/dir/?api=1&destination=${encoded}`
}

function renderHeroMedia(
  heroMedia: MediaApiResponse | undefined,
  storeImageUrl: string,
  storeName: string,
): React.ReactNode {
  if (!heroMedia) {
    return <img src={storeImageUrl} alt={storeName} className="h-full w-full object-cover" />
  }
  if (heroMedia.kind === 'IMAGE') {
    return <img src={heroMedia.url} alt={heroMedia.altText ?? storeName} className="h-full w-full object-cover" />
  }
  return (
    <video src={heroMedia.url} className="h-full w-full object-cover" controls playsInline>
      <track kind="captions" />
    </video>
  )
}

function collectSocialEntries(links: StoreHeaderStore['socialLinksJson']): [keyof StoreSocialLinks, string][] {
  if (!links) return []
  return Object.entries(links).filter(([, v]) => typeof v === 'string' && v.length > 0) as [
    keyof StoreSocialLinks,
    string,
  ][]
}

export interface StoreHeaderFullProps {
  readonly store: StoreHeaderStore
  readonly className?: string
  readonly fullAddress: string
  readonly storeImageUrl: string
  readonly heroMedia: MediaApiResponse | undefined
  readonly showMap: boolean
}

export function StoreHeaderFull({
  store,
  className,
  fullAddress,
  storeImageUrl,
  heroMedia,
  showMap,
}: StoreHeaderFullProps) {
  const lat = store.latitude
  const lng = store.longitude
  const hasCoords = Boolean(lat && lng && showMap)
  const socialEntries = collectSocialEntries(store.socialLinksJson)
  const domainLabel = store.customDomain ? store.customDomain.replace(/^https?:\/\//u, '') : ''

  return (
    <article
      className={cn(
        'overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm',
        className,
      )}
    >
      <div className="relative aspect-[2.4/1] max-h-[min(280px,38vh)] min-h-[140px] w-full bg-muted">
        <div className="absolute inset-0">{renderHeroMedia(heroMedia, storeImageUrl, store.name)}</div>
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/10"
          aria-hidden
        />
      </div>

      <div className="border-b border-border px-5 py-6 sm:px-8 sm:py-8">
        <header className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3 gap-y-2">
            <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {store.name}
            </h1>
            <div className="flex flex-wrap items-center justify-end gap-2">
              {!store.isPublished ? <Badge variant="warning">Draft</Badge> : undefined}
              {typeof store.averageRating === 'number' ? (
                <Badge variant="secondary" className="gap-1 font-medium tabular-nums">
                  <Star className="h-3.5 w-3.5 fill-current opacity-80" aria-hidden />
                  {store.averageRating.toFixed(1)}
                </Badge>
              ) : undefined}
            </div>
          </div>

          {store.description ? (
            <p className="max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground">
              {store.description}
            </p>
          ) : undefined}
        </header>

        <dl className="mt-6 flex flex-col gap-4 border-t border-border pt-6 text-sm sm:flex-row sm:flex-wrap sm:gap-x-10 sm:gap-y-4">
          {fullAddress ? (
            <div className="flex min-w-0 max-w-md gap-2.5 sm:max-w-xs md:max-w-md">
              <dt className="sr-only">Address</dt>
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <dd className="leading-snug text-muted-foreground">{fullAddress}</dd>
            </div>
          ) : undefined}

          {store.phone ? (
            <div className="flex gap-2.5">
              <dt className="sr-only">Phone</dt>
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <dd>
                <a href={`tel:${store.phone}`} className="font-medium text-primary underline-offset-4 hover:underline">
                  {store.phone}
                </a>
              </dd>
            </div>
          ) : undefined}

          <div className="flex gap-2.5">
            <dt className="sr-only">Prep time</dt>
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            <dd className="text-muted-foreground">Prep ~{store.prepTimeMin ?? 20} min</dd>
          </div>

          {store.customDomain ? (
            <div className="flex min-w-0 gap-2.5">
              <dt className="sr-only">Website</dt>
              <Globe className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <dd className="min-w-0 truncate">
                <a
                  href={store.customDomain}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex max-w-full items-center gap-1 font-medium text-primary underline-offset-4 hover:underline"
                >
                  <span className="truncate">{domainLabel}</span>
                  <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                </a>
              </dd>
            </div>
          ) : undefined}
        </dl>

        {socialEntries.length > 0 ? <StoreHeaderSocialRow entries={socialEntries} /> : undefined}
      </div>

      {hasCoords && lat && lng ? (
        <section aria-labelledby="store-location-heading" className="border-t border-border bg-muted/30">
          <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 sm:px-8">
            <h2
              id="store-location-heading"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Location
            </h2>
            <a
              href={directionsUrl(lat, lng)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              Directions
              <ExternalLink className="h-3 w-3" aria-hidden />
            </a>
          </div>
          <div className="h-44 w-full border-t border-border sm:h-48">
            <StorePreviewMap latitude={lat} longitude={lng} height="100%" zoom={15} />
          </div>
        </section>
      ) : undefined}
    </article>
  )
}
