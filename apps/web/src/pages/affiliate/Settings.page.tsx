import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAffiliateApi } from '@shared/hooks/hooks/affiliate/useAffiliateApi'
import { PageShell } from '@shared/ui/layout/PageShell'
import { PageHeader } from '@shared/ui/layout/PageLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/primitives/ui/Card/Card'
import { Button, Input, Spinner } from '@shared/ui/primitives'
import { toast } from 'sonner'

export default function AffiliateSettingsPage() {
  const api = useAffiliateApi()
  const queryClient = useQueryClient()

  const profileQuery = useQuery({
    queryKey: ['affiliate-profile'],
    queryFn: () => api.getMyProfile(),
  })

  const profile = profileQuery.data?.affiliate

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
