/**
 * NotFoundPage - 404 Error Page;
 */
import { Link, useLocation } from 'react-router-dom'
import { Button } from '@shared/ui/primitives'

export default function NotFoundPage() {
  const location = useLocation()

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-8xl font-bold text-primary">404</h1>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight">
            Page Not Found
          </h2>
          <p className="mt-3 text-muted-foreground text-sm">
            The page <code className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">{location.pathname}</code> doesn't exist.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Link to="/">
            <Button variant="primary" fullWidth>Go to Home</Button>
          </Link>
          <Button variant="outline" fullWidth onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>

        <div className="mt-8 pt-8 border-t border-border">
          <p className="text-caption mb-4">
            Need help? Check out these links:
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link to="/" className="text-primary hover:underline">Browse Stores</Link>
            <Link to="/cart" className="text-primary hover:underline">View Cart</Link>
            <Link to="/orders" className="text-primary hover:underline">Order History</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
