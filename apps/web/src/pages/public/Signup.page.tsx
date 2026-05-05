import { SignupForm } from '@features/auth/SignupForm'
import { useLocation, useNavigate, Navigate } from 'react-router-dom'
import { useAuthStore } from '@stores/authStore'

export default function SignupPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  if (isAuthenticated) {
    const from = (location.state)?.from as string | undefined
    return <Navigate to={from || '/'} replace />
  }

  return (
    <SignupForm
      onSuccess={() => {
        const from = (location.state)?.from as string | undefined
        navigate(from || '/', { replace: true })
      }}
    />
  )
}
