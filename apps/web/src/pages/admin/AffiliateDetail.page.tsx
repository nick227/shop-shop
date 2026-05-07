import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@stores/authStore'
import { PageShell } from '@shared/ui/layout/PageShell'
import { PageHeader } from '@shared/ui/layout/PageLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/primitives/ui/Card/Card'
import { Spinner, Badge, Button, Input } from '@shared/ui/primitives'
import { toast } from 'sonner'

function getApiBase(): string {
  return (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
}

export default function AdminAffiliateDetailPage() {
  const { affiliateId } = useParams<{ affiliateId: string }>()
  const token = useAuthStore((s) => s.token)
  const queryClient = useQueryClient()

  const apiBase = getApiBase()
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')
  const [payoutMethod, setPayoutMethod] = useState('PAYPAL')

  const profileQuery = useQuery({
    queryKey: ['admin-affiliate', affiliateId],
    queryFn: async () => {
      const res = await fetch(`${apiBase}/api/affiliates`, { headers })
      if (!res.ok) throw new Error('Failed to load')
      const data = (await res.json()) as { affiliates: Record<string, unknown>[] }
      const found = data.affiliates.find((a) => a.id === affiliateId)
      if (!found) throw new Error('Affiliate not found')
      return found
    },
    enabled: !!affiliateId,
  })

  const commissionsQuery = useQuery({
    queryKey: ['admin-affiliate-commissions', affiliateId],
    queryFn: async () => {
      const res = await fetch(`${apiBase}/api/affiliates/me/commissions`, { headers })
      if (!res.ok) throw new Error('Failed to load commissions')
      return res.json() as Promise<{ commissions: Record<string, unknown>[]; total: number }>
    },
    enabled: false,
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
      queryClient.invalidateQueries({ queryKey: ['admin-affiliate'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const affiliate = profileQuery.data
  const user = affiliate?.user as Record<string, unknown> | undefined

  if (profileQuery.isLoading) {
    return (
      <PageShell className="bg-background" containerClassName="max-w-3xl" contentClassName="py-6">
        <div className="flex min-h-[300px] items-center justify-center">
          <Spinner size="large" />
        </div>
      </PageShell>
    )
  }

  if (!affiliate) {
    return (
      <PageShell className="bg-background" contentClassName="py-6">
        <p className="text-muted-foreground">Affiliate not found.</p>
      </PageShell>
    )
  }

  return (
    <PageShell
      className="bg-background"
      containerClassName="max-w-3xl"
      contentClassName="space-y-5 py-6"
    >
      <PageHeader
        title={`Affiliate: ${(user?.name as string) ?? (user?.email as string)}`}
        description={`Referral code: ${affiliate.referralCode as string}`}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status</span>
            <Badge>{affiliate.status as string}</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email</span>
            <span>{user?.email as string}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Referral Code</span>
            <span className="font-mono">{affiliate.referralCode as string}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Commission Rate</span>
            <span>
              {affiliate.commissionRate
                ? `${(Number(affiliate.commissionRate) * 100).toFixed(0)}%`
                : '-'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">PayPal</span>
            <span>{(affiliate.paypalEmail as string) ?? '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Website</span>
            <span>{(affiliate.website as string) ?? '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tax ID</span>
            <span>{(affiliate.taxId as string) ?? '-'}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Process Payout</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium">Period Start</label>
              <Input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Period End</label>
              <Input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Method</label>
            <select
              value={payoutMethod}
              onChange={(e) => setPayoutMethod(e.target.value)}
              className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
            >
              <option value="PAYPAL">PayPal</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="CHECK">Check</option>
              <option value="STRIPE_TRANSFER">Stripe Transfer</option>
            </select>
          </div>
          <Button
            variant="primary"
            onClick={() => payoutMutation.mutate()}
            disabled={!periodStart || !periodEnd || payoutMutation.isPending}
          >
            {payoutMutation.isPending ? 'Processing...' : 'Create Payout'}
          </Button>
        </CardContent>
      </Card>
    </PageShell>
  )
}
