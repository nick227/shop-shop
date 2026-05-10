import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@stores/authStore'
import { Badge, Spinner, Button } from '@shared/ui/primitives'
import { Card, CardContent } from '@shared/ui/primitives/ui/Card/Card'
import { toast } from 'sonner'
import { ArrowLeft, AlertTriangle } from 'lucide-react'

function getApiBase() {
  return (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
}

const STATUS_COLORS: Record<string, 'default' | 'warning' | 'success' | 'destructive' | 'outline' | 'secondary'> = {
  ACTIVE: 'success',
  PAUSED: 'warning',
  DISABLED: 'destructive',
}

const KYC_COLORS: Record<string, 'default' | 'warning' | 'success' | 'destructive' | 'outline' | 'secondary'> = {
  APPROVED: 'success',
  PENDING: 'warning',
  SUBMITTED: 'warning',
  UNDER_REVIEW: 'warning',
  REJECTED: 'destructive',
  EXPIRED: 'destructive',
}

interface ConfirmDialogProps {
  message: string
  requireReason?: boolean
  onConfirm: (reason?: string) => void
  onCancel: () => void
}

function ConfirmDialog({ message, requireReason, onConfirm, onCancel }: ConfirmDialogProps) {
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
            placeholder="Reason (required)"
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
            Confirm
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function AdminVendorDetailPage() {
  const { storeId } = useParams<{ storeId: string }>()
  const navigate = useNavigate()
  const token = useAuthStore((s) => s.token)
  const queryClient = useQueryClient()
  const apiBase = getApiBase()
  const [pendingStatus, setPendingStatus] = useState<'ACTIVE' | 'PAUSED' | 'DISABLED' | null>(null)

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  const { data, isLoading } = useQuery({
    queryKey: ['admin-store', storeId],
    queryFn: async () => {
      const res = await fetch(`${apiBase}/api/admin/stores/${storeId}`, { headers })
      if (!res.ok) throw new Error('Failed to load store')
      return res.json()
    },
  })

  const statusMutation = useMutation({
    mutationFn: async ({ status, reason }: { status: string; reason?: string }) => {
      const res = await fetch(`${apiBase}/api/admin/stores/${storeId}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status, reason }),
      })
      if (!res.ok) throw new Error('Failed to update status')
      return res.json()
    },
    onSuccess: () => {
      toast.success('Store status updated')
      queryClient.invalidateQueries({ queryKey: ['admin-store', storeId] })
      queryClient.invalidateQueries({ queryKey: ['admin-stores'] })
      setPendingStatus(null)
    },
    onError: (e: Error) => { toast.error(e.message); setPendingStatus(null) },
  })

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center"><Spinner size="large" /></div>
  }
  if (!data) return <div className="p-6 text-sm text-muted-foreground">Store not found.</div>

  const store = data
  const kyc = data.kyc

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      {pendingStatus && (
        <ConfirmDialog
          message={
            pendingStatus === 'DISABLED'
              ? 'Disable this store? It will be hidden from all customers immediately.'
              : pendingStatus === 'PAUSED'
              ? 'Pause this store? It will stop accepting orders.'
              : 'Re-enable this store?'
          }
          requireReason={pendingStatus === 'DISABLED'}
          onConfirm={(reason) => statusMutation.mutate({ status: pendingStatus, reason })}
          onCancel={() => setPendingStatus(null)}
        />
      )}

      <button
        onClick={() => navigate('/admin/vendors')}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Vendors
      </button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{store.name}</h1>
          <p className="text-sm text-muted-foreground">/{store.slug}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={STATUS_COLORS[store.status] ?? 'outline'}>{store.status}</Badge>
          {!store.isPublished && (
            <Badge variant="secondary">Unlisted</Badge>
          )}
        </div>
      </div>

      {store.status === 'DISABLED' && store.disabledReason && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <strong>Disabled:</strong> {store.disabledReason}
          {store.disabledAt && (
            <span className="ml-2 opacity-70">on {new Date(store.disabledAt).toLocaleDateString()}</span>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="space-y-3 p-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground">Store Info</p>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <span>{store.storeType ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Orders</span>
                <span className="tabular-nums">{store._count?.orders ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Items</span>
                <span className="tabular-nums">{store._count?.items ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{new Date(store.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground">Owner</p>
            <div className="space-y-1.5 text-sm">
              <div className="font-medium">{store.owner?.name ?? '—'}</div>
              <div className="text-muted-foreground">{store.owner?.email}</div>
              <Button
                size="small"
                variant="outline"
                className="mt-2"
                onClick={() => navigate(`/admin/users/${store.owner?.id}`)}
              >
                View user account
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground">Actions</p>
            <div className="space-y-2">
              {store.status !== 'ACTIVE' && (
                <Button size="small" variant="primary" className="w-full" onClick={() => setPendingStatus('ACTIVE')}>
                  Enable Store
                </Button>
              )}
              {store.status === 'ACTIVE' && (
                <Button size="small" variant="outline" className="w-full" onClick={() => setPendingStatus('PAUSED')}>
                  Pause Store
                </Button>
              )}
              {store.status !== 'DISABLED' && (
                <Button size="small" variant="danger" className="w-full" onClick={() => setPendingStatus('DISABLED')}>
                  Disable Store
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KYC / Verification */}
      <Card>
        <CardContent className="space-y-3 p-4">
          <p className="text-xs font-semibold uppercase text-muted-foreground">KYC / Verification</p>
          {kyc ? (
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant={KYC_COLORS[kyc.status] ?? 'outline'}>{kyc.status}</Badge>
                <span className="text-muted-foreground">{kyc.businessName}</span>
                {kyc.businessType && <span className="text-xs text-muted-foreground">· {kyc.businessType}</span>}
              </div>
              {kyc.submittedAt && (
                <div className="text-xs text-muted-foreground">
                  Submitted {new Date(kyc.submittedAt).toLocaleDateString()}
                  {kyc.reviewedAt && ` · Reviewed ${new Date(kyc.reviewedAt).toLocaleDateString()}`}
                  {kyc.approvedAt && ` · Approved ${new Date(kyc.approvedAt).toLocaleDateString()}`}
                </div>
              )}
              {kyc.rejectionReason && (
                <div className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  Rejection reason: {kyc.rejectionReason}
                </div>
              )}
              {kyc.reviewNotes && (
                <div className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                  Notes: {kyc.reviewNotes}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No verification record on file.</p>
          )}
        </CardContent>
      </Card>

      {/* Team */}
      {store.teamMembers?.length > 0 && (
        <Card>
          <CardContent className="space-y-3 p-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Team ({store.teamMembers.length})
            </p>
            <div className="space-y-1.5">
              {store.teamMembers.map((m: { id: string; permissionsJson: unknown; user: { id: string; name: string | null; email: string } }) => {
                const perms = Array.isArray(m.permissionsJson) ? m.permissionsJson as string[] : []
                const label = perms.length > 0 ? `${perms.length} perm${perms.length !== 1 ? 's' : ''}` : 'Member'
                return (
                  <div key={m.id} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium">{m.user.name ?? m.user.email}</span>
                      {m.user.name && (
                        <span className="ml-2 text-xs text-muted-foreground">{m.user.email}</span>
                      )}
                    </div>
                    <Badge variant="outline">{label}</Badge>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
