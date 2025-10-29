/**
 * AuthLayout - Simple layout for authentication pages
 * 
 * Features:
 * - Minimal UI for login/signup pages
 * - Centered content with card styling
 * - No navigation or complex elements
 */

import { Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Outlet />
      </div>
    </div>
  )
}
