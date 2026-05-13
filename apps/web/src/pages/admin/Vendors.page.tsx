import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@stores/authStore'
import { Badge, Spinner, Button } from '@shared/ui/primitives'
import { EmptyState } from '@shared/ui/primitives/ui/EmptyState/EmptyState'
import { CheckSquare, Square, Store, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { BulkDeleteConfirmDialog } from './components/BulkDeleteConfirmDialog'

function getApiBase() {
  return (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
}

const STATUS_COLORS: Record<string, 'default' | 'warning' | 'success' | 'destructive' | 'outline' | 'secondary'> = {
  ACTIVE: 'success',
  PAUSED: 'warning',
  DISABLED: 'destructive',
}

interface AdminStore {
  id: string
  name: string
  slug: string
  status: string
  storeType: string | null
  isPublished: boolean
  owner: { id: string; name: string | null; email: string }
  createdAt: string
  _count: { orders: number }
}

export default function AdminVendorsPage() {
  const token = useAuthStore((s) => s.token)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const apiBase = getApiBase()
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selectedStoreIds, setSelectedStoreIds] = useState<Set<string>>(() => new Set())
  const [showBulkDialog, setShowBulkDialog] = useState(false)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-stores', 'vendors', search, statusFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter) params.set('status', statusFilter)
      params.set('page', String(page))
      params.set('limit', '25')
      const res = await fetch(`${apiBase}/api/admin/stores?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to load stores')
      return res.json() as Promise<{
        data: AdminStore[]
        pagination: { pages: number; total: number }
      }>
    },
    enabled: Boolean(token),
  })

  const bulkDelete = useMutation({
    mutationFn: async ({ storeIds, reason }: { storeIds: string[]; reason?: string }) => {
      const res = await fetch(`${apiBase}/api/admin/stores/bulk`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeIds, reason }),
      })
      const body = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(body.error || 'Failed to delete stores')
      return body as { deletedCount: number }
    },
    onSuccess: (r) => {
      toast.success(`Deleted ${r.deletedCount} store(s)`)
      setSelectedStoreIds(new Set())
      setShowBulkDialog(false)
      queryClient.invalidateQueries({ queryKey: ['admin-stores'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
    },
    onError: (e: Error) => {
      toast.error(e.message)
      setShowBulkDialog(false)
    },
  })

  const stores = data?.data ?? []
  const selectedStores = stores.filter((s) => selectedStoreIds.has(s.id))
  const hasOrdersSelected = selectedStores.some((s) => s._count.orders > 0)

  const handleSelectAll = () => {
    if (selectedStoreIds.size === stores.length && stores.length > 0) {
      setSelectedStoreIds(new Set())
      return
    }
    setSelectedStoreIds(new Set(stores.map((s) => s.id)))
  }

  const toggleStore = (id: string) => {
    const next = new Set(selectedStoreIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedStoreIds(next)
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5 p-6">
      {showBulkDialog && (
        <BulkDeleteConfirmDialog
          entityLabel="stores (vendors)"
          count={selectedStoreIds.size}
          previewLines={selectedStores.map((s) => `${s.name} · ${s.owner.email} · ${s._count.orders} orders`)}
          extraWarning={
            hasOrdersSelected
              ? 'Cannot delete stores that have orders. Deselect those rows or remove orders first.'
              : undefined
          }
          disableConfirm={hasOrdersSelected}
          isDeleting={bulkDelete.isPending}
          onCancel={() => setShowBulkDialog(false)}
          onConfirm={(reason) => {
            bulkDelete.mutate({ storeIds: [...selectedStoreIds], reason })
          }}
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Vendors</h1>
          <p className="text-sm text-muted-foreground">All stores on the platform</p>
        </div>
        <Button size="small" variant="outline" onClick={() => navigate('/admin/vendors/applications')}>
          View Applications
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          placeholder="Search by name or slug…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); setSelectedStoreIds(new Set()) }}
          className="h-9 rounded-md border border-border bg-background px-3 text-sm w-60"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); setSelectedStoreIds(new Set()) }}
          className="h-9 rounded-md border border-border bg-background px-3 text-sm"
        >
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="PAUSED">Paused</option>
          <option value="DISABLED">Disabled</option>
        </select>

        {stores.length > 0 && (
          <button
            type="button"
            onClick={handleSelectAll}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            {selectedStoreIds.size === stores.length ? (
              <CheckSquare className="h-4 w-4 text-primary" />
            ) : (
              <Square className="h-4 w-4" />
            )}
            {selectedStoreIds.size === stores.length ? 'Deselect all' : 'Select all'}
          </button>
        )}

        {selectedStoreIds.size > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-muted-foreground">{selectedStoreIds.size} selected</span>
            <Button
              variant="danger"
              size="small"
              className="gap-2"
              onClick={() => setShowBulkDialog(true)}
            >
              <Trash2 className="h-4 w-4" />
              Delete selected
            </Button>
          </div>
        )}
      </div>

      {!token ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <Spinner size="large" />
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 space-y-3">
          <p className="text-sm font-medium text-destructive">
            {error instanceof Error ? error.message : 'Failed to load stores'}
          </p>
          <Button size="small" variant="outline" onClick={() => void refetch()}>
            Retry
          </Button>
        </div>
      ) : isLoading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <Spinner size="large" />
        </div>
      ) : stores.length === 0 ? (
        <EmptyState icon={Store} title="No stores found" description="Try adjusting your filters." />
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left text-xs font-semibold uppercase text-muted-foreground">
                  <th className="px-4 py-3 w-10" aria-label="Select" />
                  <th className="px-4 py-3">Store</th>
                  <th className="px-4 py-3">Owner</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 hidden sm:table-cell">Orders</th>
                  <th className="px-4 py-3 hidden md:table-cell">Created</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {stores.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggleStore(s.id)}
                        className="flex items-center justify-center"
                        aria-label="Select row"
                      >
                        {selectedStoreIds.has(s.id) ? (
                          <CheckSquare className="h-4 w-4 text-primary" />
                        ) : (
                          <Square className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{s.name}</div>
                      <div className="text-xs text-muted-foreground">/{s.slug}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div>{s.owner.name ?? '—'}</div>
                      <div className="text-xs text-muted-foreground">{s.owner.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <Badge variant={STATUS_COLORS[s.status] ?? 'outline'}>{s.status}</Badge>
                        {!s.isPublished && (
                          <span className="text-xs text-muted-foreground">Unlisted</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell tabular-nums">{s._count.orders}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <Button size="small" variant="outline" onClick={() => navigate(`/admin/vendors/${s.id}`)}>
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(data?.pagination.pages ?? 1) > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Page {page} of {data?.pagination.pages}
              </span>
              <div className="flex gap-2">
                <Button size="small" variant="outline" disabled={page === 1} onClick={() => { setPage((p) => p - 1); setSelectedStoreIds(new Set()) }}>
                  Previous
                </Button>
                <Button size="small" variant="outline" disabled={page === data?.pagination.pages} onClick={() => { setPage((p) => p + 1); setSelectedStoreIds(new Set()) }}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
