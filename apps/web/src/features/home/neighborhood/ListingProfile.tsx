import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import '../discovery/discovery.css'
import { apiOrigin } from './loadDiscovery'
import { directionsUrl } from './directoryLinks'
import { ListingStories } from './ListingStories'

type Listing = {
  readonly name: string
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
  readonly nearby?: readonly { readonly id: string; readonly slug: string; readonly name: string; readonly categoryLabel: string; readonly distance: number }[]
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
  if (query.isLoading) return <p className="discover discover-lede">Looking up this place…</p>
  if (!query.data) return <p className="discover discover-lede">This place is not in the directory.</p>
  const listing = query.data
  const address = [listing.addressStreet, listing.addressCity, listing.addressState, listing.addressZip].filter(Boolean).join(', ')
  return (
    <div className="discover">
      <section className="discover-hero" aria-label={listing.name}>
        <div className="hero-copy">
          <p className="tile-kicker">{listing.categoryLabel}</p>
          <h1 className="discover-display">{listing.name}</h1>
          {address ? <p className="discover-where">{address}</p> : null}
          {listing.description ? <p className="discover-lede">{listing.description}</p> : null}
          {listing.phone ? <p className="discover-lede">{listing.phone}</p> : null}
          {listing.images && listing.images.length > 0 ? (
            <div className="place-gallery">{listing.images.map((url) => <img key={url} src={url} alt="" />)}</div>
          ) : null}
          <p className="directory-actions">
            {listing.store ? <Link to={`/kitchen/${listing.store.slug}`}>Shop {listing.store.name}</Link> : null}
            {listing.website ? <a href={listing.website} target="_blank" rel="noreferrer">Website</a> : null}
            {listing.latitude != null && listing.longitude != null ? <a href={directionsUrl(listing.latitude, listing.longitude)} target="_blank" rel="noreferrer">Directions</a> : null}
            {listing.neighborhood ? <Link to={`/neighborhoods/${listing.neighborhood.slug}`}>{listing.neighborhood.name}</Link> : null}
            {listing.city ? <Link to="/neighborhoods">{listing.city.name}</Link> : null}
          </p>
          {listing.neighborhoods && listing.neighborhoods.length > 0 ? (
            <p className="discover-lede">Also linked: {listing.neighborhoods.map((area) => area.name).join(', ')}</p>
          ) : null}
          {listing.nearby && listing.nearby.length > 0 ? (
            <>
              <p className="tile-kicker">Nearby</p>
              <ul className="hero-areas">
                {listing.nearby.map((place) => (
                  <li key={place.id}><Link to={`/directory/${place.slug}`}><strong>{place.name}</strong><span>{place.categoryLabel} · {place.distance.toFixed(1)} mi</span></Link></li>
                ))}
              </ul>
            </>
          ) : null}
          {listing.attribution ? <p className="discover-lede">{listing.attribution}</p> : null}
          <ListingStories latitude={listing.latitude} longitude={listing.longitude} />
        </div>
      </section>
    </div>
  )
}
