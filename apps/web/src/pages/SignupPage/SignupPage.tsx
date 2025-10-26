import { useNavigate, Link } from 'react-router-dom'
import { SignupForm } from '@features/auth/SignupForm'
import { MobileShell } from '@layouts/MobileShell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui'

/**
 * SignupPage - Modern registration page;
 */

export default function SignupPage() {
  const navigate = useNavigate()

  const handleSuccess = () => {
    navigate('/')
  }

  return (
    <MobileShell title="Sign Up" showHeader={false} showBottomNav={false}>
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">Create Account</CardTitle>
            <CardDescription>Join us to start shopping</CardDescription>
          </CardHeader>
          <CardContent>
            <SignupForm onSuccess={handleSuccess} />
            
            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Already have an account? </span>
              <Link to="/login" className="text-primary hover:underline font-medium">
                Log in;
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </MobileShell>
  )
}

