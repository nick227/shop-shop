/**
 * Business content below the menu: about, hours and location; the photo gallery; and the store's updates.
 */
import type { ReactNode } from 'react'
import { Mail, Phone } from 'lucide-react'
import type { StoreSocialLinks } from '@api/types'
import type { StoreHeaderStore } from '@features/stores/components/StoreHeader/storeHeaderTypes'
import { StoreHeaderSocialRow } from '@features/stores/components/StoreHeader/StoreHeaderSocialRow'
import { StorePreviewMap } from '@features/stores/components/StoreMap/StorePreviewMap'
import type { StorefrontHours, StorefrontMedia } from '../api'
import { WeeklyHours } from './OrderingStrip'
import { directionsUrl, storeAddress } from './BusinessHeader'

function socialEntries(links: StoreHeaderStore['socialLinksJson']): [keyof StoreSocialLinks, string][] {
  if (!links) return []
  return Object.entries(links).filter(([, value]) => typeof value === 'string' && value.length > 0) as [
    keyof StoreSocialLinks,
    string,
  ][]
}

function Heading({ id, children }: { readonly id: string; readonly children: ReactNode }) {
  return (
    <h2 id={id} className="sf-heading text-xl font-bold text-foreground">
      {children}
    </h2>
  )
}

export function AboutSection({ store, hours, showMap }: {
  readonly store: StoreHeaderStore
  readonly hours: StorefrontHours | null
  /** Maps load tiles from the network; the editor preview leaves them out. */
  readonly showMap: boolean
}) {
  const address = storeAddress(store)
  const social = socialEntries(store.socialLinksJson)
  if (!store.description && !address && !hours?.week && !store.phone && !store.email && social.length === 0) return null

  return (
    <section aria-labelledby="sf-about" className="space-y-4">
      <Heading id="sf-about">About {store.name}</Heading>
      <div className="sf-about">
        <div className="space-y-4">
          {store.description ? (
            <p className="whitespace-pre-line text-base leading-relaxed text-muted-foreground">{store.description}</p>
          ) : null}
          <ContactList phone={store.phone} email={store.email} />
          {social.length > 0 ? <StoreHeaderSocialRow entries={social} /> : null}
        </div>
        <div className="space-y-4">
          {hours?.week ? (
            <div>
              <h3 className="text-sm font-semibold">Hours</h3>
              <WeeklyHours week={hours.week} className="mt-2" />
            </div>
          ) : null}
          <LocationBlock store={store} showMap={showMap} />
        </div>
      </div>
    </section>
  )
}

export function GallerySection({ media, storeName }: { readonly media: readonly StorefrontMedia[]; readonly storeName: string }) {
  const photos = media.filter((m) => m.kind !== 'VIDEO')
  if (photos.length === 0) return null
  return (
    <section aria-labelledby="sf-gallery" className="space-y-4">
      <Heading id="sf-gallery">Gallery</Heading>
      <ul className="sf-gallery">
        {photos.map((photo) => (
          <li key={photo.id}>
            <img
              src={photo.url}
              alt={photo.altText ?? `${storeName} photo`}
              loading="lazy"
              className="aspect-square w-full rounded-xl object-cover"
            />
          </li>
        ))}
      </ul>
    </section>
  )
}

export function UpdatesSection({ children }: { readonly children: ReactNode }) {
  return (
    <section aria-labelledby="sf-updates" className="space-y-4">
      <Heading id="sf-updates">Updates</Heading>
      {children}
    </section>
  )
}

function ContactList({ phone, email }: { readonly phone?: string | null; readonly email?: string | null }) {
  if (!phone && !email) return null
  return (
    <ul className="space-y-1.5 text-sm">
      {phone ? (
        <li className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-muted-foreground" aria-hidden />
          <a href={`tel:${phone}`} className="font-medium hover:text-primary">
            {phone}
          </a>
        </li>
      ) : null}
      {email ? (
        <li className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" aria-hidden />
          <a href={`mailto:${email}`} className="font-medium hover:text-primary">
            {email}
          </a>
        </li>
      ) : null}
    </ul>
  )
}

function LocationBlock({ store, showMap }: { readonly store: StoreHeaderStore; readonly showMap: boolean }) {
  const address = storeAddress(store)
  if (!address) return null
  const directions = directionsUrl(store)
  const hasCoords = Boolean(store.latitude && store.longitude)
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">Location</h3>
      <p className="text-sm text-muted-foreground">{address}</p>
      {directions ? (
        <a href={directions} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline">
          Get directions
        </a>
      ) : null}
      {showMap && hasCoords ? (
        <div className="overflow-hidden rounded-xl border border-border">
          <StorePreviewMap latitude={store.latitude!} longitude={store.longitude!} height="200px" zoom={15} />
        </div>
      ) : null}
    </div>
  )
}
