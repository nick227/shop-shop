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

/** Prefer integer-cent fields (Phase 1+); fall back to legacy Decimal fields. */
function resolveAmount(c: any): number {
  return c.amountCents != null ? c.amountCents / 100 : Number(c.amount ?? 0)
}

function resolveRatePct(c: any): string {
  if (c.rateBps != null) return (c.rateBps / 100).toFixed(0) + '%'
  if (c.rate != null) return (Number(c.rate) * 100).toFixed(0) + '%'
  return '-'
}

function resolveServiceFee(c: any): string {
  if (c.commissionBaseCents != null) return formatCurrency(c.commissionBaseCents / 100)
  if (c.serviceFeeBase != null) return formatCurrency(Number(c.serviceFeeBase))
  return '-'
}

function sourceLabel(sourceType: string | null | undefined): string {
  switch (sourceType) {
    case 'CUSTOMER_PURCHASE': return 'Customer referral'
    case 'STORE_REVENUE': return 'Store referral'
    case 'MANUAL': return 'Manual'
    default: return ''
  }
}

function rateSourceLabel(rateSource: string | null | undefined): string {
  switch (rateSource) {
    case 'USER_OVERRIDE': return 'custom rate'
    case 'PAYOUT_GROUP': return 'group rate'
    case 'PLATFORM_DEFAULT': return 'default rate'
    default: return ''
  }
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

  // Fetch all when using the composite "awaiting-payout" filter; otherwise use the single status.
  const apiStatus = status === 'AWAITING_PAYOUT' ? undefined : (status || undefined)

  const query = useQuery({
    queryKey: ['affiliate-commissions', apiStatus],
    queryFn: () => api.getMyCommissions(apiStatus ? { status: apiStatus } : undefined),
    refetchInterval: 30_000,
  })

  const allCommissions = query.data?.commissions ?? []
  const commissions = status === 'AWAITING_PAYOUT'
    ? allCommissions.filter((c: any) => c.status === 'PENDING' || c.status === 'APPROVED')
    : allCommissions

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
          <option value="AWAITING_PAYOUT">Awaiting Payout</option>
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
          {commissions.map((c, i) => {
            const amount = resolveAmount(c)
            const ratePct = resolveRatePct(c)
            const serviceFee = resolveServiceFee(c)
            const src = sourceLabel(c.sourceType as string)
            const rateSrc = rateSourceLabel(c.rateSource as string)

            return (
              <Card key={(c.id as string) ?? i}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: amount + source */}
                    <div className="min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={statusColor[(c.status as string) ?? ''] ?? 'outline'}>
                          {c.status as string}
                        </Badge>
                        <span className="text-base font-semibold">{formatCurrency(amount)}</span>
                        {src && (
                          <span className="text-xs text-muted-foreground">{src}</span>
                        )}
                      </div>

                      {/* Rate + service fee breakdown */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                        <span>
                          Rate: <span className="font-medium text-foreground">{ratePct}</span>
                          {rateSrc && <span className="ml-1 opacity-60">({rateSrc})</span>}
                        </span>
                        <span>
                          Service fee: <span className="font-medium text-foreground">{serviceFee}</span>
                        </span>
                        <span>
                          Order: <span className="font-mono">{(c.orderId as string)?.slice(0, 8).toUpperCase()}</span>
                        </span>
                        <span>{formatDate(c.createdAt as string)}</span>
                      </div>
                    </div>

                    {/* Right: paid date */}
                    <div className="shrink-0 text-right text-xs text-muted-foreground">
                      {c.paidAt
                        ? <span>Paid {formatDate(c.paidAt as string)}</span>
                        : c.approvedAt
                          ? <span>Approved {formatDate(c.approvedAt as string)}</span>
                          : null
                      }
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ))}
    </PageShell>
  )
}
