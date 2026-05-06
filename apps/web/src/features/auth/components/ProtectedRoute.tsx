/**
 * Protected Route Component
 * 
 * Provides route protection based on authentication status and user roles.
 * Redirects unauthenticated users to login page.
 */

import React from 'react'
import { useAuth } from '../hooks/useAuth'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'USER' | 'VENDOR_PENDING' | 'VENDOR' | 'ADMIN'
  fallback?: React.ReactNode
}

export function ProtectedRoute({ 
  children, 
  requiredRole, 
  fallback 
}: ProtectedRouteProps) {
  const { isAuthenticated, loading, user } = useAuth()
  const normalizedRole = user?.role?.toUpperCase()

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Check if user is authenticated
  if (!isAuthenticated) {
    if (fallback) {
      return <>{fallback}</>
    }
    
    // Redirect to login page (in a real app, you'd use React Router)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please log in to access this page.</p>
          <button 
            onClick={() => window.location.href = '/login'}
            className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary/90"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  // Check if user has required role
  const hasRequiredRole = requiredRole ? normalizedRole === requiredRole : true
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

  // User is authenticated and has required role
  return <>{children}</>
}
