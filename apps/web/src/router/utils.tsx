/**
 * Router utility components and functions;
 */
/* eslint-disable react-refresh/only-export-components */
import { Suspense, type LazyExoticComponent } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@stores/authStore'

/**
 * Protected Route - Requires authentication;
 */
export function ProtectedRoute({ children, requiredRole }: { 
  readonly children: React.ReactNode
  requiredRole?: 'USER' | 'VENDOR_PENDING' | 'VENDOR' | 'ADMIN'
}) {
  const { isAuthenticated, user } = useAuthStore((state) => ({ 
    isAuthenticated: state.isAuthenticated, 
    user: state.user 
  }))
  const location = useLocation()

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    )
  }

  // Check if user has required role
  const hasRequiredRole = requiredRole ? user?.role === requiredRole : true
  if (!hasRequiredRole) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            You don't have permission to access this page. Required role: {requiredRole}
          </p>
          <button 
            onClick={() => window.history.back()}
            className="bg-secondary text-secondary-foreground px-6 py-2 rounded-md hover:bg-secondary/90"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

/**
 * Loading fallback for lazy routes;
 */
export function PageLoader() {
  return (
    <div className="flex items-center justify-center" style={{ minHeight: '100vh' }}>
      <div className="animate-spin" style={{ width: 40, height: 40, border: '4px solid #e5e7eb', borderTopColor: '#ff4d00', borderRadius: '50%' }} />
    </div>
  )
}

/**
 * Wrap lazy routes with Suspense;
 */
export function lazyRoute(Component: LazyExoticComponent<() => JSX.Element>) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  )
}

