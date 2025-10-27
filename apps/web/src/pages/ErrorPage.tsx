/**
 * ErrorPage - Router Error Boundary Page
 */
import { Link, useRouteError, isRouteErrorResponse } from 'react-router-dom'

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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-red-500">{statusCode}</h1>
          <h2 className="mt-4 text-3xl font-semibold text-gray-900">
            {title}
          </h2>
          <p className="mt-4 text-gray-600">
            {message}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            to="/"
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-orange-500 hover:bg-orange-600 transition-colors"
          >
            Go to Home
          </Link>
          
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            Reload Page
          </button>
        </div>

        {import.meta.env.DEV && error && typeof error === 'object' && 'stack' in error ? (
          <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-md text-left">
            <p className="text-xs font-mono text-red-900 break-all">
              {(error as { stack: string }).stack}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  )
}

