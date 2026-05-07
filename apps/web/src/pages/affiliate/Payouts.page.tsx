import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAffiliateApi } from '@shared/hooks/hooks/affiliate/useAffiliateApi'
import { PageShell } from '@shared/ui/layout/PageShell'
import { PageHeader } from '@shared/ui/layout/PageLayout'
import { Card, CardContent } from '@shared/ui/primitives/ui/Card/Card'
import { Spinner, Badge } from '@shared/ui/primitives'
import { EmptyState } from '@shared/ui/primitives/ui/EmptyState/EmptyState'
import { Banknote } from 'lucide-react'

function formatCurrency(n: unknown): string {
  const v = typeof n === 'number' ? n : Number(n ?? 0)
  return '$' + v.toFixed(2)
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
  PROCESSING: 'secondary',
  COMPLETED: 'success',
  FAILED: 'destructive',
}

export default function AffiliatePayoutsPage() {
  const api = useAffiliateApi()
  const [status, setStatus] = useState<string>('')

  const query = useQuery({
    queryKey: ['affiliate-payouts', status],
    queryFn: () => api.getMyPayouts(status ? { status } : undefined),
  })

  const payouts = (query.data?.payouts ?? []) as Record<string, unknown>[]

  return (
    <PageShell
      nested
      className="bg-background"
      containerClassName="max-w-5xl"
      contentClassName="space-y-5 py-6"
    >
      <PageHeader title="Payouts" description="Your payout history and status." />

      <div className="flex items-center gap-2">
        <label className="text-sm text-muted-foreground">Filter:</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-9 rounded-md border border-border bg-background px-3 text-sm"
        >
          <option value="">All</option>
          <option value="PENDING">Pending</option>
          <option value="PROCESSING">Processing</option>
          <option value="COMPLETED">Completed</option>
          <option value="FAILED">Failed</option>
        </select>
      </div>

      {query.isLoading ? (
        <div className="flex min-h-[240px] items-center justify-center">
          <Spinner size="large" />
        </div>
      ) : payouts.length === 0 ? (
        <EmptyState
          icon={Banknote}
          title="No payouts yet"
          description="Once your commissions are approved, payouts will appear here."
        />
      ) : (
        <div className="space-y-2">
          {payouts.map((p, i) => (
            <Card key={(p.id as string) ?? i}>
              <CardContent className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={statusColor[(p.status as string) ?? ''] ?? 'outline'}>
                      {p.status as string}
                    </Badge>
                    <span className="text-sm font-medium">{formatCurrency(p.amount)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {p.method as string}
                    {' · '}
                    {formatDate(p.periodStart as string)} – {formatDate(p.periodEnd as string)}
                  </div>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  {p.paidAt ? `Paid ${formatDate(p.paidAt as string)}` : ''}
                  {p.failureReason ? (
                    <span className="text-destructive block">{p.failureReason as string}</span>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageShell>
  )
}
