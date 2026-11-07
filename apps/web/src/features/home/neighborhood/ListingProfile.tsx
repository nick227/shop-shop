import { withDiscoveryOrigin } from '@features/discovery-navigation/context'
import { Navigate, useParams, useLocation } from 'react-router-dom'
import { DiscoveryLink as Link } from '@features/discovery-navigation/DiscoveryLink'
import { useQuery } from '@tanstack/react-query'
import { defaultStorefrontConfig, STOREFRONT_PALETTES, type StorefrontConfig } from '@packages/shared/storefront'
import type { StoreHeaderStore } from '@features/stores/components/StoreHeader/storeHeaderTypes'
import { Storefront } from '@features/storefront/Storefront'
import type { StorefrontData } from '@features/storefront/api'
import { apiOrigin } from './loadDiscovery'
import { PlaceSkeleton } from './PlaceGrid'
import { placeTone, type PlaceTone } from './placeTone'
import '../discovery/discovery.css'

type Nearby = {
  readonly id: string
  readonly slug: string
  readonly name: string
  readonly categoryLabel: string
  readonly distance: number
}

type Listing = {
  readonly id?: string
  readonly name: string
  readonly categoryLabel: string
  readonly primaryCategory?: string
  readonly categories?: readonly { slug: string; label: string }[]
  readonly category?: string
  readonly phone: string | null
  readonly website: string | null
  readonly description: string | null
  readonly addressStreet: string | null
  readonly addressCity: string | null
  readonly addressState: string | null
  readonly addressZip: string | null
  readonly latitude: number | null
  readonly longitude: number | null
  readonly attribution: string | null
  readonly images?: readonly string[]
  readonly videos?: readonly string[]
  readonly neighborhood?: { readonly name: string; readonly slug: string } | null
  readonly city?: { readonly name: string; readonly slug: string } | null
  readonly neighborhoods?: readonly { readonly name: string; readonly slug: string }[]
  readonly store?: { readonly name: string; readonly slug: string } | null
  readonly nearby?: readonly Nearby[]
}

const PALETTE: Record<PlaceTone, string> = {
  food: 'tomato',
  drink: 'espresso',
  shop: 'market',
  arts: 'harbor',
  outdoors: 'market',
  place: 'market',
}

function directoryConfig(listing: Listing, images: readonly string[]): StorefrontConfig {
  const base = defaultStorefrontConfig()
  const palette = STOREFRONT_PALETTES.find((item) => item.id === PALETTE[placeTone(listing.category, listing.categoryLabel)]) ?? STOREFRONT_PALETTES[0]
  return {
    ...base,
    brand: { ...base.brand, tagline: listing.categoryLabel, paletteId: palette.id, primary: palette.primary, accent: palette.accent },
    sections: base.sections.map((section) => ({
      ...section,
      visible: section.key === 'about' || (section.key === 'gallery' && images.length > 1),
    })),
  }
}

function directoryData(listing: Listing, images: readonly string[], videos: readonly string[]): StorefrontData {
  return {
    config: directoryConfig(listing, images),
    view: 'published',
    ordering: { acceptingOrders: false, message: null, pickupEnabled: false, deliveryEnabled: false, prepTimeMin: 0, deliveryCharge: null, deliveryDistanceMiles: null },
    hours: null,
    popularItemIds: [],
    media: [
      ...images.map((url, index) => ({ id: `photo-${index}`, url, kind: 'IMAGE', altText: null })),
      ...videos.map((url, index) => ({ id: `video-${index}`, url, kind: 'VIDEO', altText: null })),
    ],
    bundles: [],
  }
}

export function ListingProfile() {
  const { slug } = useParams()
  const location = useLocation()
  const query = useQuery({
    queryKey: ['directory-listing', slug],
    enabled: Boolean(slug),
    queryFn: async () => {
      const response = await fetch(`${apiOrigin()}/api/directory/listings/${slug}`)
      if (response.status === 404) return null
      if (!response.ok) throw new Error('Could not load this place')
      const body = await response.json() as { listing: Listing }
      return body.listing
    },
  })
  if (query.isLoading) return <div className="discover"><PlaceSkeleton /></div>
  if (!query.data) return <p className="discover discover-lede">This place is not in the directory.</p>
  const listing = query.data
  if (listing.store) return <Navigate to={withDiscoveryOrigin(`/kitchen/${listing.store.slug}`, location.pathname, location.search)} replace />
  const images = listing.images ?? []
  const data = directoryData(listing, images, listing.videos ?? [])
  const store = {
    id: listing.id ?? slug ?? listing.name,
    name: listing.name,
    category: listing.category,
    categories: listing.categories,
    primaryCategory: listing.primaryCategory,
    categoryLabel: listing.categoryLabel,
    city: listing.city,
    neighborhood: listing.neighborhood,
    phone: listing.phone,
    website: listing.website,
    description: listing.description,
    addressStreet: listing.addressStreet,
    addressCity: listing.addressCity,
    addressState: listing.addressState,
    addressZip: listing.addressZip,
    latitude: listing.latitude,
    longitude: listing.longitude,
    imageUrl: images[0] ?? null,
  } as unknown as StoreHeaderStore
  const areas = [
    ...(listing.neighborhood ? [listing.neighborhood] : []),
    ...(listing.neighborhoods ?? []).filter((area) => area.slug !== listing.neighborhood?.slug),
  ]
  return (
    <>
      <Storefront store={store} data={data} config={data.config} items={[]} sections={[]} bundles={[]} mode="live" stickyTop={60} commerce={false} />
      <div className="discover">
        {areas.length > 0 ? (
          <p className="discover-lede">
            {areas.map((area, index) => (
              <span key={area.slug}>{index > 0 ? ' · ' : null}<Link to={`/neighborhoods/${area.slug}`}>{area.name}</Link></span>
            ))}
            {listing.city ? <> · <Link to="/neighborhoods">{listing.city.name}</Link></> : null}
          </p>
        ) : null}
        {(listing.nearby ?? []).length > 0 ? (
          <section className="surface-band" aria-label="Nearby">
            <div className="surface-head">
              <h2 className="surface-title">Nearby</h2>
            </div>
            <div className="feed-row-directory">
              {(listing.nearby ?? []).map((place) => (
                <article key={place.id} className="directory-row">
                  <Link className="directory-row-name" to={`/directory/${place.slug}`}>
                    <strong>{place.name}</strong>
                    <span>{[place.categoryLabel, `${place.distance.toFixed(1)} mi`].filter(Boolean).join(' · ')}</span>
                  </Link>
                </article>
              ))}
            </div>
          </section>
        ) : null}
        {listing.attribution ? <p className="discover-lede">{listing.attribution}</p> : null}
      </div>
    </>
  )
}
