import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAffiliateApi } from '@shared/hooks/hooks/affiliate/useAffiliateApi'
import { PageShell } from '@shared/ui/layout/PageShell'
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/primitives/ui/Card/Card'
import { Clock, Mail } from 'lucide-react'

export default function PendingApprovalPage() {
  const api = useAffiliateApi()
  const navigate = useNavigate()

  const appQuery = useQuery({
    queryKey: ['affiliate-application'],
    queryFn: () => api.getMyApplication(),
  })

  const appStatus = (appQuery.data?.affiliate?.status as string | undefined) ?? null

  useEffect(() => {
    if (!appStatus) return
    if (appStatus === 'ACTIVE') navigate('/affiliate/dashboard', { replace: true })
    if (appStatus === 'SUSPENDED') navigate('/affiliate/suspended', { replace: true })
    if (appStatus === 'TERMINATED') navigate('/affiliate/unavailable', { replace: true })
  }, [appStatus, navigate])

  if (appQuery.isLoading) {
    return (
      <PageShell className="bg-background" containerClassName="max-w-lg" contentClassName="py-10 md:py-14">
        <Card className="text-center">
          <CardHeader>
            <CardTitle className="text-2xl">Checking status…</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Please wait.</p>
          </CardContent>
        </Card>
      </PageShell>
    )
  }

  if (!appQuery.data?.affiliate) {
    return (
      <PageShell className="bg-background" containerClassName="max-w-lg" contentClassName="py-10 md:py-14">
        <Card className="text-center">
          <CardHeader>
            <CardTitle className="text-2xl">Affiliate unavailable</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No affiliate application was found for this account.</p>
          </CardContent>
        </Card>
      </PageShell>
    )
  }

  return (
    <PageShell
      className="bg-background"
      containerClassName="max-w-lg"
      contentClassName="py-10 md:py-14"
    >
      <Card className="text-center">
        <CardHeader>
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
            <Clock className="h-7 w-7 text-amber-600" />
          </div>
          <CardTitle className="text-2xl">Application Pending</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Thank you for applying! Your affiliate application is under review.
          </p>
          <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground text-left space-y-2">
            <div className="flex items-start gap-2">
              <Clock className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Reviews are typically completed within 1-2 business days.</span>
            </div>
            <div className="flex items-start gap-2">
              <Mail className="mt-0.5 h-4 w-4 shrink-0" />
              <span>You'll receive an email notification when your status changes.</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  )
}
