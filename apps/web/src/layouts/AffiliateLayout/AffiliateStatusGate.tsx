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

        if (st === 'PENDING') navigate('/affiliate/pending', { replace: true })
        else if (st === 'SUSPENDED') navigate('/affiliate/suspended', { replace: true })
        else if (st === 'TERMINATED') navigate('/affiliate/unavailable', { replace: true })
        else navigate('/affiliate/unavailable', { replace: true })
      })
      .catch((err: unknown) => {
        if (cancelled) return
        if (err instanceof AffiliateApiError && err.httpStatus === 404) {
          navigate('/affiliate/unavailable', { replace: true })
          return
        }
        if (err instanceof AffiliateApiError && err.httpStatus === 403) {
          navigate('/affiliate/unavailable', { replace: true })
          return
        }
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

