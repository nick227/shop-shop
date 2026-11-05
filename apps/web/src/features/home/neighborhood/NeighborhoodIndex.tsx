import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import '../discovery/discovery.css'
import { apiOrigin } from './loadDiscovery'
import { neighborhoodPath } from './neighborhoodHero'
import { PlaceCard } from './PlaceCard'

type Row = {
  readonly id: string
  readonly name: string
  readonly slug: string
  readonly headline: string | null
  readonly city: { readonly name: string; readonly state: string | null } | null
  readonly postalCodes: readonly string[]
  readonly coverUrl: string | null
}

export function NeighborhoodIndex() {
  const [q, setQ] = useState('')
  const [submitted, setSubmitted] = useState('')
  const query = useQuery({
    queryKey: ['published-neighborhoods', submitted],
    queryFn: async () => {
      const params = submitted ? `?q=${encodeURIComponent(submitted)}` : ''
      const response = await fetch(`${apiOrigin()}/api/places/neighborhoods${params}`)
      if (!response.ok) throw new Error('Could not load neighborhoods')
      return response.json() as Promise<{ neighborhoods: Row[] }>
    },
  })
  const rows = query.data?.neighborhoods ?? []
  return (
    <div className="discover">
      <p className="tile-kicker">Austin</p>
      <h1 className="business-name">Neighborhoods</h1>
      <p className="discover-lede">Published neighborhoods. A ZIP can include more than one, so this list does not decide where you are.</p>
      <form className="explore-search" onSubmit={(event) => { event.preventDefault(); setSubmitted(q.trim()) }}>
        <input value={q} placeholder="Name, city, or ZIP" onChange={(event) => setQ(event.target.value)} />
        <button type="submit">Search</button>
      </form>
      <div className="place-mosaic">
        {rows.map((area) => (
          <PlaceCard
            key={area.id}
            place={{
              id: area.id,
              href: neighborhoodPath(area.slug),
              name: area.name,
              categoryLabel: 'Neighborhood',
              meta: [area.headline, area.city?.name, area.postalCodes.join(', ')].filter(Boolean).join(' · '),
              imageUrl: area.coverUrl,
            }}
          />
        ))}
      </div>
      {query.isSuccess && rows.length === 0 ? <p className="discover-lede">No published neighborhoods match.</p> : null}
      <p className="discover-lede"><Link to="/explore">Explore businesses</Link></p>
    </div>
  )
}
