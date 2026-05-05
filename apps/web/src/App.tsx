/**
 * App Root Component - Provides global context and routing;
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { useEffect } from 'react'
import { apiClient } from './api/client'
import { useAuthStore } from './stores/authStore'
import { ErrorBoundary } from '@shared/ui/ErrorBoundary'
import { Toaster } from '@shared/ui/primitives'
import { AuthProvider } from './features/auth/context/AuthContext'
// Use a relative import here to avoid TS path-alias resolution issues in some editors/tooling.
import { setupViewTransitions } from './shared/lib/utils/view-transitions'

// Create QueryClient instance;
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes;
      gcTime: 1000 * 60 * 30, // 30 minutes;
      refetchOnWindowFocus: false,
      retry: 1}}})

export default function App() {
  const clearAuth = useAuthStore((state) => state.clearAuth)
  const token = useAuthStore((state) => state.token)

  // Single effect for token sync - only runs when token changes;
  useEffect(() => {
    apiClient.setToken(token ?? undefined)
  }, [token])

  // Listen for auth:logout events (from API 401 responses)
  useEffect(() => {
    const handleLogout = () => {
      clearAuth()
    }

    window.addEventListener('auth:logout', handleLogout)
    return () => window.removeEventListener('auth:logout', handleLogout)
  }, [clearAuth])

  // Setup View Transitions API;
  useEffect(() => {
    setupViewTransitions()
  }, [])

  // Don't render app until auth store is hydrated from localStorage;
  // This prevents flash of unauthenticated content while preserving access to login/signup;
  if (!useAuthStore.persist.hasHydrated()) {
    return;
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RouterProvider router={router} />
          <Toaster />
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
