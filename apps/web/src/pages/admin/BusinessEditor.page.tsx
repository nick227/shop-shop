import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@stores/authStore'
import { Button } from '@shared/ui/primitives'

type Listing = {
  readonly id: string
  readonly name: string
  readonly slug: string
  readonly category: string
  readonly categoryLabel: string
  readonly phone: string | null
  readonly website: string | null
  readonly description: string | null
  readonly addressStreet: string | null
  readonly addressCity: string | null
  readonly addressState: string | null
  readonly addressZip: string | null
  readonly published: boolean
  readonly featured: boolean
  readonly source: string
  readonly sourceId: string
  readonly sourceFetchedAt: string
  readonly place: { readonly id: string; readonly name: string } | null
  readonly store: { readonly id: string; readonly name: string; readonly slug: string } | null
  readonly images: readonly string[]
  readonly videos: readonly string[]
  readonly neighborhoods: readonly { readonly id: string; readonly name: string; readonly featured: boolean }[]
  readonly imports: readonly { readonly id: string; readonly submittedName: string; readonly status: string; readonly batchId: string }[]
}

type Draft = {
  name: string
  category: string
  categoryLabel: string
  phone: string
  website: string
  description: string
  addressStreet: string
  addressCity: string
  addressState: string
  addressZip: string
  published: boolean
  featured: boolean
  imageUrls: string
  videoUrls: string
  neighborhoodIds: string[]
  featuredNeighborhoodIds: string[]
  storeId: string
  dropId: string
}

function apiBase() {
  return (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
}

function fromListing(listing: Listing): Draft {
  return {
    name: listing.name,
    category: listing.category,
    categoryLabel: listing.categoryLabel,
    phone: listing.phone ?? '',
    website: listing.website ?? '',
    description: listing.description ?? '',
    addressStreet: listing.addressStreet ?? '',
    addressCity: listing.addressCity ?? '',
    addressState: listing.addressState ?? '',
    addressZip: listing.addressZip ?? '',
    published: listing.published,
    featured: listing.featured,
    imageUrls: listing.images.join('\n'),
    videoUrls: listing.videos.join('\n'),
    neighborhoodIds: listing.neighborhoods.map((area) => area.id),
    featuredNeighborhoodIds: listing.neighborhoods.filter((area) => area.featured).map((area) => area.id),
    storeId: listing.store?.id ?? '',
    dropId: '',
  }
}

export default function AdminBusinessEditorPage() {
  const { id = '' } = useParams()
  const token = useAuthStore((state) => state.token)
  const queryClient = useQueryClient()
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
  const [draft, setDraft] = useState<Draft | null>(null)
  const [error, setError] = useState<string | undefined>()
  const [areaQuery, setAreaQuery] = useState('')
  const detail = useQuery({
    queryKey: ['admin-business', id],
    enabled: id.length > 0,
    queryFn: async () => {
      const response = await fetch(`${apiBase()}/api/admin/businesses/${id}`, { headers })
      if (!response.ok) throw new Error('Listing not found')
      return response.json() as Promise<{ listing: Listing }>
    },
  })
  const areas = useQuery({
    queryKey: ['admin-neighborhood-names'],
    queryFn: async () => {
      const response = await fetch(`${apiBase()}/api/admin/neighborhoods`, { headers })
      if (!response.ok) return { neighborhoods: [] as { id: string; name: string }[] }
      return response.json() as Promise<{ neighborhoods: { id: string; name: string }[] }>
    },
  })
  const listing = detail.data?.listing
  const form = draft ?? (listing ? fromListing(listing) : null)
  if (!form || !listing) return <p className="p-6 text-sm">{detail.isLoading ? 'Loading…' : 'Listing not found'}</p>
  const set = (patch: Partial<Draft>) => setDraft({ ...form, ...patch })
  const lines = (value: string) => value.split('\n').map((line) => line.trim()).filter((line) => line.length > 0)
  const save = async () => {
    setError(undefined)
    const response = await fetch(`${apiBase()}/api/admin/businesses/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        ...form,
        placeId: listing.place?.id ?? null,
        storeId: form.storeId || null,
        imageUrls: lines(form.imageUrls),
        videoUrls: lines(form.videoUrls),
      }),
    })
    const body = await response.json().catch(() => ({})) as { error?: string }
    if (!response.ok) { setError(body.error || 'Save failed'); return }
    setDraft(null)
    await queryClient.invalidateQueries({ queryKey: ['admin-business', id] })
  }
  const merge = async () => {
    const response = await fetch(`${apiBase()}/api/admin/businesses/merge`, { method: 'POST', headers, body: JSON.stringify({ keepId: id, dropId: form.dropId }) })
    const body = await response.json().catch(() => ({})) as { error?: string }
    if (!response.ok) { setError(body.error || 'Merge failed'); return }
    setDraft(null)
    await queryClient.invalidateQueries({ queryKey: ['admin-business', id] })
  }
  const matches = areaQuery.trim().length < 2 ? [] : (areas.data?.neighborhoods ?? []).filter((area) => area.name.toLowerCase().includes(areaQuery.toLowerCase())).slice(0, 8)
  return (
    <div className="space-y-4 p-4 md:p-6">
      <Link className="text-sm underline" to="/admin/businesses">All listings</Link>
      <h1 className="text-xl font-semibold">{listing.name}</h1>
      <p className="text-sm text-muted-foreground">Source {listing.source} · {listing.sourceId} · fetched {listing.sourceFetchedAt}</p>
      <p className="text-sm"><Link className="underline" to={`/directory/${listing.slug}`}>Public page</Link></p>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div className="grid gap-3 md:grid-cols-2">
        <input className="rounded-md border border-border px-3 py-2 text-sm" value={form.name} onChange={(event) => set({ name: event.target.value })} />
        <input className="rounded-md border border-border px-3 py-2 text-sm" value={form.categoryLabel} onChange={(event) => set({ categoryLabel: event.target.value })} />
        <input className="rounded-md border border-border px-3 py-2 text-sm" value={form.category} onChange={(event) => set({ category: event.target.value })} />
        <input className="rounded-md border border-border px-3 py-2 text-sm" placeholder="Phone" value={form.phone} onChange={(event) => set({ phone: event.target.value })} />
        <input className="rounded-md border border-border px-3 py-2 text-sm md:col-span-2" placeholder="Website" value={form.website} onChange={(event) => set({ website: event.target.value })} />
        <input className="rounded-md border border-border px-3 py-2 text-sm md:col-span-2" placeholder="Street" value={form.addressStreet} onChange={(event) => set({ addressStreet: event.target.value })} />
        <input className="rounded-md border border-border px-3 py-2 text-sm" placeholder="City" value={form.addressCity} onChange={(event) => set({ addressCity: event.target.value })} />
        <input className="rounded-md border border-border px-3 py-2 text-sm" placeholder="ST" value={form.addressState} onChange={(event) => set({ addressState: event.target.value })} />
        <input className="rounded-md border border-border px-3 py-2 text-sm" placeholder="ZIP" value={form.addressZip} onChange={(event) => set({ addressZip: event.target.value })} />
        <input className="rounded-md border border-border px-3 py-2 text-sm" placeholder="Merchant id" value={form.storeId} onChange={(event) => set({ storeId: event.target.value })} />
      </div>
      <textarea className="min-h-24 w-full rounded-md border border-border px-3 py-2 text-sm" placeholder="Description you wrote" value={form.description} onChange={(event) => set({ description: event.target.value })} />
      <textarea className="min-h-20 w-full rounded-md border border-border px-3 py-2 text-sm" placeholder="Image URLs, one per line" value={form.imageUrls} onChange={(event) => set({ imageUrls: event.target.value })} />
      <textarea className="min-h-16 w-full rounded-md border border-border px-3 py-2 text-sm" placeholder="Video URLs, one per line" value={form.videoUrls} onChange={(event) => set({ videoUrls: event.target.value })} />
      <label className="flex gap-2 text-sm"><input type="checkbox" checked={form.published} onChange={(event) => set({ published: event.target.checked })} /> Published</label>
      <label className="flex gap-2 text-sm"><input type="checkbox" checked={form.featured} onChange={(event) => set({ featured: event.target.checked })} /> Featured in city discovery</label>
      <div>
        <input className="rounded-md border border-border px-3 py-2 text-sm" placeholder="Link a neighborhood" value={areaQuery} onChange={(event) => setAreaQuery(event.target.value)} />
        <ul className="mt-2 space-y-1 text-sm">
          {matches.map((area) => (
            <li key={area.id}><button type="button" className="underline" onClick={() => set({ neighborhoodIds: form.neighborhoodIds.includes(area.id) ? form.neighborhoodIds : [...form.neighborhoodIds, area.id] })}>{area.name}</button></li>
          ))}
        </ul>
        <ul className="mt-2 space-y-1 text-sm">
          {form.neighborhoodIds.map((areaId) => (
            <li key={areaId} className="flex gap-3">
              <span>{(areas.data?.neighborhoods ?? []).find((area) => area.id === areaId)?.name ?? areaId}</span>
              <button type="button" onClick={() => set({ featuredNeighborhoodIds: form.featuredNeighborhoodIds.includes(areaId) ? form.featuredNeighborhoodIds.filter((item) => item !== areaId) : [...form.featuredNeighborhoodIds, areaId] })}>{form.featuredNeighborhoodIds.includes(areaId) ? 'Featured' : 'Feature here'}</button>
              <button type="button" onClick={() => set({ neighborhoodIds: form.neighborhoodIds.filter((item) => item !== areaId), featuredNeighborhoodIds: form.featuredNeighborhoodIds.filter((item) => item !== areaId) })}>Remove</button>
            </li>
          ))}
        </ul>
      </div>
      <Button size="small" onClick={save}>Save</Button>
      <div className="flex gap-2">
        <input className="rounded-md border border-border px-3 py-2 text-sm" placeholder="Duplicate listing id to merge in" value={form.dropId} onChange={(event) => set({ dropId: event.target.value })} />
        <Button size="small" variant="outline" disabled={form.dropId.length === 0} onClick={merge}>Merge into this listing</Button>
      </div>
      {listing.imports.length > 0 ? (
        <ul className="text-sm text-muted-foreground">
          {listing.imports.map((entry) => <li key={entry.id}>{entry.submittedName} · {entry.status} · batch {entry.batchId}</li>)}
        </ul>
      ) : null}
    </div>
  )
}
