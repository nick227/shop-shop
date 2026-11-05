import { useQuery } from '@tanstack/react-query'
import { loadStories } from './loadDiscovery'

export function ListingStories({ latitude, longitude }: { readonly latitude: number | null; readonly longitude: number | null }) {
  const query = useQuery({
    queryKey: ['listing-stories', latitude, longitude],
    enabled: latitude != null && longitude != null,
    queryFn: () => loadStories({ latitude: latitude ?? 0, longitude: longitude ?? 0, radiusMiles: 5, source: 'manual' }),
  })
  const rows = (query.data ?? []).filter((story) => story.content).slice(0, 3)
  if (rows.length === 0) return null
  return (
    <>
      <p className="tile-kicker">Local stories</p>
      <ul className="hero-areas">
        {rows.map((story) => <li key={story.id}><span>{story.content}</span></li>)}
      </ul>
    </>
  )
}
