import { Link } from 'react-router-dom'
import { directionsUrl } from './directoryLinks'

export type DirectoryListing = {
  readonly id: string
  readonly slug: string
  readonly name: string
  readonly categoryLabel: string
  readonly addressStreet: string | null
  readonly distance: number
  readonly website: string | null
  readonly latitude: number | null
  readonly longitude: number | null
  readonly attribution: string | null
}

export function DirectoryList({ listings }: { readonly listings: readonly DirectoryListing[] }) {
  if (listings.length === 0) return null
  const credit = listings.find((listing) => listing.attribution)?.attribution
  return (
    <section className="discover-hero" aria-label="Directory">
      <div className="hero-copy">
        <p className="tile-kicker">Directory</p>
        <ul className="hero-areas">
          {listings.slice(0, 12).map((listing) => (
            <li key={listing.id}>
              <span>
                <strong>{listing.name}</strong>
                {' · '}{listing.categoryLabel}
                {listing.addressStreet ? ` · ${listing.addressStreet}` : ''}
                {` · ${listing.distance.toFixed(1)} mi`}
              </span>
              <span className="directory-actions">
                <Link to={`/directory/${listing.slug}`}>View details</Link>
                {listing.website ? <a href={listing.website} target="_blank" rel="noreferrer">Website</a> : null}
                {listing.latitude != null && listing.longitude != null ? <a href={directionsUrl(listing.latitude, listing.longitude)} target="_blank" rel="noreferrer">Directions</a> : null}
              </span>
            </li>
          ))}
        </ul>
        {credit ? <p className="discover-lede">{credit}</p> : null}
      </div>
    </section>
  )
}
