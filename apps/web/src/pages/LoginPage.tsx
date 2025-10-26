/**
 * LoginPage - Single-focus login (no tabs)
 * Philosophy: One action, bold CTA, minimal distraction;
 * Migrated to Tailwind (removed non-existent CSS reference)
 */
import { Link, useNavigate } from 'react-router-dom'
import { LoginForm } from '../features/auth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@ui'
import { MobileShell } from '@layouts/MobileShell'

export default function LoginPage() {
  const navigate = useNavigate()

  const handleSuccess = () => {
    navigate('/', { replace: true })
  }

  return (
    <MobileShell title="Sign In" showHeader={false} showBottomNav={false}>
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="text-5xl mb-4">👋</div>
            <CardTitle className="text-3xl">Welcome Back</CardTitle>
            <CardDescription>Sign in to continue</CardDescription>
          </CardHeader>
          
          <CardContent>
            <LoginForm onSuccess={handleSuccess} />
            
            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">New here? </span>
              <Link to="/signup" className="text-primary hover:underline font-medium">
                Create account;
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </MobileShell>
  )
}


