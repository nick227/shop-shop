import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { apiOrigin } from './loadDiscovery'
import { placeCardFromListing } from './PlaceCard'
import { PlaceGrid } from './PlaceGrid'

type GuideListing = {
  readonly id: string
  readonly slug: string
  readonly name: string
  readonly categoryLabel: string
  readonly addressStreet: string | null
  readonly merchant: boolean
  readonly distance: number | null
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
    <div className="place-stack">
      <p className="discover-lede">{guide.note}</p>
      {guide.sections.map((section) => (
        <PlaceGrid
          key={section.id}
          label={section.title}
          featureFirst={section.id === 'featured'}
          places={section.listings.map((listing) => placeCardFromListing({ ...listing, distance: listing.distance ?? undefined }))}
        />
      ))}
      <p className="discover-lede"><Link to="/explore">Explore more nearby</Link></p>
    </div>
  )
}
