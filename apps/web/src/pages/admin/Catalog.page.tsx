import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@stores/authStore'
import { Badge, Button } from '@shared/ui/primitives'
import { AdminTable } from '@layouts/AdminLayout'
import { toast } from 'sonner'
import { Package, AlertTriangle } from 'lucide-react'

function getApiBase() {
  return (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
}

interface CatalogItem {
  id: string
  title: string
  price: number
  isActive: boolean
  flagged: boolean
  flaggedAt: string | null
  flaggedReason: string | null
  store: { id: string; name: string }
}

interface ConfirmDialogProps {
  message: string
  requireReason?: boolean
  confirmLabel?: string
  onConfirm: (reason?: string) => void
  onCancel: () => void
}

function ConfirmDialog({ message, requireReason, confirmLabel = 'Confirm', onConfirm, onCancel }: ConfirmDialogProps) {
  const [reason, setReason] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-lg space-y-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-destructive mt-0.5" />
          <p className="text-sm">{message}</p>
        </div>
        {requireReason && (
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (required) — vendor will be notified"
            rows={2}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        )}
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="small" onClick={onCancel}>Cancel</Button>
          <Button
            variant="danger"
            size="small"
            disabled={requireReason && !reason.trim()}
            onClick={() => onConfirm(reason || undefined)}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

type PendingAction =
  | { type: 'flag'; item: CatalogItem }
  | { type: 'unflag'; item: CatalogItem }
  | { type: 'disable'; item: CatalogItem }
  | { type: 'enable'; item: CatalogItem }

const COLUMNS = [
  { label: 'Item', className: 'px-4 py-3' },
  { label: 'Store', className: 'px-4 py-3 hidden sm:table-cell' },
  { label: 'Status', className: 'px-4 py-3' },
  { label: 'Price', className: 'px-4 py-3 hidden md:table-cell' },
  { label: '', className: 'px-4 py-3' },
]

export default function AdminCatalogPage() {
  const token = useAuthStore((s) => s.token)
  const queryClient = useQueryClient()
  const apiBase = getApiBase()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pending, setPending] = useState<PendingAction | null>(null)

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  const { data, isLoading } = useQuery({
    queryKey: ['admin-catalog', search, statusFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter) params.set('status', statusFilter)
      params.set('page', String(page))
      const res = await fetch(`${apiBase}/api/admin/catalog?${params}`, { headers })
      if (!res.ok) throw new Error('Failed to load catalog')
      return res.json() as Promise<{ items: CatalogItem[]; total: number; pages: number }>
    },
  })

  const mutate = useMutation({
    mutationFn: async ({ action, id, reason }: { action: string; id: string; reason?: string }) => {
      const res = await fetch(`${apiBase}/api/admin/catalog/${id}/${action}`, {
        method: 'PATCH',
        headers,
        body: reason !== undefined ? JSON.stringify({ reason }) : '{}',
      })
      if (!res.ok) throw new Error(`Failed to ${action} item`)
      return res.json()
    },
    onSuccess: (_, { action }) => {
      const labels: Record<string, string> = {
        flag: 'Item flagged — vendor notified',
        unflag: 'Flag removed',
        disable: 'Item disabled — vendor notified',
        enable: 'Item enabled',
      }
      toast.success(labels[action] ?? 'Done')
      queryClient.invalidateQueries({ queryKey: ['admin-catalog'] })
      setPending(null)
    },
    onError: (e: Error) => { toast.error(e.message); setPending(null) },
  })

  const items = data?.items ?? []

  return (
    <div className="mx-auto max-w-5xl space-y-5 p-6">
      {pending && (
        <ConfirmDialog
          message={
            pending.type === 'flag'
              ? `Flag "${pending.item.title}"? The vendor will receive a notification with your reason.`
              : pending.type === 'unflag'
              ? `Remove the flag from "${pending.item.title}"?`
              : pending.type === 'disable'
              ? `Disable "${pending.item.title}"? It will be hidden from all customers immediately.`
              : `Re-enable "${pending.item.title}"?`
          }
          requireReason={pending.type === 'flag'}
          confirmLabel={
            pending.type === 'flag' ? 'Flag item' :
            pending.type === 'disable' ? 'Disable item' : 'Confirm'
          }
          onConfirm={(reason) => mutate.mutate({ action: pending.type, id: pending.item.id, reason })}
          onCancel={() => setPending(null)}
        />
      )}

      <div>
        <h1 className="text-2xl font-bold">Catalog</h1>
        <p className="text-sm text-muted-foreground">All items across all stores</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="Search by item name…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="h-9 w-60 rounded-md border border-border bg-background px-3 text-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="h-9 rounded-md border border-border bg-background px-3 text-sm"
        >
          <option value="">All statuses</option>
          <option value="flagged">Flagged</option>
          <option value="disabled">Disabled</option>
          <option value="active">Active</option>
        </select>
      </div>

      <AdminTable
        columns={COLUMNS}
        rows={items}
        isLoading={isLoading}
        emptyIcon={Package}
        emptyTitle="No items found"
        emptyDescription="Try adjusting your search or filters."
        renderRow={(item) => (
          <>
            <td className="px-4 py-3">
              <div className="font-medium">{item.title}</div>
              {item.flaggedReason && (
                <div className="mt-0.5 text-xs text-destructive">{item.flaggedReason}</div>
              )}
            </td>
            <td className="px-4 py-3 hidden sm:table-cell text-sm text-muted-foreground">
              {item.store.name}
            </td>
            <td className="px-4 py-3">
              <div className="flex flex-col gap-1">
                {item.flagged && <Badge variant="destructive">Flagged</Badge>}
                {!item.isActive && <Badge variant="secondary">Disabled</Badge>}
                {item.isActive && !item.flagged && <Badge variant="success">Active</Badge>}
              </div>
            </td>
            <td className="px-4 py-3 hidden md:table-cell text-sm tabular-nums">
              ${Number(item.price).toFixed(2)}
            </td>
            <td className="px-4 py-3">
              <div className="flex flex-wrap gap-1.5">
                {!item.flagged && (
                  <Button size="small" variant="outline" onClick={() => setPending({ type: 'flag', item })}>
                    Flag
                  </Button>
                )}
                {item.flagged && (
                  <Button size="small" variant="outline" onClick={() => setPending({ type: 'unflag', item })}>
                    Unflag
                  </Button>
                )}
                {item.isActive ? (
                  <Button size="small" variant="danger" onClick={() => setPending({ type: 'disable', item })}>
                    Disable
                  </Button>
                ) : (
                  <Button size="small" variant="primary" onClick={() => setPending({ type: 'enable', item })}>
                    Enable
                  </Button>
                )}
              </div>
            </td>
          </>
        )}
      />

      {(data?.pages ?? 1) > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Page {page} of {data?.pages} · {data?.total} items
          </span>
          <div className="flex gap-2">
            <Button size="small" variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button size="small" variant="outline" disabled={page === data?.pages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
