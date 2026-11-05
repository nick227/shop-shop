/**
 * BusinessHeader - who the business is and how to reach it, before anything else:
 * logo, name, tagline, address, and call / directions / website / share.
 */
import { useState } from 'react'
import { Globe, MapPin, Navigation, Phone, Share2, Star } from 'lucide-react'
import { toast } from 'sonner'
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

const action =
  'inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:border-primary/50 hover:text-primary'

export function BusinessHeader({ store, tagline, logoUrl }: {
  readonly store: StoreHeaderStore
  readonly tagline: string
  readonly logoUrl: string | null
}) {
  const address = storeAddress(store)
  const directions = directionsUrl(store)
  const website = websiteUrl(store)
  const rating = typeof store.averageRating === 'number' ? store.averageRating : null
  // A logo that fails to load falls back to initials rather than an empty box.
  const [logoFailed, setLogoFailed] = useState(false)

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

  return (
    <header className="sf-header">
      {logoUrl && !logoFailed ? (
        <img
          src={logoUrl}
          onError={() => setLogoFailed(true)}
          alt={`${store.name} logo`}
          className="h-16 w-16 rounded-2xl object-cover ring-1 ring-border sm:h-20 sm:w-20"
        />
      ) : (
        <div
          className="sf-heading flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-bold sm:h-20 sm:w-20"
          style={{ background: 'var(--sf-primary)', color: 'var(--sf-on-primary)' }}
          aria-hidden
        >
          {initials(store.name)}
        </div>
      )}

      <div className="min-w-0 space-y-1">
        <h1 className="sf-heading text-3xl font-bold leading-tight text-foreground text-balance sm:text-4xl">{store.name}</h1>
        {/* A tagline if the vendor wrote one; otherwise the start of their description, so a new store still reads as finished. */}
        {tagline || store.description ? (
          <p className="max-w-2xl text-base text-muted-foreground line-clamp-2">{tagline || store.description}</p>
        ) : null}
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          {rating !== null ? (
            <span className="inline-flex items-center gap-1 font-medium text-foreground">
              <Star className="h-4 w-4 fill-current" style={{ color: 'var(--sf-accent)' }} aria-hidden />
              {rating.toFixed(1)}
            </span>
          ) : null}
          {address ? (
            <span className="inline-flex min-w-0 items-center gap-1">
              <MapPin className="h-4 w-4 shrink-0" aria-hidden />
              <span className="truncate">{address}</span>
            </span>
          ) : null}
        </p>
      </div>

      <div className="sf-header-actions -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]" role="group" aria-label={`Contact ${store.name}`}>
        {store.phone ? (
          <a href={`tel:${store.phone}`} className={action}>
            <Phone className="h-4 w-4" aria-hidden />
            Call
          </a>
        ) : null}
        {directions ? (
          <a href={directions} target="_blank" rel="noopener noreferrer" className={action}>
            <Navigation className="h-4 w-4" aria-hidden />
            Directions
          </a>
        ) : null}
        {website ? (
          <a href={website} target="_blank" rel="noopener noreferrer" className={action}>
            <Globe className="h-4 w-4" aria-hidden />
            Website
          </a>
        ) : null}
        <button type="button" onClick={() => void share()} className={action}>
          <Share2 className="h-4 w-4" aria-hidden />
          Share
        </button>
      </div>
    </header>
  )
}
