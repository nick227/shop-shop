import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAffiliateApi } from '@shared/hooks/hooks/affiliate/useAffiliateApi'
import { PageShell } from '@shared/ui/layout/PageShell'
import { PageHeader } from '@shared/ui/layout/PageLayout'
import { Card, CardContent } from '@shared/ui/primitives/ui/Card/Card'
import { Spinner, Badge } from '@shared/ui/primitives'
import { EmptyState } from '@shared/ui/primitives/ui/EmptyState/EmptyState'
import { DollarSign } from 'lucide-react'

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
  APPROVED: 'secondary',
  PAID: 'success',
  REVERSED: 'destructive',
}

export default function AffiliateCommissionsPage() {
  const api = useAffiliateApi()
  const [status, setStatus] = useState<string>('')

  const query = useQuery({
    queryKey: ['affiliate-commissions', status],
    queryFn: () => api.getMyCommissions(status ? { status } : undefined),
  })

  const commissions = (query.data?.commissions ?? [])

  return (
    <PageShell
      nested
      className="bg-background"
      containerClassName="max-w-5xl"
      contentClassName="space-y-5 py-6"
    >
      <PageHeader title="Commissions" description="Your earned commissions from referred orders." />

      <div className="flex items-center gap-2">
        <label className="text-sm text-muted-foreground">Filter:</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-9 rounded-md border border-border bg-background px-3 text-sm"
        >
          <option value="">All</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="PAID">Paid</option>
          <option value="REVERSED">Reversed</option>
        </select>
      </div>

      {query.isLoading ? (
        <div className="flex min-h-[240px] items-center justify-center">
          <Spinner size="large" />
        </div>
      ) : (commissions.length === 0 ? (
        <EmptyState
          icon={DollarSign}
          title="No commissions yet"
          description="Commissions will appear here once referred stores generate paid orders."
        />
      ) : (
        <div className="space-y-2">
          {commissions.map((c, i) => (
            <Card key={(c.id as string) ?? i}>
              <CardContent className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={statusColor[(c.status as string) ?? ''] ?? 'outline'}>
                      {c.status as string}
                    </Badge>
                    <span className="text-sm font-medium">{formatCurrency(c.amount)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Rate: {c.rate ? `${(Number(c.rate) * 100).toFixed(0)}%` : '-'}
                    {' · '}Order: {(c.orderId as string)?.slice(0, 8).toUpperCase()}
                    {' · '}
                    {formatDate(c.createdAt as string)}
                  </div>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  {c.paidAt ? `Paid ${formatDate(c.paidAt as string)}` : ''}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ))}
    </PageShell>
  )
}
