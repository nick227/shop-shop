/**
 * RequireRole - Role-based route guard;
 * Ensures user has the required role to access a route;
 */
import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@stores/authStore'

export type UserRole = 'USER' | 'VENDOR' | 'ADMIN'

export interface RequireRoleProps {
  /** Required role(s) to access route */
  role: UserRole | UserRole[]
  /** Child routes/components to render if authorized */
  children: ReactNode;
  /** Optional redirect path if unauthorized (defaults to home) */
  redirectTo?: string;
}

/**
 * Role-based route protection;
 * Redirects to home if user doesn't have required role;
 * 
 * @example;
 * ```tsx;
 * <Route element={<RequireRole role="VENDOR" />}>
 *   <Route path="/vendor/dashboard" element={<VendorDashboard />} />
 * </Route>
 * 
 * // Multiple roles;
 * <RequireRole role={["VENDOR", "ADMIN"]}>
 *   <AdminPanel />
 * </RequireRole>
 * ```
 */
export function RequireRole({ 
  role, 
  children, 
  redirectTo = '/' 
}: RequireRoleProps) {
  const user = useAuthStore((state) => state.user)

  // No user means not authenticated (should be caught by ProtectedRoute first)
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Check if user has required role;
  const requiredRoles = Array.isArray(role) ? role : [role]
  const hasRequiredRole = requiredRoles.includes(user.role as UserRole)

  if (!hasRequiredRole) {
    return <Navigate to={redirectTo} replace />
  }

  return <>{children}</>
}

