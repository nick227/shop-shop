import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@stores/authStore'
import { Card, CardContent } from '@shared/ui/primitives/ui/Card/Card'
import { Spinner, Badge, Button } from '@shared/ui/primitives'
import { useConfirm } from '@shared/ui/primitives/ui/ConfirmDialog/ConfirmDialog'
import { EmptyState } from '@shared/ui/primitives/ui/EmptyState/EmptyState'
import { CheckSquare, Square, Trash2, UserCheck } from 'lucide-react'
import { toast } from 'sonner'
import { BulkDeleteConfirmDialog } from './components/BulkDeleteConfirmDialog'

function getApiBase(): string {
  return (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
}

function formatDate(s: string | undefined | null): string {
  if (!s) return '-'
  return new Date(s).toLocaleDateString()
}

const statusColor: Record<
  string,
  'default' | 'warning' | 'success' | 'destructive' | 'outline' | 'secondary'
> = {
  PENDING: 'warning',
  ACTIVE: 'success',
  SUSPENDED: 'destructive',
  TERMINATED: 'destructive',
}

interface AffiliateRow {
  id: string
  status: string
  referralCode: string
  createdAt: string
  user?: { id?: string; email?: string; name?: string | null }
  _count?: { referredStores?: number; commissions?: number; payouts?: number }
}

function affiliateSelectable(a: AffiliateRow): boolean {
  const c = a._count
  if (!c) return true
  return (c.commissions ?? 0) === 0 && (c.payouts ?? 0) === 0
}

export default function AdminAffiliatesPage() {
  const token = useAuthStore((s) => s.token)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { confirm, dialog: confirmDialog } = useConfirm()
  const [filterStatus, setFilterStatus] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
  const [showBulkDialog, setShowBulkDialog] = useState(false)

  const apiBase = getApiBase()
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

  const listQuery = useQuery({
    queryKey: ['admin-affiliates', filterStatus],
    queryFn: async () => {
      const q = filterStatus ? `?status=${filterStatus}` : ''
      const res = await fetch(`${apiBase}/api/affiliates${q}`, { headers })
      if (!res.ok) throw new Error('Failed to load affiliates')
      return res.json() as Promise<{ affiliates: AffiliateRow[]; total: number }>
    },
    enabled: Boolean(token),
  })

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`${apiBase}/api/affiliates/${id}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('Failed to update status')
      return res.json()
    },
    onSuccess: () => {
      toast.success('Affiliate status updated')
      queryClient.invalidateQueries({ queryKey: ['admin-affiliates'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: async ({ affiliateIds, reason }: { affiliateIds: string[]; reason?: string }) => {
      const res = await fetch(`${apiBase}/api/admin/affiliates/bulk`, {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ affiliateIds, reason }),
      })
      const body = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(body.error || 'Failed to delete affiliates')
      return body as { deletedCount: number }
    },
    onSuccess: (r) => {
      toast.success(`Deleted ${r.deletedCount} affiliate record(s)`)
      setSelectedIds(new Set())
      setShowBulkDialog(false)
      queryClient.invalidateQueries({ queryKey: ['admin-affiliates'] })
    },
    onError: (e: Error) => {
      toast.error(e.message)
      setShowBulkDialog(false)
    },
  })

  const affiliates = (listQuery.data?.affiliates ?? []) as AffiliateRow[]
  const selectable = affiliates.filter(affiliateSelectable)
  const selectedRows = affiliates.filter((a) => selectedIds.has(a.id))
  const hasBlockedSelection = selectedRows.some((a) => !affiliateSelectable(a))

  const handleSelectAll = () => {
    if (selectedIds.size === selectable.length && selectable.length > 0) {
      setSelectedIds(new Set())
      return
    }
    setSelectedIds(new Set(selectable.map((a) => a.id)))
  }

  const toggleAffiliate = (a: AffiliateRow) => {
    if (!affiliateSelectable(a)) return
    const next = new Set(selectedIds)
    if (next.has(a.id)) next.delete(a.id)
    else next.add(a.id)
    setSelectedIds(next)
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5 p-6">
      {confirmDialog}
      {showBulkDialog && (
        <BulkDeleteConfirmDialog
          entityLabel="affiliate records"
          count={selectedIds.size}
          previewLines={selectedRows.map(
            (a) =>
              `${(a.user?.name as string) ?? (a.user?.email as string) ?? '—'} · ${a.referralCode}`,
          )}
          extraWarning={
            hasBlockedSelection
              ? 'Selection includes affiliates with commissions or payouts — remove them from the selection.'
              : undefined
          }
          disableConfirm={hasBlockedSelection}
          isDeleting={bulkDeleteMutation.isPending}
          onCancel={() => setShowBulkDialog(false)}
          onConfirm={(reason) => bulkDeleteMutation.mutate({ affiliateIds: [...selectedIds], reason })}
        />
      )}

      <div>
        <h1 className="text-2xl font-bold">Affiliates</h1>
        <p className="text-sm text-muted-foreground">Monitor affiliates and manage account status.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Status:</label>
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value)
              setSelectedIds(new Set())
            }}
            className="h-9 rounded-md border border-border bg-background px-3 text-sm"
          >
            <option value="">All</option>
            <option value="PENDING">Pending (legacy)</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="TERMINATED">Terminated</option>
          </select>
        </div>

        {selectable.length > 0 && (
          <button
            type="button"
            onClick={handleSelectAll}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            {selectedIds.size === selectable.length ? (
              <CheckSquare className="h-4 w-4 text-primary" />
            ) : (
              <Square className="h-4 w-4" />
            )}
            {selectedIds.size === selectable.length ? 'Deselect all (eligible)' : 'Select all (eligible)'}
          </button>
        )}

        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-muted-foreground">{selectedIds.size} selected</span>
            <Button variant="danger" size="small" className="gap-2" onClick={() => setShowBulkDialog(true)}>
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
      ) : listQuery.isLoading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <Spinner size="large" />
        </div>
      ) : affiliates.length === 0 ? (
        <EmptyState
          icon={UserCheck}
          title="No affiliates found"
          description="No affiliates match the current filter."
        />
      ) : (
        <div className="space-y-2">
          {affiliates.map(({ id, user, _count: counts, status, referralCode, createdAt }) => {
            const a: AffiliateRow = { id, user, _count: counts, status, referralCode, createdAt }
            const canSelect = affiliateSelectable(a)
            return (
              <Card key={id}>
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <button
                      type="button"
                      disabled={!canSelect}
                      onClick={() => toggleAffiliate(a)}
                      className={canSelect ? 'mt-0.5 shrink-0' : 'mt-0.5 shrink-0 opacity-30 cursor-not-allowed'}
                      aria-label={canSelect ? 'Select affiliate' : 'Not eligible for delete'}
                    >
                      {selectedIds.has(id) ? (
                        <CheckSquare className="h-4 w-4 text-primary" />
                      ) : (
                        <Square className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {(user?.name as string) ?? (user?.email as string)}
                        </span>
                        <Badge variant={statusColor[status] ?? 'outline'}>{status}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {user?.email as string}
                        {' · '}
                        Code: <span className="font-mono">{referralCode}</span>
                        {' · '}
                        Since {formatDate(createdAt)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {(counts?.referredStores as number) ?? 0} stores
                        {' · '}
                        {(counts?.commissions as number) ?? 0} commissions
                        {' · '}
                        {(counts?.payouts as number) ?? 0} payouts
                        {!canSelect && (
                          <span className="block text-destructive mt-1">
                            Bulk delete only when commissions and payouts are both zero.
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="small"
                      variant="outline"
                      onClick={() => navigate(`/admin/affiliates/${id}`)}
                    >
                      View
                    </Button>
                    {status === 'PENDING' && (
                      <Button
                        size="small"
                        variant="primary"
                        onClick={() =>
                          updateStatusMutation.mutate({ id, status: 'ACTIVE' })
                        }
                      >
                        Activate
                      </Button>
                    )}
                    {status === 'ACTIVE' && (
                      <Button
                        size="small"
                        variant="outline"
                        onClick={async () => {
                          const ok = await confirm({
                            title: 'Suspend affiliate?',
                            description: `${(user?.name as string) ?? (user?.email as string)} will lose access to their affiliate dashboard and stop earning commissions.`,
                            confirmLabel: 'Suspend',
                            variant: 'danger',
                          })
                          if (ok) updateStatusMutation.mutate({ id, status: 'SUSPENDED' })
                        }}
                      >
                        Suspend
                      </Button>
                    )}
                    {status === 'SUSPENDED' && (
                      <Button
                        size="small"
                        variant="primary"
                        onClick={() =>
                          updateStatusMutation.mutate({ id, status: 'ACTIVE' })
                        }
                      >
                        Reactivate
                      </Button>
                    )}
                    {status !== 'TERMINATED' && (
                      <Button
                        size="small"
                        variant="danger"
                        onClick={async () => {
                          const ok = await confirm({
                            title: 'Terminate affiliate?',
                            description: `This permanently terminates ${(user?.name as string) ?? (user?.email as string)}'s affiliate account. Existing commissions are preserved but no new ones will be earned. This cannot be undone.`,
                            confirmLabel: 'Terminate',
                            variant: 'danger',
                          })
                          if (ok) updateStatusMutation.mutate({ id, status: 'TERMINATED' })
                        }}
                      >
                        Terminate
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
