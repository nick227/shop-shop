import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { apiOrigin } from './loadDiscovery'

type GuideListing = {
  readonly id: string
  readonly slug: string
  readonly name: string
  readonly categoryLabel: string
  readonly addressStreet: string | null
  readonly merchant: boolean
}

type Guide = {
  readonly note: string
  readonly sections: readonly { readonly id: string; readonly title: string; readonly listings: readonly GuideListing[] }[]
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
    <section className="discover-hero" aria-label="Neighborhood places">
      <div className="hero-copy">
        <p className="discover-lede">{guide.note}</p>
        {guide.sections.map((section) => (
          <div key={section.id}>
            <p className="tile-kicker">{section.title}</p>
            <ul className="hero-areas">
              {section.listings.map((listing) => (
                <li key={listing.id}>
                  <Link to={`/directory/${listing.slug}`}>
                    <strong>{listing.name}</strong>
                    <span>{listing.categoryLabel}{listing.addressStreet ? ` · ${listing.addressStreet}` : ''}{listing.merchant ? ' · Shop' : ''}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
