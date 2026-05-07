import React from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@stores/authStore'

interface AuthBlockProps {
  className?: string
}

export function AuthBlock({ className = '' }: Readonly<AuthBlockProps>) {
  const { user, isAuthenticated } = useAuthStore()

  if (isAuthenticated && user) {
    return (
      <div className={`flex gap-3 items-center ${className}`}>
        <Link
          to="/account/profile"
          className="flex gap-2 items-center px-3 py-2 rounded-lg transition-colors hover:bg-gray-100"
        >
          <div className="flex justify-center items-center w-8 h-8 bg-indigo-600 rounded-full">
            <span className="text-sm font-medium text-white">
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
    <div className={`flex gap-2 items-center ${className}`}>
      <Link
        to="/login"
        className="px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:text-gray-900"
      >
        Login
      </Link>
      <Link
        to="/signup"
        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg transition-colors hover:bg-indigo-700"
      >
        Sign Up
      </Link>
    </div>
  )
}
