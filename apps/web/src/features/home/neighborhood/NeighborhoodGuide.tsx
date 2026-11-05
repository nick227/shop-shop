import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { apiOrigin } from './loadDiscovery'

type GuideListing = {
  readonly id: string
  readonly slug: string
  readonly name: string
  readonly categoryLabel: string
  readonly addressStreet: string | null
  readonly website: string | null
  readonly phone: string | null
  readonly latitude: number | null
  readonly longitude: number | null
  readonly distance: number | null
}

type Guide = {
  readonly note: string
  readonly sections: readonly { readonly id: string; readonly title: string; readonly listings: readonly GuideListing[] }[]
}

function directionsUrl(listing: GuideListing): string | null {
  if (listing.latitude == null || listing.longitude == null) return null
  return `https://www.google.com/maps/dir/?api=1&destination=${listing.latitude},${listing.longitude}`
}

function GuideSection({ title, listings }: { readonly title: string; readonly listings: readonly GuideListing[] }) {
  return (
    <section className="surface-band" aria-label={title}>
      <div className="surface-head">
        <h2 className="surface-title">{title}</h2>
      </div>
      <div className="feed-row-directory">
        {listings.map((listing) => {
          const miles = listing.distance == null ? null : `${listing.distance.toFixed(1)} mi`
          const directions = directionsUrl(listing)
          return (
            <article key={listing.id} className="directory-row">
              <Link className="directory-row-name" to={`/directory/${listing.slug}`}>
                <strong>{listing.name}</strong>
                <span>{[listing.categoryLabel, listing.addressStreet, miles].filter(Boolean).join(' · ')}</span>
              </Link>
              <span className="directory-row-actions">
                {listing.phone ? <a href={`tel:${listing.phone}`}>Call</a> : null}
                {directions ? <a href={directions} target="_blank" rel="noreferrer">Directions</a> : null}
                {listing.website ? <a href={listing.website} target="_blank" rel="noreferrer">Website</a> : null}
              </span>
            </article>
          )
        })}
      </div>
    </section>
  )
}

export function NeighborhoodGuide({ slug }: { readonly slug: string }) {
  const query = useQuery({
    queryKey: ['neighborhood-guide', slug],
    enabled: slug.length > 0,
    queryFn: async () => {
      const response = await fetch(`${apiOrigin()}/api/places/${slug}/guide`)
      if (response.status === 404) return null
      if (!response.ok) throw new Error('Could not load neighborhood places')
      return response.json() as Promise<Guide>
    },
  })
  const guide = query.data
  if (!guide) return null
  return (
    <div>
      <p className="discover-lede">{guide.note}</p>
      {guide.sections.map((section) => (
        <GuideSection key={section.id} title={section.title} listings={section.listings} />
      ))}
      <p className="discover-lede"><Link to="/explore">Explore more nearby</Link></p>
    </div>
  )
}
