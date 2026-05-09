import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAffiliateApi } from '@shared/hooks/hooks/affiliate/useAffiliateApi'
import { PageShell } from '@shared/ui/layout/PageShell'
import { PageHeader } from '@shared/ui/layout/PageLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/primitives/ui/Card/Card'
import { Spinner, Badge, Button } from '@shared/ui/primitives'
import { Copy, Check } from 'lucide-react'
import { toast } from 'sonner'

function formatCurrency(n: unknown): string {
  const v = typeof n === 'number' ? n : Number(n ?? 0)
  return '$' + v.toFixed(2)
}

export default function AffiliateDashboardPage() {
  const api = useAffiliateApi()
  const [copied, setCopied] = useState(false)

  const profileQuery = useQuery({
    queryKey: ['affiliate-profile'],
    queryFn: () => api.getMyProfile(),
  })

  const statsQuery = useQuery({
    queryKey: ['affiliate-stats'],
    queryFn: () => api.getMyStats(),
  })

  const profile = profileQuery.data?.affiliate
  const stats = statsQuery.data
  const statsData = stats?.stats as Record<string, unknown> | undefined

  const referralCode = profile?.referralCode as string | undefined
  const referralLink = referralCode ? `${window.location.origin}/r/${referralCode}` : ''
  const status = profile?.status as string | undefined
  const commissionRate = profile?.commissionRate as string | number | undefined

  const copyLink = async () => {
    if (!referralLink) return
    try {
      await navigator.clipboard.writeText(referralLink)
      setCopied(true)
      toast.success('Referral link copied!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Could not copy link')
    }
  }

  if (profileQuery.isLoading) {
    return (
      <PageShell
        nested
        className="bg-background"
        containerClassName="max-w-5xl"
        contentClassName="py-6"
      >
        <div className="flex min-h-[400px] items-center justify-center">
          <Spinner size="large" />
        </div>
      </PageShell>
    )
  }

  if (!profile) {
    return (
      <PageShell
        nested
        className="bg-background"
        containerClassName="max-w-5xl"
        contentClassName="py-6"
      >
        <p className="text-muted-foreground">Affiliate profile not found.</p>
      </PageShell>
    )
  }

  return (
    <PageShell
      nested
      className="bg-background"
      containerClassName="max-w-5xl"
      contentClassName="space-y-6 py-6"
    >
      <PageHeader
        title="Affiliate Dashboard"
        description="Your earnings and referral activity at a glance."
      />

      {/* Referral Link Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1 min-w-0">
              <div className="flex gap-2 items-center">
                <Badge variant={status === 'ACTIVE' ? 'success' : 'outline'}>
                  {status === 'ACTIVE' ? 'Active' : (status ?? 'Pending')}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Code: <span className="font-mono font-medium">{referralCode}</span>
                </span>
                <span className="text-sm text-muted-foreground">
                  Rate: {commissionRate ? `${(Number(commissionRate) * 100).toFixed(0)}%` : '-'}
                </span>
              </div>
              <p className="text-sm font-medium truncate">{referralLink}</p>
            </div>
            <Button onClick={copyLink} variant="primary" className="gap-2 shrink-0">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy Link'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{formatCurrency(statsData?.totalEarnings)}</div>
            <div className="text-xs text-muted-foreground">Total Earnings</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-amber-600">
              {formatCurrency(statsData?.pendingEarnings)}
            </div>
            <div className="text-xs text-muted-foreground">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(statsData?.paidEarnings)}
            </div>
            <div className="text-xs text-muted-foreground">Paid</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{Number(statsData?.referredStores ?? 0)}</div>
            <div className="text-xs text-muted-foreground">Stores Referred</div>
          </CardContent>
        </Card>
      </div>

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Getting Going</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Share your referral link on social media, blogs, or with your network.</p>
          <p>You earn commissions when stores you refer generate paid orders.</p>
          <p>Track your earnings and payouts from the Commissions and Payouts pages.</p>
        </CardContent>
      </Card>
    </PageShell>
  )
}
