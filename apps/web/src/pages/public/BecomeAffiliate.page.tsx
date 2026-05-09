import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@stores/authStore'
import { useAffiliateApi } from '@shared/hooks/hooks/affiliate/useAffiliateApi'
import { PageShell } from '@shared/ui/layout/PageShell'
import { Button, Input, Spinner } from '@shared/ui/primitives'
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/primitives/ui/Card/Card'
import { toast } from 'sonner'
import { Handshake } from 'lucide-react'

export default function BecomeAffiliatePage() {
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const api = useAffiliateApi()

  const [bio, setBio] = useState('')
  const [website, setWebsite] = useState('')
  const [paypalEmail, setPaypalEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/become-affiliate' } })
      return
    }
    setSubmitting(true)
    try {
      await api.signup({ bio, website, paypalEmail })
      toast.success('You are now an affiliate!')
      navigate('/affiliate/dashboard')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to submit application')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageShell
      className="bg-background"
      containerClassName="max-w-lg"
      contentClassName="py-10 md:py-14"
    >
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Handshake className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Become an Affiliate</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Earn commissions by referring stores and customers to Shop-Shop.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Website or social link</label>
              <Input
                type="url"
                placeholder="https://myblog.com"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Bio / audience description</label>
              <textarea
                className="flex min-h-[100px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                placeholder="Tell us about your audience and how you plan to promote..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">PayPal email</label>
              <Input
                type="email"
                placeholder="affiliate@example.com"
                value={paypalEmail}
                onChange={(e) => setPaypalEmail(e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full" variant="primary" disabled={submitting}>
              {submitting ? <Spinner size="small" /> : 'Submit Application'}
            </Button>

            {!isAuthenticated && (
              <p className="text-center text-xs text-muted-foreground">
                You'll be asked to log in first.
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </PageShell>
  )
}
