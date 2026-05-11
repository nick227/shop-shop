import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useAffiliateApi } from '@shared/hooks/hooks/affiliate/useAffiliateApi'
import { PageShell } from '@shared/ui/layout/PageShell'
import { PageHeader } from '@shared/ui/layout/PageLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/primitives/ui/Card/Card'
import { Badge } from '@shared/ui/primitives/ui/Badge/Badge'
import { Button, Input, Spinner } from '@shared/ui/primitives'
import { CheckCircle, ExternalLink, AlertTriangle, Clock } from 'lucide-react'
import { toast } from 'sonner'

function stripeStatusBadge(status: string) {
  if (status === 'ACTIVE') return <Badge variant="success">Active</Badge>
  if (status === 'PENDING') return <Badge variant="warning">Pending verification</Badge>
  if (status === 'SUSPENDED') return <Badge variant="destructive">Suspended</Badge>
  if (status === 'FAILED') return <Badge variant="destructive">Failed</Badge>
  return <Badge variant="outline">Not connected</Badge>
}

export default function AffiliateSettingsPage() {
  const api = useAffiliateApi()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()

  const profileQuery = useQuery({
    queryKey: ['affiliate-profile'],
    queryFn: () => api.getMyProfile(),
  })

  const payoutAccountQuery = useQuery({
    queryKey: ['affiliate-payout-account'],
    queryFn: () => api.getPayoutAccountStatus(),
    refetchInterval: 30_000,
  })

  // Notify the user when they return from Stripe onboarding
  useEffect(() => {
    const result = searchParams.get('stripe')
    if (result === 'success') {
      toast.success('Stripe account connected. Verification may take a moment.')
      queryClient.invalidateQueries({ queryKey: ['affiliate-payout-account'] })
    } else if (result === 'refresh') {
      toast.info('Stripe onboarding link refreshed — you can continue below.')
    }
  }, [searchParams, queryClient])

  const profile = profileQuery.data?.affiliate
  const payoutAccount = payoutAccountQuery.data

  const [paypalEmail, setPaypalEmail] = useState('')
  const [website, setWebsite] = useState('')
  const [bio, setBio] = useState('')
  const [taxId, setTaxId] = useState('')

  useEffect(() => {
    if (profile) {
      setPaypalEmail((profile.paypalEmail as string) ?? '')
      setWebsite((profile.website as string) ?? '')
      setBio((profile.bio as string) ?? '')
      setTaxId((profile.taxId as string) ?? '')
    }
  }, [profile])

  const updateMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.updateProfile(body),
    onSuccess: () => {
      toast.success('Profile updated')
      queryClient.invalidateQueries({ queryKey: ['affiliate-profile'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const stripeOnboardingMutation = useMutation({
    mutationFn: () => api.initiateStripeOnboarding(),
    onSuccess: ({ url }) => {
      window.location.href = url
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const stripeLoginLinkMutation = useMutation({
    mutationFn: () => api.getStripeLoginLink(),
    onSuccess: ({ url }) => {
      window.location.href = url
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate({
      paypalEmail,
      website,
      bio,
      taxId,
    })
  }

  if (profileQuery.isLoading) {
    return (
      <PageShell
        nested
        className="bg-background"
        containerClassName="max-w-2xl"
        contentClassName="py-6"
      >
        <div className="flex min-h-[240px] items-center justify-center">
          <Spinner size="large" />
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell
      nested
      className="bg-background"
      containerClassName="max-w-2xl"
      contentClassName="space-y-5 py-6"
    >
      <PageHeader
        title="Affiliate Settings"
        description="Manage your payout information and profile."
      />

      {/* Stripe Connect payout account */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Stripe Payout Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {payoutAccountQuery.isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner size="small" />
              <span>Checking status…</span>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Connection status</p>
                  <div className="flex items-center gap-2">
                    {stripeStatusBadge(payoutAccount?.payoutProviderStatus ?? 'NOT_SET')}
                    {payoutAccount?.payoutsEnabled && (
                      <span className="flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle className="h-3 w-3" /> Payouts enabled
                      </span>
                    )}
                    {payoutAccount?.detailsSubmitted && !payoutAccount.payoutsEnabled && (
                      <span className="flex items-center gap-1 text-xs text-yellow-600">
                        <Clock className="h-3 w-3" /> Awaiting Stripe review
                      </span>
                    )}
                  </div>
                  {payoutAccount?.payoutProviderAccountId && (
                    <p className="text-xs font-mono text-muted-foreground">
                      {payoutAccount.payoutProviderAccountId}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  {!payoutAccount?.payoutsEnabled && (
                    <Button
                      variant="primary"
                      size="small"
                      onClick={() => stripeOnboardingMutation.mutate()}
                      disabled={stripeOnboardingMutation.isPending}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      {payoutAccount?.payoutProviderAccountId ? 'Resume onboarding' : 'Connect Stripe'}
                    </Button>
                  )}
                  {payoutAccount?.payoutsEnabled && (
                    <Button
                      variant="outline"
                      size="small"
                      onClick={() => stripeLoginLinkMutation.mutate()}
                      disabled={stripeLoginLinkMutation.isPending}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Manage Stripe account
                    </Button>
                  )}
                </div>
              </div>

              {!payoutAccount?.payoutsEnabled && (
                <div className="flex items-start gap-2 rounded-md bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 p-3 text-sm text-yellow-800 dark:text-yellow-200">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>
                    Connect a Stripe account to receive automatic payouts. Without it, only manual payments can be issued.
                  </span>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Payout Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">PayPal email</label>
              <Input
                type="email"
                value={paypalEmail}
                onChange={(e) => setPaypalEmail(e.target.value)}
                placeholder="affiliate@example.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Website or social link</label>
              <Input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://myblog.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Bio / audience description</label>
              <textarea
                className="flex min-h-[100px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tax ID (optional)</label>
              <Input
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                placeholder="SSN or EIN"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" variant="primary" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </PageShell>
  )
}
