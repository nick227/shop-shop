import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@stores/authStore'
import '@features/home/discovery/discovery.css'

type Row = {
  readonly id: string
  readonly name: string
  readonly slug: string
  readonly headline: string | null
  readonly about: string | null
  readonly published: boolean
  readonly city: { readonly name: string; readonly state: string | null } | null
  readonly postalCodes: readonly string[]
  readonly imageUrls: readonly string[]
}

export default function AdminNeighborhoodPreviewPage() {
  const { id = '' } = useParams()
  const token = useAuthStore((state) => state.token)
  const query = useQuery({
    queryKey: ['admin-neighborhood-preview', id],
    enabled: id.length > 0,
    queryFn: async () => {
      const response = await fetch(`${(import.meta.env.VITE_API_URL || '').replace(/\/$/, '')}/api/admin/neighborhoods`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error('Failed to load neighborhoods')
      const body = await response.json() as { neighborhoods: Row[] }
      return body.neighborhoods.find((row) => row.id === id) ?? null
    },
  })
  const area = query.data
  if (!area) return <p className="p-6 text-sm">{query.isLoading ? 'Loading preview…' : 'Neighborhood not found'}</p>
  return (
    <div className="discover p-4">
      <section className="discover-hero" aria-label={area.name}>
        <div className="hero-copy">
          <p className="tile-kicker">{area.published ? 'Published preview' : 'Draft preview'}</p>
          <h1 className="discover-display">{area.name}</h1>
          <p className="discover-where">{area.city ? `${area.city.name}${area.city.state ? `, ${area.city.state}` : ''}` : 'Austin'}</p>
          {area.headline ? <p className="discover-lede">{area.headline}</p> : <p className="discover-lede">No headline yet.</p>}
          {area.about ? <p className="discover-lede">{area.about}</p> : <p className="discover-lede">No description yet. Drafts without a headline and description stay unpublished.</p>}
          {area.imageUrls.length > 0 ? <div className="place-gallery">{area.imageUrls.map((url) => <img key={url} src={url} alt="" />)}</div> : null}
          {area.postalCodes.length > 0 ? <p className="discover-lede">ZIP codes: {area.postalCodes.join(', ')}. A ZIP can cover more than one neighborhood.</p> : null}
          {area.published ? <Link to={`/neighborhoods/${area.slug}`}>Open the public page</Link> : null}
        </div>
      </section>
    </div>
  )
}
