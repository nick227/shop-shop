/**
 * Router utility components and functions;
 */
/* eslint-disable react-refresh/only-export-components */
import { Suspense, type LazyExoticComponent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@stores/authStore'

/**
 * Protected Route - Requires authentication;
 */
export function ProtectedRoute({ children }: { readonly children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  // Always render children to maintain hook consistency
  // Authentication check happens inside the component
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

