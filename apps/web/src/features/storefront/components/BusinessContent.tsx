/**
 * Business content below the menu: about (story + hours), compact photos, updates.
 * Address lives in the identity strip under the hero — not repeated here.
 */
import type { ReactNode } from 'react'
import { publicStoreEmail } from '@features/stores/publicEmail'
import { Mail, Phone } from 'lucide-react'
import type { StoreSocialLinks } from '@api/types'
import type { StoreHeaderStore } from '@features/stores/components/StoreHeader/storeHeaderTypes'
import { StoreHeaderSocialRow } from '@features/stores/components/StoreHeader/StoreHeaderSocialRow'
import type { StorefrontHours, StorefrontMedia } from '../api'
import { WeeklyHours } from './OrderingStrip'

function socialEntries(links: StoreHeaderStore['socialLinksJson']): [keyof StoreSocialLinks, string][] {
  if (!links) return []
  return Object.entries(links).filter(([, value]) => typeof value === 'string' && value.length > 0) as [
    keyof StoreSocialLinks,
    string,
  ][]
}

function Heading({ id, children }: { readonly id: string; readonly children: ReactNode }) {
  return (
    <h2 id={id} className="sf-heading text-lg font-bold text-foreground">
      {children}
    </h2>
  )
}

export function AboutSection({ store, hours }: {
  readonly store: StoreHeaderStore
  readonly hours: StorefrontHours | null
}) {
  const social = socialEntries(store.socialLinksJson)
  const email = publicStoreEmail(store)
  const story = Boolean(store.description || store.phone || email || social.length > 0)
  if (!story && !hours?.week) return null

  return (
    <section aria-labelledby="sf-about" className="space-y-3">
      <Heading id="sf-about">{story ? `About ${store.name}` : 'Hours'}</Heading>
      <div className={story && hours?.week ? 'sf-about' : 'sf-about is-single'}>
        {story ? (
          <div className="space-y-3">
            {store.description ? (
              <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground sm:text-base">{store.description}</p>
            ) : null}
            <ContactList phone={store.phone} email={email} />
            {social.length > 0 ? <StoreHeaderSocialRow entries={social} /> : null}
          </div>
        ) : null}
        {hours?.week ? (
          <div>
            {story ? <h3 className="text-sm font-semibold">Hours</h3> : null}
            <WeeklyHours week={hours.week} className={story ? 'mt-2' : undefined} />
          </div>
        ) : null}
      </div>
    </section>
  )
}

/** Small square thumbs. Skips the hero cover so the same photo is not shown twice. */
export function GallerySection({ media, storeName, excludeUrl }: {
  readonly media: readonly StorefrontMedia[]
  readonly storeName: string
  readonly excludeUrl?: string | null
}) {
  const photos = media.filter((m) => m.kind !== 'VIDEO' && m.url !== excludeUrl)
  if (photos.length === 0) return null
  return (
    <section aria-labelledby="sf-gallery" className="space-y-2.5">
      <Heading id="sf-gallery">Photos</Heading>
      <ul className="sf-gallery">
        {photos.map((photo) => (
          <li key={photo.id}>
            <img
              src={photo.url}
              alt={photo.altText ?? `${storeName} photo`}
              loading="lazy"
              className="sf-gallery-thumb"
            />
          </li>
        ))}
      </ul>
    </section>
  )
}

export function UpdatesSection({ children }: { readonly children: ReactNode }) {
  return (
    <section aria-labelledby="sf-updates" className="space-y-3">
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
