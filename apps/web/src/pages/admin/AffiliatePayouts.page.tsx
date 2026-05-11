import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@stores/authStore'
import { Spinner, Badge, Button } from '@shared/ui/primitives'
import { useConfirm } from '@shared/ui/primitives/ui/ConfirmDialog/ConfirmDialog'
import { EmptyState } from '@shared/ui/primitives/ui/EmptyState/EmptyState'
import { Banknote } from 'lucide-react'
import { toast } from 'sonner'

function getApiBase() {
  return (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
}

function fmt(n: unknown) {
  return '$' + Number(n ?? 0).toFixed(2)
}

function fmtDate(s: string | null | undefined) {
  return s ? new Date(s).toLocaleDateString() : '—'
}

const STATUS_COLOR: Record<string, 'default' | 'warning' | 'success' | 'destructive' | 'secondary' | 'outline'> = {
  PENDING: 'warning',
  PROCESSING: 'secondary',
  COMPLETED: 'success',
  FAILED: 'destructive',
}

interface Payout {
  id: string
  amount: number
  method: string
  status: string
  periodStart: string
  periodEnd: string
  referenceId: string | null
  createdAt: string
  affiliate: {
    id: string
    referralCode: string
    user: { id: string; name: string | null; email: string }
  }
}

export default function AdminAffiliatePayoutsPage() {
  const token = useAuthStore((s) => s.token)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const apiBase = getApiBase()
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
  const { confirm, dialog: confirmDialog } = useConfirm()
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-payouts', statusFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page) })
      if (statusFilter) params.set('status', statusFilter)
      const res = await fetch(`${apiBase}/api/admin/affiliate-payouts?${params}`, { headers })
      if (!res.ok) throw new Error('Failed to load payouts')
      return res.json() as Promise<{ payouts: Payout[]; total: number; pages: number }>
    },
  })

  // PATCH /status is used only for PENDING → PROCESSING (bookkeeping transition, no money movement).
  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`${apiBase}/api/payouts/${id}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('Failed to update payout status')
      return res.json()
    },
    onSuccess: () => {
      toast.success('Payout marked as processing')
      queryClient.invalidateQueries({ queryKey: ['admin-payouts'] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  // POST /mark-paid triggers the actual transfer (Stripe or records manual payment).
  const markPaidMutation = useMutation({
    mutationFn: async ({ id, paymentReference }: { id: string; paymentReference?: string }) => {
      const res = await fetch(`${apiBase}/api/payouts/${id}/mark-paid`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ paymentReference }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(body.error ?? 'Failed to mark payout as paid')
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Payout marked as paid')
      queryClient.invalidateQueries({ queryKey: ['admin-payouts'] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const payouts = data?.payouts ?? []

  return (
    <div className="mx-auto max-w-5xl space-y-5 p-6">
      {confirmDialog}
      <div>
        <h1 className="text-2xl font-bold">Affiliate Payouts</h1>
        <p className="text-sm text-muted-foreground">All affiliate payout records across the platform.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="h-9 rounded-md border border-border bg-background px-3 text-sm"
        >
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="PROCESSING">Processing</option>
          <option value="COMPLETED">Completed</option>
          <option value="FAILED">Failed</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex min-h-[300px] items-center justify-center"><Spinner size="large" /></div>
      ) : payouts.length === 0 ? (
        <EmptyState icon={Banknote} title="No payouts found" description="No payouts match the current filter." />
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left text-xs font-semibold uppercase text-muted-foreground">
                  <th className="px-4 py-3">Affiliate</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 hidden md:table-cell">Period</th>
                  <th className="px-4 py-3 hidden lg:table-cell">Created</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payouts.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div
                        className="cursor-pointer font-medium hover:text-primary"
                        onClick={() => navigate(`/admin/affiliates/${p.affiliate.id}`)}
                      >
                        {p.affiliate.user.name ?? p.affiliate.user.email}
                      </div>
                      <div className="text-xs font-mono text-muted-foreground">{p.affiliate.referralCode}</div>
                    </td>
                    <td className="px-4 py-3 tabular-nums font-medium">{fmt(p.amount)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.method.replace('_', ' ')}</td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_COLOR[p.status] ?? 'outline'}>{p.status}</Badge>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-xs text-muted-foreground">
                      {fmtDate(p.periodStart)} – {fmtDate(p.periodEnd)}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">
                      {fmtDate(p.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      {p.status === 'PENDING' && (
                        <Button
                          size="small"
                          variant="outline"
                          onClick={async () => {
                            const ok = await confirm({
                              title: 'Mark payout as processing?',
                              description: `Start processing the ${p.method.replace('_', ' ')} payout of ${fmt(p.amount)} for ${p.affiliate.user.name ?? p.affiliate.user.email}.`,
                              confirmLabel: 'Mark Processing',
                            })
                            if (ok) statusMutation.mutate({ id: p.id, status: 'PROCESSING' })
                          }}
                          disabled={statusMutation.isPending}
                        >
                          Mark Processing
                        </Button>
                      )}
                      {p.status === 'PROCESSING' && (
                        <Button
                          size="small"
                          variant="primary"
                          onClick={async () => {
                            const ok = await confirm({
                              title: 'Mark payout as paid?',
                              description: `This will trigger the ${p.method.replace(/_/g, ' ')} transfer of ${fmt(p.amount)} to ${p.affiliate.user.name ?? p.affiliate.user.email}. For Stripe payouts the transfer fires automatically.`,
                              confirmLabel: 'Mark Paid',
                            })
                            if (ok) markPaidMutation.mutate({ id: p.id })
                          }}
                          disabled={markPaidMutation.isPending}
                        >
                          Mark Paid
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(data?.pages ?? 1) > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Page {page} of {data?.pages}</span>
              <div className="flex gap-2">
                <Button size="small" variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                  Previous
                </Button>
                <Button size="small" variant="outline" disabled={page === data?.pages} onClick={() => setPage(p => p + 1)}>
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
