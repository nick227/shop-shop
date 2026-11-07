/**
 * Storefront hero — cover photo with identity floated over it (home-hero style), map beside at 3/1.
 * Phone stacks. No photo → typographic panel. No map → photo (or type) fills the band.
 */
import { resolveBrowserAssetUrl } from '@shared/lib/utils/resolveBrowserAssetUrl'
import type { ReactNode } from 'react'
import { StorePreviewMap } from '@features/stores/components/StoreMap/StorePreviewMap'
import type { StoreHeaderStore } from '@features/stores/components/StoreHeader/storeHeaderTypes'
import { directionsUrl } from './BusinessHeader'

export function StorefrontHero({ store, imageUrl, showMap, identity }: {
  readonly store: StoreHeaderStore
  readonly imageUrl: string | null
  readonly showMap: boolean
  /** Name, address, and actions — rendered over the cover. */
  readonly identity: ReactNode
}) {
  const hasCoords = Boolean(store.latitude && store.longitude)
  const map = showMap && hasCoords
  if (!imageUrl && !map && !identity) return null

  const directions = directionsUrl(store)
  const dual = Boolean((imageUrl || identity) && map)
  const featureClass = [
    'sf-hero-feature',
    imageUrl ? 'has-photo' : 'is-typographic',
  ].join(' ')

  return (
    <section
      className={dual ? 'sf-hero' : 'sf-hero is-single'}
      aria-label={imageUrl ? `${store.name} photo and location` : `${store.name}`}
    >
      <div className={featureClass}>
        {imageUrl ? <img src={resolveBrowserAssetUrl(imageUrl)} alt="" className="sf-hero-cover" /> : null}
        <div className="sf-hero-body">{identity}</div>
      </div>
      {map ? (
        <div className="sf-hero-map">
          <StorePreviewMap latitude={store.latitude!} longitude={store.longitude!} height="100%" zoom={15} />
          {directions ? (
            <a
              href={directions}
              target="_blank"
              rel="noopener noreferrer"
              className="sf-hero-map-link"
            >
              Directions
            </a>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}

/** Cover for the hero: first store photo, else the store image. */
export function storefrontHeroImage(
  store: StoreHeaderStore,
  media: readonly { readonly url: string; readonly kind: string }[],
): string | null {
  const photo = media.find((asset) => asset.kind !== 'VIDEO' && asset.url)?.url
  if (photo) return photo
  return store.imageUrl?.trim() || null
}
