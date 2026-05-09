import { useEffect, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { PageShell } from '@shared/ui/layout/PageShell'
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/primitives/ui/Card/Card'
import { useAffiliateApi } from '@shared/hooks/hooks/affiliate/useAffiliateApi'
import { AffiliateApiError } from '@shared/hooks/hooks/affiliate/affiliateApiError'

type AffiliateAccountStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'TERMINATED'

function getStatusFromPath(pathname: string): AffiliateAccountStatus {
  if (pathname.endsWith('/pending')) return 'PENDING'
  if (pathname.endsWith('/suspended')) return 'SUSPENDED'
  if (pathname.endsWith('/unavailable')) return 'TERMINATED'
  return 'TERMINATED'
}

export default function AffiliateStatusPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const api = useAffiliateApi()

  const status = useMemo(() => {
    const st = (location.state as { status?: AffiliateAccountStatus } | null)?.status
    return st ?? getStatusFromPath(location.pathname)
  }, [location.pathname, location.state])

  useEffect(() => {
    api
      .getMyApplication()
      .then((res) => {
        const st = res.affiliate?.status
        switch (st) {
        case 'ACTIVE': {
        navigate('/affiliate/dashboard', { replace: true })
        break;
        }
        case 'PENDING': {
        navigate('/affiliate/pending', { replace: true })
        break;
        }
        case 'SUSPENDED': {
        navigate('/affiliate/suspended', { replace: true })
        break;
        }
        case 'TERMINATED': { {
        navigate('/affiliate/unavailable', { replace: true })
        // No default
        }
        break;
        }
        }
      })
      .catch((error: unknown) => {
        if (error instanceof AffiliateApiError && error.affiliateStatus) {
          const s = error.affiliateStatus
          switch (s) {
          case 'PENDING': {
          navigate('/affiliate/pending', { replace: true })
          break;
          }
          case 'SUSPENDED': {
          navigate('/affiliate/suspended', { replace: true })
          break;
          }
          case 'TERMINATED': { {
          navigate('/affiliate/unavailable', { replace: true })
          // No default
          }
          break;
          }
          }
        }
      })
    // Intentionally run once per mount on these small status pages.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const copy =
    status === 'PENDING'
      ? {
          title: 'Pending approval',
          body: 'Your affiliate application is under review.',
        }
      : (status === 'SUSPENDED'
        ? {
            title: 'Account suspended',
            body: 'Your affiliate account is currently suspended. Contact support if this seems wrong.',
          }
        : {
            title: 'Affiliate unavailable',
            body: 'This affiliate account is no longer active.',
          })

  return (
    <PageShell className="bg-background" containerClassName="max-w-lg" contentClassName="py-10 md:py-14">
      <Card className="text-center">
        <CardHeader>
          <CardTitle className="text-2xl">{copy.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{copy.body}</p>
        </CardContent>
      </Card>
    </PageShell>
  )
}

