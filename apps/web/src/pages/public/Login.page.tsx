import { DualAuthWidget } from '@features/auth/DualAuthWidget/DualAuthWidget'
import { useLocation, useNavigate, Navigate } from 'react-router-dom'
import { useAuthStore } from '@stores/authStore'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  if (isAuthenticated) {
    const from = (location.state)?.from as string | undefined
    return <Navigate to={from || '/'} replace />
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <DualAuthWidget
        onSuccess={() => {
          const from = (location.state)?.from as string | undefined
          navigate(from || '/', { replace: true })
        }}
      />
    </div>
  )
}
