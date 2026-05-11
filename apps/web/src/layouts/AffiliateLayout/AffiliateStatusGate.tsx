import { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAffiliateApi } from '@shared/hooks/hooks/affiliate/useAffiliateApi'
import { AffiliateApiError } from '@shared/hooks/hooks/affiliate/affiliateApiError'
import { Spinner } from '@shared/ui/primitives'

export function AffiliateStatusGate() {
  const api = useAffiliateApi()
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    api
      .getMyApplication()
      .then((res) => {
        if (cancelled) return

        const st = res.affiliate?.status
        if (!st) {
          navigate('/affiliate/unavailable', { replace: true })
          return
        }

        if (st === 'ACTIVE') {
          setReady(true)
          return
        }

        switch (st) {
        case 'PENDING': {
        navigate('/affiliate/pending', { replace: true })
        break;
        }
        case 'SUSPENDED': {
        navigate('/affiliate/suspended', { replace: true })
        break;
        }
        case 'TERMINATED': {
        navigate('/affiliate/unavailable', { replace: true })
        break;
        }
        default: { navigate('/affiliate/unavailable', { replace: true })
        }
        }
      })
      .catch((error: unknown) => {
        if (cancelled) return
        if (error instanceof AffiliateApiError && (error.httpStatus === 404 || error.httpStatus === 403)) {
          navigate('/affiliate/unavailable', { replace: true })
          return
        }
        // Non-auth errors: stop the spinner and let the user retry
        console.error('AffiliateStatusGate: unexpected error', error)
        setReady(true)
      })

    return () => {
      cancelled = true
    }
  }, [api, navigate])

  if (!ready) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <Spinner size="large" />
      </div>
    )
  }

  return <Outlet />
}

