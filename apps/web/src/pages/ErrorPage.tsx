/**
 * ErrorPage - Router Error Boundary Page
 */
import { Link, useRouteError, isRouteErrorResponse } from 'react-router-dom'
import { Button } from '@shared/ui/primitives'

export default function ErrorPage() {
  const error = useRouteError()
  
  let title = 'Something went wrong'
  let message = 'An unexpected error occurred'
  let statusCode = 500

  if (isRouteErrorResponse(error)) {
    statusCode = error.status
    title = error.statusText || 'Error ' + error.status + ''
    message = error.data?.message ?? error.data ?? 'An error occurred while loading this page'
  } else if (error && typeof error === 'object' && 'message' in error) {
    const errorMessage = (error as { message: string }).message
    message = errorMessage ?? 'An unexpected error occurred'
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-8xl font-bold text-destructive">{statusCode}</h1>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight">
            {title}
          </h2>
          <p className="mt-3 text-muted-foreground text-sm">
            {message}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Link to="/">
            <Button variant="primary" fullWidth>Go to Home</Button>
          </Link>
          <Button variant="outline" fullWidth onClick={() => window.location.reload()}>
            Reload Page
          </Button>
        </div>

        {import.meta.env.DEV && error && typeof error === 'object' && 'stack' in error ? (
          <div className="mt-8 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-left">
            <p className="text-xs font-mono text-destructive break-all">
              {(error as { stack: string }).stack}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
