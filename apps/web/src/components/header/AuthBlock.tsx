import React from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@stores/authStore'

interface AuthBlockProps {
  className?: string
}

export function AuthBlock({ className = '' }: AuthBlockProps) {
  const { user, isAuthenticated } = useAuthStore()

  if (isAuthenticated && user) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <Link
          to="/account/profile"
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
            </span>
          </div>
          <span className="text-sm font-medium text-gray-700">
            {user.name || user.email}
          </span>
        </Link>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Link
        to="/login"
        className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
      >
        Login
      </Link>
      <Link
        to="/signup"
        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
      >
        Sign Up
      </Link>
    </div>
  )
}
