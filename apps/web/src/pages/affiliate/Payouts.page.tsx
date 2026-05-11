import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAffiliateApi } from '@shared/hooks/hooks/affiliate/useAffiliateApi'
import { PageShell } from '@shared/ui/layout/PageShell'
import { PageHeader } from '@shared/ui/layout/PageLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/primitives/ui/Card/Card'
import { Spinner, Badge } from '@shared/ui/primitives'
import { EmptyState } from '@shared/ui/primitives/ui/EmptyState/EmptyState'
import { Banknote, Download, Calendar, DollarSign, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { Button } from '@shared/ui/primitives/ui/Button/Button'

function formatCurrency(n: unknown): string {
  const v = typeof n === 'number' ? n : Number(n ?? 0)
  return '$' + v.toFixed(2)
}

function formatDate(s: string | undefined | null): string {
  if (!s) return '-'
  return new Date(s).toLocaleDateString()
}

function formatDateTime(s: string | undefined | null): string {
  if (!s) return '-'
  return new Date(s).toLocaleString()
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'PENDING':
      return <Clock className="h-4 w-4" />
    case 'PROCESSING':
      return <AlertTriangle className="h-4 w-4" />
    case 'COMPLETED':
      return <CheckCircle className="h-4 w-4" />
    case 'FAILED':
      return <XCircle className="h-4 w-4" />
    default:
      return null
  }
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
    refetchInterval: 30_000,
  })

  const statsQuery = useQuery({
    queryKey: ['affiliate-payout-stats'],
    queryFn: () => api.getMyStats(),
    refetchInterval: 30_000,
  })

  const payouts = (query.data?.payouts ?? [])
  const stats = statsQuery.data

  // Calculate statistics
  const totalEarned = payouts.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
  const pendingAmount = payouts
    .filter(p => p.status === 'PENDING')
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
  const completedAmount = payouts
    .filter(p => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0)

  const handleExportCSV = () => {
    const csvContent = [
      ['Payout ID', 'Amount', 'Method', 'Status', 'Period Start', 'Period End', 'Created', 'Paid At', 'Failure Reason'],
      ...payouts.map(p => [
        p.id,
        formatCurrency(p.amount),
        p.method,
        p.status,
        formatDate(p.periodStart as string),
        formatDate(p.periodEnd as string),
        formatDateTime(p.createdAt as string),
        p.paidAt ? formatDateTime(p.paidAt as string) : '',
        (p.failureReason as string) || ''
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `payouts-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <PageShell
      nested
      className="bg-background"
      containerClassName="max-w-6xl"
      contentClassName="space-y-5 py-6"
    >
      <PageHeader title="Payouts" description="Your payout history and detailed information." />

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Earned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-2xl font-bold">{formatCurrency(totalEarned)}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <span className="text-2xl font-bold">{formatCurrency(pendingAmount)}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {payouts.filter(p => p.status === 'PENDING').length} payouts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-2xl font-bold">{formatCurrency(completedAmount)}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {payouts.filter(p => p.status === 'COMPLETED').length} payouts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Commission Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Banknote className="h-4 w-4 text-blue-600" />
              <span className="text-2xl font-bold">{stats?.commissionRate != null ? `${(Number(stats.commissionRate) * 100).toFixed(1)}%` : 'N/A'}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Current rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
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
        
        <Button
          variant="outline"
          size="small"
          onClick={handleExportCSV}
          disabled={payouts.length === 0}
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Payouts List */}
      {query.isLoading ? (
        <div className="flex min-h-[240px] items-center justify-center">
          <Spinner size="large" />
        </div>
      ) : (payouts.length === 0 ? (
        <EmptyState
          icon={Banknote}
          title="No payouts yet"
          description="Once your commissions are approved, payouts will appear here."
        />
      ) : (
        <div className="space-y-4">
          {payouts.map((p, i) => (
            <Card key={(p.id as string) ?? i}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(p.status as string)}
                    <div>
                      <CardTitle className="text-lg">{formatCurrency(p.amount)}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {p.method as string} • Payout #{(p.id as string)?.slice(0, 8)}
                      </p>
                    </div>
                  </div>
                  <Badge variant={statusColor[(p.status as string) ?? ''] ?? 'outline'}>
                    {p.status as string}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        <strong>Period:</strong> {formatDate(p.periodStart as string)} – {formatDate(p.periodEnd as string)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        <strong>Created:</strong> {formatDateTime(p.createdAt as string)}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {!!(p.paidAt) && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">
                          <strong>Paid:</strong> {formatDateTime(p.paidAt as string)}
                        </span>
                      </div>
                    )}
                    {!!(p.failureReason) && (
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <span className="text-sm text-red-600">
                          <strong>Failed:</strong> {p.failureReason as string}
                        </span>
                      </div>
                    )}
                    {!!(p.reviewNotes) && (
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-blue-600" />
                        <span className="text-sm">
                          <strong>Notes:</strong> {p.reviewNotes as string}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Commission breakdown */}
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm font-medium mb-2">Commission Details</p>
                  <div className="text-sm text-muted-foreground">
                    <p>This payout includes commissions from orders placed during the period above.</p>
                    <p>Contact support if you have questions about this payout.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ))}
    </PageShell>
  )
}
