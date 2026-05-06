import { DualAuthWidget } from '@features/auth/DualAuthWidget/DualAuthWidget'
import { useLocation, useNavigate, Navigate } from 'react-router-dom'
import { useAuthStore } from '@stores/authStore'
import { PageShell } from '@shared/ui/layout/PageShell'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  if (isAuthenticated) {
    const from = (location.state)?.from as string | undefined
    return <Navigate to={from || '/'} replace />
  }

  return (
    <PageShell className="bg-background" containerClassName="max-w-4xl" contentClassName="py-10 md:py-14">
      <div className="flex items-center justify-center">
        <DualAuthWidget
          onSuccess={() => {
            const from = (location.state)?.from as string | undefined
            navigate(from || '/', { replace: true })
          }}
        />
      </div>
    </PageShell>
  )
}
