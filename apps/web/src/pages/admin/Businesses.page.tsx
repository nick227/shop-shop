import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@stores/authStore'
import { Button } from '@shared/ui/primitives'
import { AdminTable } from '@layouts/AdminLayout'
import { Building2 } from 'lucide-react'

type Row = {
  readonly id: string
  readonly name: string
  readonly categoryLabel: string
  readonly addressCity: string | null
  readonly addressZip: string | null
  readonly published: boolean
  readonly featured: boolean
  readonly source: string
  readonly completeness: number
  readonly place: { readonly name: string } | null
}

function apiBase() {
  return (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
}

export default function AdminBusinessesPage() {
  const token = useAuthStore((state) => state.token)
  const queryClient = useQueryClient()
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
  const [q, setQ] = useState('')
  const [zip, setZip] = useState('')
  const [city, setCity] = useState('')
  const [category, setCategory] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [source, setSource] = useState('')
  const [published, setPublished] = useState('false')
  const [sort, setSort] = useState('imported')
  const [filters, setFilters] = useState({ q: '', zip: '', city: '', category: '', neighborhood: '', source: '', published: 'false', sort: 'imported' })
  const [picked, setPicked] = useState<string[]>([])
  const [error, setError] = useState<string | undefined>()

  const list = useQuery({
    queryKey: ['admin-businesses', filters],
    queryFn: async () => {
      const params = new URLSearchParams({ sort: filters.sort, take: '40' })
      if (filters.q) params.set('q', filters.q)
      if (filters.zip) params.set('zip', filters.zip)
      if (filters.city) params.set('city', filters.city)
      if (filters.category) params.set('category', filters.category)
      if (filters.neighborhood) params.set('neighborhood', filters.neighborhood)
      if (filters.source) params.set('source', filters.source)
      if (filters.published) params.set('published', filters.published)
      const response = await fetch(`${apiBase()}/api/admin/businesses?${params}`, { headers })
      if (!response.ok) throw new Error('Failed to load listings')
      return response.json() as Promise<{ total: number; listings: Row[] }>
    },
  })

  const runBulk = async (action: 'publish' | 'unpublish' | 'feature' | 'unfeature') => {
    setError(undefined)
    const response = await fetch(`${apiBase()}/api/admin/businesses/bulk`, { method: 'POST', headers, body: JSON.stringify({ ids: picked, action }) })
    const body = await response.json().catch(() => ({})) as { error?: string }
    if (!response.ok) { setError(body.error || 'Bulk action failed'); return }
    setPicked([])
    await queryClient.invalidateQueries({ queryKey: ['admin-businesses'] })
  }

  const rows = list.data?.listings ?? []
  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Directory</h1>
        <Link className="text-sm underline" to="/admin/businesses/import">Import</Link>
      </div>
      <p className="text-sm text-muted-foreground">Imported listings stay unpublished until you publish them. Nothing goes on the public site without that step.</p>
      <form className="flex flex-wrap gap-2" onSubmit={(event) => { event.preventDefault(); setFilters({ q, zip, city, category, neighborhood, source, published, sort }) }}>
        <input className="rounded-md border border-border px-3 py-2 text-sm" placeholder="Business name" value={q} onChange={(event) => setQ(event.target.value)} />
        <input className="w-28 rounded-md border border-border px-3 py-2 text-sm" placeholder="City" value={city} onChange={(event) => setCity(event.target.value)} />
        <input className="w-24 rounded-md border border-border px-3 py-2 text-sm" placeholder="ZIP" value={zip} onChange={(event) => setZip(event.target.value)} />
        <input className="w-36 rounded-md border border-border px-3 py-2 text-sm" placeholder="Category" value={category} onChange={(event) => setCategory(event.target.value)} />
        <input className="w-40 rounded-md border border-border px-3 py-2 text-sm" placeholder="Neighborhood" value={neighborhood} onChange={(event) => setNeighborhood(event.target.value)} />
        <select className="rounded-md border border-border px-3 py-2 text-sm" value={source} onChange={(event) => setSource(event.target.value)}>
          <option value="">Any source</option>
          <option value="osm">OpenStreetMap</option>
          <option value="admin">Admin</option>
        </select>
        <select className="rounded-md border border-border px-3 py-2 text-sm" value={published} onChange={(event) => setPublished(event.target.value)}>
          <option value="">Any status</option>
          <option value="true">Published</option>
          <option value="false">Unpublished</option>
        </select>
        <select className="rounded-md border border-border px-3 py-2 text-sm" value={sort} onChange={(event) => setSort(event.target.value)}>
          <option value="name">Name</option>
          <option value="imported">Recently imported</option>
          <option value="updated">Last updated</option>
          <option value="completeness">Completeness</option>
        </select>
        <Button size="small" type="submit">Search</Button>
      </form>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div className="flex gap-2">
        <Button size="small" variant="outline" disabled={picked.length === 0} onClick={() => runBulk('publish')}>Publish</Button>
        <Button size="small" variant="outline" disabled={picked.length === 0} onClick={() => runBulk('unpublish')}>Unpublish</Button>
        <Button size="small" variant="outline" disabled={picked.length === 0} onClick={() => runBulk('feature')}>Feature</Button>
        <Button size="small" variant="outline" disabled={picked.length === 0} onClick={() => runBulk('unfeature')}>Unfeature</Button>
      </div>
      <p className="text-sm text-muted-foreground">{list.data ? `${list.data.total} listings` : ''}</p>
      <AdminTable
        columns={[{ label: '', className: 'px-4 py-3' }, { label: 'Business', className: 'px-4 py-3' }, { label: 'Place', className: 'px-4 py-3' }, { label: 'Status', className: 'px-4 py-3' }, { label: '', className: 'px-4 py-3' }]}
        rows={rows}
        isLoading={list.isLoading}
        emptyIcon={Building2}
        emptyTitle="No listings"
        emptyDescription="Search by name, ZIP, or category."
        getRowKey={(row) => row.id}
        renderRow={(row) => (
          <>
            <td className="px-4 py-3"><input type="checkbox" checked={picked.includes(row.id)} onChange={() => setPicked((current) => current.includes(row.id) ? current.filter((id) => id !== row.id) : [...current, row.id])} /></td>
            <td className="px-4 py-3 text-sm"><span className="font-medium">{row.name}</span><span className="block text-muted-foreground">{row.categoryLabel} · {row.completeness}/7 · {row.source}</span></td>
            <td className="px-4 py-3 text-sm">{[row.addressCity, row.addressZip, row.place?.name].filter(Boolean).join(' · ')}</td>
            <td className="px-4 py-3 text-sm">{row.published ? 'Published' : 'Draft'}{row.featured ? ' · Featured' : ''}</td>
            <td className="px-4 py-3 text-right"><Link className="text-sm underline" to={`/admin/businesses/${row.id}`}>Edit</Link></td>
          </>
        )}
      />
    </div>
  )
}
