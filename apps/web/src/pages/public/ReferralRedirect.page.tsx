import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PageShell } from '@shared/ui/layout/PageShell'
import { Spinner } from '@shared/ui/primitives'

function getApiBase(): string {
  return (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
}

function getSafeRedirectPath(raw: string | null): string {
  if (!raw) return '/'
  // Only allow in-app absolute paths. Disallow protocol-relative and external URLs.
  if (!raw.startsWith('/')) return '/'
  if (raw.startsWith('//')) return '/'
  return raw
}

export default function ReferralRedirectPage() {
  const { referralCode } = useParams<{ referralCode: string }>()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!referralCode) {
      navigate('/', { replace: true })
      return
    }

    fetch(`${getApiBase()}/api/affiliates/referral/${referralCode}`)
      .then((res) => {
        if (!res.ok) throw new Error('Invalid referral code')
        return res.json()
      })
      .then((data) => {
        localStorage.setItem('affiliateReferralCode', referralCode)
        if (data.affiliateId) {
          localStorage.setItem('affiliateReferralId', data.affiliateId)
        }

        const params = new URLSearchParams(window.location.search)
        const redirect = getSafeRedirectPath(params.get('redirect'))
        navigate(redirect, { replace: true })
      })
      .catch(() => {
        setError('This referral link is invalid or expired.')
      })
  }, [referralCode, navigate])

  if (error) {
    return (
      <PageShell
        className="bg-background"
        containerClassName="max-w-md"
        contentClassName="py-20 text-center"
      >
        <p className="text-muted-foreground">{error}</p>
      </PageShell>
    )
  }

  return (
    <PageShell
      className="bg-background"
      containerClassName="max-w-md"
      contentClassName="py-20 text-center"
    >
      <Spinner size="large" />
      <p className="mt-4 text-sm text-muted-foreground">Redirecting...</p>
    </PageShell>
  )
}
