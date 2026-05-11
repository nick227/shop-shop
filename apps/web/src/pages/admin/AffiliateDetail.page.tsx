import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@stores/authStore'
import { Card, CardContent } from '@shared/ui/primitives/ui/Card/Card'
import { Spinner, Badge, Button, Input } from '@shared/ui/primitives'
import { useConfirm } from '@shared/ui/primitives/ui/ConfirmDialog/ConfirmDialog'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'

function getApiBase() {
  return (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
}

function fmt(n: unknown) {
  return '$' + Number(n ?? 0).toFixed(2)
}

function fmtDate(s: string | null | undefined) {
  return s ? new Date(s).toLocaleDateString() : '—'
}

const PAYOUT_STATUS_COLOR: Record<string, 'default' | 'warning' | 'success' | 'destructive' | 'secondary'> = {
  PENDING: 'warning',
  PROCESSING: 'secondary',
  COMPLETED: 'success',
  FAILED: 'destructive',
}

const COMMISSION_STATUS_COLOR: Record<string, 'default' | 'warning' | 'success' | 'destructive' | 'secondary' | 'outline'> = {
  PENDING: 'warning',
  APPROVED: 'secondary',
  PAID: 'success',
  REVERSED: 'destructive',
}

export default function AdminAffiliateDetailPage() {
  const { affiliateId } = useParams<{ affiliateId: string }>()
  const navigate = useNavigate()
  const token = useAuthStore((s) => s.token)
  const queryClient = useQueryClient()
  const apiBase = getApiBase()
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
  const { confirm, dialog: confirmDialog } = useConfirm()

  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')
  const [payoutMethod, setPayoutMethod] = useState('STRIPE_TRANSFER')

  // Rate override fields — empty string means "inherit" (null in DB)
  const [customerRatePct, setCustomerRatePct] = useState('')
  const [storeRatePct, setStoreRatePct] = useState('')
  const [payoutGroupId, setPayoutGroupId] = useState<string>('')

  const profileQuery = useQuery({
    queryKey: ['admin-affiliate', affiliateId],
    queryFn: async () => {
      const res = await fetch(`${apiBase}/api/affiliates/${affiliateId}`, { headers })
      if (!res.ok) throw new Error('Failed to load affiliate')
      const data = await res.json()
      return data.affiliate as Record<string, unknown>
    },
    enabled: !!affiliateId,
  })

  // Seed rate fields from loaded profile
  useEffect(() => {
    if (!profileQuery.data) return
    const a = profileQuery.data
    setCustomerRatePct(
      a.customerRateBpsOverride != null ? String(Number(a.customerRateBpsOverride) / 100) : '',
    )
    setStoreRatePct(
      a.storeRateBpsOverride != null ? String(Number(a.storeRateBpsOverride) / 100) : '',
    )
    setPayoutGroupId((a.payoutGroupId as string | null) ?? '')
  }, [profileQuery.data])

  const payoutGroupsQuery = useQuery({
    queryKey: ['admin-payout-groups'],
    queryFn: async () => {
      const res = await fetch(`${apiBase}/api/admin/payout-groups`, { headers })
      if (!res.ok) return { groups: [] }
      return res.json() as Promise<{ groups: { id: string; name: string; customerRateBps: number; storeRateBps: number }[] }>
    },
  })

  // Effective rates come from the server so the display uses the same resolver as commission creation.
  const effectiveRatesQuery = useQuery({
    queryKey: ['admin-affiliate-effective-rates', affiliateId],
    queryFn: async () => {
      const res = await fetch(`${apiBase}/api/affiliates/${affiliateId}/effective-rates`, { headers })
      if (!res.ok) return null
      const data = await res.json() as {
        rates: {
          customer: { rateBps: number; rateSource: string; payoutGroupIdSnapshot: string | null }
          store: { rateBps: number; rateSource: string; payoutGroupIdSnapshot: string | null }
          platformCustomerDefaultBps: number
          platformStoreDefaultBps: number
          platformMaxBurdenBps: number
        }
      }
      return data.rates
    },
    enabled: !!affiliateId,
  })

  const ratesMutation = useMutation({
    mutationFn: async (payload: {
      customerRateBpsOverride: number | null
      storeRateBpsOverride: number | null
      payoutGroupId: string | null
    }) => {
      const res = await fetch(`${apiBase}/api/affiliates/${affiliateId}/rates`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(body.error ?? 'Failed to save rate overrides')
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Rate overrides saved')
      queryClient.invalidateQueries({ queryKey: ['admin-affiliate', affiliateId] })
      queryClient.invalidateQueries({ queryKey: ['admin-affiliate-effective-rates', affiliateId] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const commissionsQuery = useQuery({
    queryKey: ['admin-affiliate-commissions', affiliateId],
    queryFn: async () => {
      const res = await fetch(`${apiBase}/api/affiliates/${affiliateId}/commissions?limit=20`, { headers })
      if (!res.ok) throw new Error('Failed to load commissions')
      return res.json() as Promise<{ commissions: Record<string, unknown>[]; total: number }>
    },
    enabled: !!affiliateId,
  })

  const payoutsQuery = useQuery({
    queryKey: ['admin-affiliate-payouts', affiliateId],
    queryFn: async () => {
      const res = await fetch(`${apiBase}/api/affiliates/${affiliateId}/payouts?limit=20`, { headers })
      if (!res.ok) throw new Error('Failed to load payouts')
      return res.json() as Promise<{ payouts: Record<string, unknown>[]; total: number }>
    },
    enabled: !!affiliateId,
  })

  const referralEventsQuery = useQuery({
    queryKey: ['admin-affiliate-referral-events', affiliateId],
    queryFn: async () => {
      const res = await fetch(`${apiBase}/api/affiliates/${affiliateId}/referral-events?limit=20`, { headers })
      if (!res.ok) throw new Error('Failed to load referral events')
      return res.json() as Promise<{ events: Record<string, unknown>[]; total: number }>
    },
    enabled: !!affiliateId,
  })

  const referredUsersQuery = useQuery({
    queryKey: ['admin-affiliate-referred-users', affiliateId],
    queryFn: async () => {
      const res = await fetch(`${apiBase}/api/affiliates/${affiliateId}/referred-users`, { headers })
      if (!res.ok) throw new Error('Failed to load referred users')
      return res.json() as Promise<{ users: Record<string, unknown>[] }>
    },
    enabled: !!affiliateId,
  })

  const referredStoresQuery = useQuery({
    queryKey: ['admin-affiliate-referred-stores', affiliateId],
    queryFn: async () => {
      const res = await fetch(`${apiBase}/api/affiliates/${affiliateId}/referred-stores`, { headers })
      if (!res.ok) throw new Error('Failed to load referred stores')
      return res.json() as Promise<{ stores: Record<string, unknown>[] }>
    },
    enabled: !!affiliateId,
  })

  const referredOrdersQuery = useQuery({
    queryKey: ['admin-affiliate-referred-orders', affiliateId],
    queryFn: async () => {
      const res = await fetch(`${apiBase}/api/affiliates/${affiliateId}/referred-orders`, { headers })
      if (!res.ok) throw new Error('Failed to load referred orders')
      return res.json() as Promise<{ orders: Record<string, unknown>[] }>
    },
    enabled: !!affiliateId,
  })

  const payoutMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${apiBase}/api/affiliates/${affiliateId}/payout`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          periodStart: new Date(periodStart).toISOString(),
          periodEnd: new Date(periodEnd).toISOString(),
          method: payoutMethod,
        }),
      })
      if (!res.ok) throw new Error('Failed to process payout')
      return res.json()
    },
    onSuccess: () => {
      toast.success('Payout created')
      queryClient.invalidateQueries({ queryKey: ['admin-affiliate-payouts', affiliateId] })
      queryClient.invalidateQueries({ queryKey: ['admin-payouts'] })
      setPeriodStart('')
      setPeriodEnd('')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  if (profileQuery.isLoading) {
    return <div className="flex min-h-screen items-center justify-center"><Spinner size="large" /></div>
  }

  const affiliate = profileQuery.data
  if (!affiliate) return <div className="p-6 text-sm text-muted-foreground">Affiliate not found.</div>

  const user = affiliate.user as Record<string, unknown> | undefined
  const counts = affiliate._count as Record<string, unknown> | undefined
  const commissions = commissionsQuery.data?.commissions ?? []
  const payouts = payoutsQuery.data?.payouts ?? []
  const referralEvents = referralEventsQuery.data?.events ?? []
  const referredUsers = referredUsersQuery.data?.users ?? []
  const referredStores = referredStoresQuery.data?.stores ?? []
  const referredOrders = referredOrdersQuery.data?.orders ?? []

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      {confirmDialog}
      <button
        onClick={() => navigate('/admin/affiliates')}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Affiliates
      </button>

      <div>
        <h1 className="text-2xl font-bold">{(user?.name as string) ?? (user?.email as string)}</h1>
        <p className="text-sm text-muted-foreground font-mono">{affiliate.referralCode as string}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="space-y-3 p-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground">Profile</p>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={affiliate.status === 'ACTIVE' ? 'success' : affiliate.status === 'PENDING' ? 'warning' : 'destructive'}>
                  {affiliate.status as string}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span className="text-right">{user?.email as string}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Commission</span>
                <span>{affiliate.commissionRate ? `${(Number(affiliate.commissionRate) * 100).toFixed(0)}%` : '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">PayPal</span>
                <span className="text-right truncate max-w-[120px]">{(affiliate.paypalEmail as string) ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Stores referred</span>
                <span className="tabular-nums">{(counts?.referredStores as number) ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Commissions</span>
                <span className="tabular-nums">{(counts?.commissions as number) ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payouts</span>
                <span className="tabular-nums">{(counts?.payouts as number) ?? 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground">Process Payout</p>
            <div className="space-y-2">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Period Start</label>
                <Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Period End</label>
                <Input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
              </div>
              <select
                value={payoutMethod}
                onChange={(e) => setPayoutMethod(e.target.value)}
                className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
              >
                <option value="STRIPE_TRANSFER">Stripe Transfer</option>
                <option value="MANUAL">Manual</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CHECK">Check</option>
              </select>
              <Button
                variant="primary"
                size="small"
                className="w-full"
                onClick={async () => {
                  const ok = await confirm({
                    title: 'Create payout?',
                    description: `Create a ${payoutMethod} payout for ${(user?.name as string) ?? (user?.email as string)} covering ${periodStart} → ${periodEnd}.`,
                    confirmLabel: 'Create Payout',
                  })
                  if (ok) payoutMutation.mutate()
                }}
                disabled={!periodStart || !periodEnd || payoutMutation.isPending}
              >
                {payoutMutation.isPending ? 'Processing…' : 'Create Payout'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rate Card — rates come from the server so the display uses the same resolver as commission creation */}
      {(() => {
        const er = effectiveRatesQuery.data
        const effectiveCustomerBps = er?.customer.rateBps ?? 500
        const effectiveStoreBps = er?.store.rateBps ?? 500
        const platformMaxBps = er?.platformMaxBurdenBps ?? 5000

        const sourceLabel = (src: string | undefined) => {
          if (src === 'USER_OVERRIDE') return 'Affiliate Override'
          if (src === 'PAYOUT_GROUP') return 'Payout Group'
          return 'Platform Default'
        }
        const customerSource = sourceLabel(er?.customer.rateSource)
        const storeSource = sourceLabel(er?.store.rateSource)

        const groups = payoutGroupsQuery.data?.groups ?? []

        function handleSaveRates() {
          ratesMutation.mutate({
            customerRateBpsOverride: customerRatePct !== '' ? Math.round(parseFloat(customerRatePct) * 100) : null,
            storeRateBpsOverride: storeRatePct !== '' ? Math.round(parseFloat(storeRatePct) * 100) : null,
            payoutGroupId: payoutGroupId !== '' ? payoutGroupId : null,
          })
        }

        return (
          <Card>
            <CardContent className="space-y-4 p-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Affiliate Rate Card</p>

              {effectiveRatesQuery.isLoading ? (
                <div className="flex justify-center py-4"><Spinner /></div>
              ) : (
              <div className="grid gap-3 sm:grid-cols-3 text-sm">
                <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-0.5">
                  <div className="text-xs text-muted-foreground">Customer Referral Rate</div>
                  <div className="text-lg font-bold tabular-nums">{(effectiveCustomerBps / 100).toFixed(2)}%</div>
                  <div className="text-xs text-muted-foreground">{customerSource}</div>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-0.5">
                  <div className="text-xs text-muted-foreground">Store Referral Rate</div>
                  <div className="text-lg font-bold tabular-nums">{(effectiveStoreBps / 100).toFixed(2)}%</div>
                  <div className="text-xs text-muted-foreground">{storeSource}</div>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-0.5">
                  <div className="text-xs text-muted-foreground">Max Burden Cap</div>
                  <div className="text-lg font-bold tabular-nums">{(platformMaxBps / 100).toFixed(2)}%</div>
                  <div className="text-xs text-muted-foreground">Platform Default</div>
                </div>
              </div>
              )}

              <div className="grid gap-3 sm:grid-cols-3 items-end">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Override Customer Rate (%)</label>
                  <input
                    type="number"
                    placeholder="inherit"
                    value={customerRatePct}
                    onChange={(e) => setCustomerRatePct(e.target.value)}
                    min={0}
                    max={100}
                    step={0.25}
                    className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm tabular-nums"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Override Store Rate (%)</label>
                  <input
                    type="number"
                    placeholder="inherit"
                    value={storeRatePct}
                    onChange={(e) => setStoreRatePct(e.target.value)}
                    min={0}
                    max={100}
                    step={0.25}
                    className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm tabular-nums"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Payout Group</label>
                  <select
                    value={payoutGroupId}
                    onChange={(e) => setPayoutGroupId(e.target.value)}
                    className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
                  >
                    <option value="">No group (platform default)</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({(g.customerRateBps / 100).toFixed(2)}% / {(g.storeRateBps / 100).toFixed(2)}%)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
                <p className="text-xs text-muted-foreground">
                  Changes affect future commissions only. Existing commission rows keep their snapshotted rate.
                </p>
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="small"
                    variant="outline"
                    onClick={() => {
                      setCustomerRatePct('')
                      setStoreRatePct('')
                      ratesMutation.mutate({
                        customerRateBpsOverride: null,
                        storeRateBpsOverride: null,
                        payoutGroupId: payoutGroupId !== '' ? payoutGroupId : null,
                      })
                    }}
                    disabled={ratesMutation.isPending}
                  >
                    Clear Overrides
                  </Button>
                  <Button
                    size="small"
                    variant="primary"
                    onClick={handleSaveRates}
                    disabled={ratesMutation.isPending}
                  >
                    {ratesMutation.isPending ? 'Saving…' : 'Save Rate Overrides'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })()}

      {/* Commissions */}
      <Card>
        <CardContent className="space-y-3 p-4">
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            Recent Commissions {commissionsQuery.data ? `(${commissionsQuery.data.total} total)` : ''}
          </p>
          {commissionsQuery.isLoading ? (
            <div className="flex justify-center py-4"><Spinner /></div>
          ) : commissions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No commissions yet.</p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50 text-left text-xs font-semibold uppercase text-muted-foreground">
                    <th className="px-3 py-2">Amount</th>
                    <th className="px-3 py-2">Rate</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2 hidden sm:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {commissions.map((c) => (
                    <tr key={c.id as string} className="hover:bg-muted/30">
                      <td className="px-3 py-2 tabular-nums">{fmt(c.amount)}</td>
                      <td className="px-3 py-2 tabular-nums">{(Number(c.rate) * 100).toFixed(0)}%</td>
                      <td className="px-3 py-2">
                        <Badge variant={COMMISSION_STATUS_COLOR[c.status as string] ?? 'outline'}>
                          {c.status as string}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 hidden sm:table-cell text-muted-foreground">
                        {fmtDate(c.createdAt as string)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Referral Activity Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="space-y-3 p-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground">Referred Users</p>
            <div className="text-2xl font-bold">{referredUsers.length}</div>
            {referredUsers.length > 0 && (
              <div className="text-xs text-muted-foreground">
                {referredUsers.reduce((sum, user) => sum + Number((user as any)._count?.orders || 0), 0)} total orders
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-3 p-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground">Referred Stores</p>
            <div className="text-2xl font-bold">{referredStores.length}</div>
            {referredStores.length > 0 && (
              <div className="text-xs text-muted-foreground">
                {referredStores.reduce((sum, store) => sum + Number((store as any)._count?.orders || 0), 0)} total orders
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-3 p-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground">Referred Orders</p>
            <div className="text-2xl font-bold">{referredOrders.length}</div>
            {referredOrders.length > 0 && (
              <div className="text-xs text-muted-foreground">
                {fmt(referredOrders.reduce((sum, order) => sum + Number(order.total || 0), 0))} total value
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Referral Events */}
      <Card>
        <CardContent className="space-y-3 p-4">
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            Recent Referral Events {referralEventsQuery.data ? `(${referralEventsQuery.data.total} total)` : ''}
          </p>
          {referralEventsQuery.isLoading ? (
            <div className="flex justify-center py-4"><Spinner /></div>
          ) : referralEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No referral events yet.</p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50 text-left text-xs font-semibold uppercase text-muted-foreground">
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">Target</th>
                    <th className="px-3 py-2">Code</th>
                    <th className="px-3 py-2 hidden sm:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {referralEvents.slice(0, 10).map((event) => (
                    <tr key={event.id as string} className="hover:bg-muted/30">
                      <td className="px-3 py-2">
                        <Badge variant="outline">{event.eventType as string}</Badge>
                      </td>
                      <td className="px-3 py-2">
                        {event.referredStore ? (
                          <div>
                            <div className="font-medium">{(event.referredStore as any).name}</div>
                            <div className="text-xs text-muted-foreground">Store</div>
                          </div>
                        ) : event.referredUser ? (
                          <div>
                            <div className="font-medium">{(event.referredUser as any).name || (event.referredUser as any).email}</div>
                            <div className="text-xs text-muted-foreground">User</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs">{event.referralCode as string}</td>
                      <td className="px-3 py-2 hidden sm:table-cell text-muted-foreground text-xs">
                        {fmtDate(event.createdAt as string)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payouts */}
      <Card>
        <CardContent className="space-y-3 p-4">
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            Payouts {payoutsQuery.data ? `(${payoutsQuery.data.total} total)` : ''}
          </p>
          {payoutsQuery.isLoading ? (
            <div className="flex justify-center py-4"><Spinner /></div>
          ) : payouts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payouts yet.</p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50 text-left text-xs font-semibold uppercase text-muted-foreground">
                    <th className="px-3 py-2">Amount</th>
                    <th className="px-3 py-2">Method</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2 hidden sm:table-cell">Period</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {payouts.map((p) => (
                    <tr key={p.id as string} className="hover:bg-muted/30">
                      <td className="px-3 py-2 tabular-nums">{fmt(p.amount)}</td>
                      <td className="px-3 py-2">{p.method as string}</td>
                      <td className="px-3 py-2">
                        <Badge variant={PAYOUT_STATUS_COLOR[p.status as string] ?? 'outline'}>
                          {p.status as string}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 hidden sm:table-cell text-muted-foreground text-xs">
                        {fmtDate(p.periodStart as string)} – {fmtDate(p.periodEnd as string)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
