import { Link, Navigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import '../discovery/discovery.css'
import { apiOrigin } from './loadDiscovery'
import { directionsUrl } from './directoryLinks'
import { placeCardFromListing } from './PlaceCard'
import { PlaceGrid, PlaceSkeleton } from './PlaceGrid'
import { placeTone } from './placeTone'

type Nearby = {
  readonly id: string
  readonly slug: string
  readonly name: string
  readonly categoryLabel: string
  readonly distance: number
}

type Listing = {
  readonly name: string
  readonly slug?: string
  readonly category?: string
  readonly categoryLabel: string
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

export function ListingProfile() {
  const { slug } = useParams()
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
  if (listing.store) return <Navigate to={`/kitchen/${listing.store.slug}`} replace />
  const address = [listing.addressStreet, listing.addressCity, listing.addressState, listing.addressZip].filter(Boolean).join(', ')
  const directions = listing.latitude != null && listing.longitude != null ? directionsUrl(listing.latitude, listing.longitude) : null
  const images = listing.images ?? []
  const areas = [
    ...(listing.neighborhood ? [listing.neighborhood] : []),
    ...(listing.neighborhoods ?? []).filter((area) => area.slug !== listing.neighborhood?.slug),
  ]
  const initials = listing.name.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]?.toUpperCase() ?? '').join('')
  return (
    <div className="discover business-page">
      <header className="business-head">
        <span className={`place-mark tone-${placeTone(listing.category, listing.categoryLabel)}`} aria-hidden><strong>{initials}</strong></span>
        <div>
          <p className="tile-kicker">{listing.categoryLabel}</p>
          <h1 className="business-name">{listing.name}</h1>
          {address ? <p className="discover-where">{address}</p> : null}
        </div>
        <div className="business-actions">
          {listing.phone ? <a href={`tel:${listing.phone}`}>Call</a> : null}
          {listing.website ? <a href={listing.website} target="_blank" rel="noreferrer">Website</a> : null}
          {directions ? <a href={directions} target="_blank" rel="noreferrer">Directions</a> : null}
          {listing.city ? <Link to="/neighborhoods">{listing.city.name}</Link> : null}
        </div>
      </header>
      {images.length > 0 ? (
        <div className="business-mosaic">{images.map((url) => <img key={url} src={url} alt="" />)}</div>
      ) : null}
      {(listing.videos ?? []).map((url) => <video key={url} className="business-video" src={url} controls playsInline />)}
      {listing.description ? <p className="discover-lede">{listing.description}</p> : null}
      {areas.length > 0 ? (
        <p className="discover-lede">
          {areas.map((area, index) => (
            <span key={area.slug}>{index > 0 ? ' · ' : null}<Link to={`/neighborhoods/${area.slug}`}>{area.name}</Link></span>
          ))}
        </p>
      ) : null}
      <PlaceGrid
        label="Nearby"
        places={(listing.nearby ?? []).map((place) => placeCardFromListing(place))}
      />
      {listing.attribution ? <p className="discover-lede">{listing.attribution}</p> : null}
    </div>
  )
}
