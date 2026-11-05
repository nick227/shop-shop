import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@stores/authStore'
import { Button } from '@shared/ui/primitives'
import { AdminTable } from '@layouts/AdminLayout'
import { MapPin } from 'lucide-react'
import { emptyNeighborhood, NeighborhoodForm, type CityOption, type NeighborhoodFormValue } from './NeighborhoodForm'

type NeighborhoodRow = {
  readonly id: string
  readonly name: string
  readonly slug: string
  readonly headline: string | null
  readonly about: string | null
  readonly published: boolean
  readonly city: { readonly id: string; readonly name: string; readonly state: string | null } | null
  readonly postalCodes: readonly string[]
  readonly imageUrls: readonly string[]
  readonly videoUrls: readonly string[]
  readonly ready: boolean
}

function apiBase() {
  return (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
}

function imageList(value: string): string[] {
  return value.split('\n').map((line) => line.trim()).filter((line) => line.length > 0)
}

export default function AdminNeighborhoodsPage() {
  const token = useAuthStore((state) => state.token)
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState<NeighborhoodFormValue | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState<string | undefined>()
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  const cities = useQuery({
    queryKey: ['admin-neighborhood-cities'],
    queryFn: async () => {
      const response = await fetch(`${apiBase()}/api/admin/neighborhoods/cities`, { headers })
      if (!response.ok) throw new Error('Failed to load cities')
      return response.json() as Promise<{ cities: CityOption[] }>
    },
  })

  const list = useQuery({
    queryKey: ['admin-neighborhoods'],
    queryFn: async () => {
      const response = await fetch(`${apiBase()}/api/admin/neighborhoods`, { headers })
      if (!response.ok) throw new Error('Failed to load neighborhoods')
      return response.json() as Promise<{ neighborhoods: NeighborhoodRow[] }>
    },
  })

  const save = useMutation({
    mutationFn: async (value: NeighborhoodFormValue) => {
      const payload = {
        name: value.name,
        parentId: value.parentId,
        postalCodes: value.postalCodes,
        headline: value.headline,
        about: value.about,
        imageUrls: imageList(value.imageUrls),
        videoUrls: imageList(value.videoUrls),
        published: value.published,
      }
      const response = await fetch(`${apiBase()}/api/admin/neighborhoods${editingId ? `/${editingId}` : ''}`, {
        method: editingId ? 'PATCH' : 'POST',
        headers,
        body: JSON.stringify(payload),
      })
      const body = await response.json().catch(() => ({})) as { error?: string }
      if (!response.ok) throw new Error(body.error || 'Could not save neighborhood')
    },
    onSuccess: async () => {
      setDraft(null)
      setEditingId(null)
      setError(undefined)
      await queryClient.invalidateQueries({ queryKey: ['admin-neighborhoods'] })
    },
    onError: (caught: Error) => setError(caught.message),
  })

  const rows = list.data?.neighborhoods ?? []
  const cityOptions = cities.data?.cities ?? []
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const [picked, setPicked] = useState<string[]>([])
  const shown = rows.filter((row) => {
    const text = `${row.name} ${row.city?.name ?? ''} ${row.postalCodes.join(' ')}`.toLowerCase()
    if (q && !text.includes(q.toLowerCase())) return false
    if (status === 'published') return row.published
    if (status === 'draft') return !row.published
    return true
  })
  const publishPicked = async () => {
    const response = await fetch(`${apiBase()}/api/admin/neighborhoods/publish`, { method: 'POST', headers, body: JSON.stringify({ ids: picked }) })
    const body = await response.json().catch(() => ({})) as { error?: string; published?: number; skipped?: number }
    if (!response.ok) { setError(body.error || 'Publish failed'); return }
    setError(body.skipped ? `Published ${body.published}. Skipped ${body.skipped} without a headline and description.` : undefined)
    setPicked([])
    await queryClient.invalidateQueries({ queryKey: ['admin-neighborhoods'] })
  }

  const startCreate = () => {
    setEditingId(null)
    setError(undefined)
    setDraft(emptyNeighborhood(cityOptions[0]?.id ?? ''))
  }

  const startEdit = (row: NeighborhoodRow) => {
    setEditingId(row.id)
    setError(undefined)
    setDraft({
      name: row.name,
      parentId: row.city?.id ?? '',
      postalCodes: [...row.postalCodes],
      headline: row.headline ?? '',
      about: row.about ?? '',
      imageUrls: row.imageUrls.join('\n'),
      videoUrls: row.videoUrls.join('\n'),
      published: row.published,
    })
  }

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Neighborhoods</h1>
        <Button size="small" onClick={startCreate}>New neighborhood</Button>
      </div>
      <div className="flex flex-wrap gap-2">
        <input className="rounded-md border border-border px-3 py-2 text-sm" placeholder="Name, city, or ZIP" value={q} onChange={(event) => setQ(event.target.value)} />
        <select className="rounded-md border border-border px-3 py-2 text-sm" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">All</option>
          <option value="published">Published</option>
          <option value="draft">Drafts</option>
        </select>
        <Button size="small" variant="outline" disabled={picked.length === 0} onClick={publishPicked}>Publish selected</Button>
      </div>
      {draft ? (
        <NeighborhoodForm
          cities={cityOptions}
          value={draft}
          saving={save.isPending}
          error={error}
          onChange={setDraft}
          onSubmit={() => save.mutate(draft)}
          onCancel={() => { setDraft(null); setError(undefined) }}
        />
      ) : null}
      <AdminTable
        columns={[
          { label: '', className: 'px-4 py-3' },
          { label: 'Neighborhood', className: 'px-4 py-3' },
          { label: 'City', className: 'px-4 py-3' },
          { label: 'Zips', className: 'px-4 py-3' },
          { label: 'Status', className: 'px-4 py-3' },
          { label: '', className: 'px-4 py-3' },
        ]}
        rows={shown}
        isLoading={list.isLoading}
        emptyIcon={MapPin}
        emptyTitle="No neighborhoods yet"
        emptyDescription="Create one and attach the city zips it covers."
        getRowKey={(row) => row.id}
        renderRow={(row) => (
          <>
            <td className="px-4 py-3"><input type="checkbox" checked={picked.includes(row.id)} onChange={() => setPicked((current) => current.includes(row.id) ? current.filter((id) => id !== row.id) : [...current, row.id])} /></td>
            <td className="px-4 py-3 text-sm font-medium">{row.name}</td>
            <td className="px-4 py-3 text-sm">{row.city ? `${row.city.name}${row.city.state ? `, ${row.city.state}` : ''}` : ''}</td>
            <td className="px-4 py-3 text-sm">{row.postalCodes.join(', ')}</td>
            <td className="px-4 py-3 text-sm">{row.published ? 'Published' : 'Draft'}{row.ready ? '' : ' · Incomplete'}</td>
            <td className="px-4 py-3 text-right">
              <Link className="mr-3 text-sm underline" to={`/admin/neighborhoods/preview/${row.id}`}>Preview</Link>
              {row.published ? <Link className="mr-3 text-sm underline" to={`/neighborhoods/${row.slug}`}>Public</Link> : null}
              <Button variant="outline" size="small" onClick={() => startEdit(row)}>Edit</Button>
            </td>
          </>
        )}
      />
    </div>
  )
}
