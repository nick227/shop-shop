import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import '../discovery/discovery.css'
import { loadPublishedNeighborhoods } from './loadDiscovery'
import { PlaceCard, placeCardFromNeighborhood } from './PlaceCard'

export function NeighborhoodIndex() {
  const [q, setQ] = useState('')
  const [submitted, setSubmitted] = useState('')
  const query = useQuery({
    queryKey: ['published-neighborhoods', submitted],
    queryFn: () => loadPublishedNeighborhoods(submitted),
  })
  const rows = query.data ?? []
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
            place={placeCardFromNeighborhood(area)}
          />
        ))}
      </div>
      {query.isSuccess && rows.length === 0 ? <p className="discover-lede">No published neighborhoods match.</p> : null}
      <p className="discover-lede"><Link to="/explore">Explore businesses</Link></p>
    </div>
  )
}
