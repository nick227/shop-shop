import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import '../discovery/discovery.css'
import { apiOrigin } from './loadDiscovery'
import { neighborhoodPath } from './neighborhoodHero'

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
      <section className="discover-hero" aria-label="Austin neighborhoods">
        <div className="hero-copy">
          <p className="tile-kicker">Austin</p>
          <h1 className="discover-display">Neighborhoods</h1>
          <p className="discover-lede">Browse published neighborhoods. A ZIP can include more than one, so this list does not decide where you are.</p>
          <form className="mt-4 flex gap-2" onSubmit={(event) => { event.preventDefault(); setSubmitted(q.trim()) }}>
            <input className="rounded-md border border-border bg-background px-3 py-2 text-sm" value={q} placeholder="Name, city, or ZIP" onChange={(event) => setQ(event.target.value)} />
            <button className="rounded-md border border-border px-3 py-2 text-sm" type="submit">Search</button>
          </form>
          <ul className="hero-areas">
            {rows.map((area) => (
              <li key={area.id}>
                <Link to={neighborhoodPath(area.slug)}>
                  <strong>{area.name}</strong>
                  <span>{[area.headline, area.city?.name, area.postalCodes.join(', ')].filter(Boolean).join(' · ')}</span>
                </Link>
                {area.coverUrl ? <img src={area.coverUrl} alt="" /> : null}
              </li>
            ))}
          </ul>
          {query.isSuccess && rows.length === 0 ? <p className="discover-lede">No published neighborhoods match.</p> : null}
        </div>
      </section>
    </div>
  )
}
