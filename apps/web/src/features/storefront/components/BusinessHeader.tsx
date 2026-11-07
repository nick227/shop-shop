/**
 * Store identity: name, address, actions.
 * `tone="hero"` floats over the cover photo (home-hero style). `tone="plain"` is the fallback strip.
 */
import { useState } from 'react'
import { Globe, MapPin, Navigation, Phone, Share2, Star } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@shared/lib/cn'
import type { StoreHeaderStore } from '@features/stores/components/StoreHeader/storeHeaderTypes'

export function storeAddress(store: StoreHeaderStore): string {
  return [store.addressStreet, store.addressCity, [store.addressState, store.addressZip].filter(Boolean).join(' ')]
    .filter(Boolean)
    .join(', ')
}

export function directionsUrl(store: StoreHeaderStore): string | null {
  if (store.latitude && store.longitude) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${store.latitude},${store.longitude}`)}`
  }
  const address = storeAddress(store)
  return address ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}` : null
}

function websiteUrl(store: StoreHeaderStore): string | null {
  const raw = (store as { website?: string | null }).website || store.customDomain
  if (!raw) return null
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('')
}

export function BusinessHeader({ store, tagline, logoUrl, tone = 'plain' }: {
  readonly store: StoreHeaderStore
  readonly tagline: string
  readonly logoUrl: string | null
  readonly tone?: 'hero' | 'plain'
}) {
  const address = storeAddress(store)
  const directions = directionsUrl(store)
  const website = websiteUrl(store)
  const rating = typeof store.averageRating === 'number' ? store.averageRating : null
  const [logoFailed, setLogoFailed] = useState(false)
  const onPhoto = tone === 'hero'

  const share = async () => {
    const url = window.location.href
    try {
      if (navigator.share) await navigator.share({ title: store.name, url })
      else {
        await navigator.clipboard.writeText(url)
        toast.success('Link copied')
      }
    } catch {
      // The shopper closed the share sheet.
    }
  }

  const action = cn(
    'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm font-medium transition-colors',
    onPhoto
      ? 'border border-white/35 bg-black/35 text-white backdrop-blur-sm hover:bg-white hover:text-foreground'
      : 'border border-border bg-background text-foreground hover:border-primary/50 hover:text-primary',
  )

  return (
    <header className={cn('sf-header', onPhoto && 'is-hero')}>
      {logoUrl && !logoFailed ? (
        <img
          src={logoUrl}
          onError={() => setLogoFailed(true)}
          alt={`${store.name} logo`}
          className="sf-header-mark h-11 w-11 rounded-xl object-cover ring-1 ring-white/25 sm:h-12 sm:w-12"
        />
      ) : !onPhoto ? (
        <div
          className="sf-header-mark sf-heading flex h-11 w-11 items-center justify-center rounded-xl text-base font-bold sm:h-12 sm:w-12"
          style={{ background: 'var(--sf-primary)', color: 'var(--sf-on-primary)' }}
          aria-hidden
        >
          {initials(store.name)}
        </div>
      ) : null}

      <div className="min-w-0 space-y-1">
        <h1 className="sf-heading text-[1.65rem] font-bold leading-[1.1] text-balance sm:text-[2rem]">{store.name}</h1>
        {address ? (
          <p className="sf-header-address flex min-w-0 items-start gap-1.5 text-sm font-medium">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 opacity-80" aria-hidden />
            <span className="min-w-0">{address}</span>
          </p>
        ) : null}
        <p className="sf-header-meta flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          {rating !== null ? (
            <span className="inline-flex items-center gap-1 font-medium">
              <Star className="h-3.5 w-3.5 fill-current" style={onPhoto ? undefined : { color: 'var(--sf-accent)' }} aria-hidden />
              {rating.toFixed(1)}
            </span>
          ) : null}
          {tagline || store.description ? (
            <span className="min-w-0 line-clamp-1 opacity-90">{tagline || store.description}</span>
          ) : null}
        </p>
      </div>

      <div className="sf-header-actions -mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none]" role="group" aria-label={`Contact ${store.name}`}>
        {store.phone ? (
          <a href={`tel:${store.phone}`} className={action}>
            <Phone className="h-3.5 w-3.5" aria-hidden />
            Call
          </a>
        ) : null}
        {directions ? (
          <a href={directions} target="_blank" rel="noopener noreferrer" className={action}>
            <Navigation className="h-3.5 w-3.5" aria-hidden />
            Directions
          </a>
        ) : null}
        {website ? (
          <a href={website} target="_blank" rel="noopener noreferrer" className={action}>
            <Globe className="h-3.5 w-3.5" aria-hidden />
            Website
          </a>
        ) : null}
        <button type="button" onClick={() => void share()} className={action}>
          <Share2 className="h-3.5 w-3.5" aria-hidden />
          Share
        </button>
      </div>
    </header>
  )
}
