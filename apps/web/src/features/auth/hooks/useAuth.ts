/**
 * Authentication Hook
 * 
 * Provides centralized authentication state management for the entire application.
 * Handles login, logout, token refresh, and user session persistence.
 */

import { useCallback, useEffect, useContext } from 'react'
import { AuthContext } from '../context/AuthContext'
import type { LoginCredentials } from '../types'

export interface UseAuthProps {
  onSuccess?: () => void
  onError?: (error: string) => void
}

export function useAuth({ onSuccess, onError }: UseAuthProps = {}) {
  const authContext = useContext(AuthContext)
  
  if (!authContext) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  const {
    user,
    isAuthenticated,
    loading,
    error,
    login: contextLogin,
    logout: contextLogout,
    refreshAccessToken: contextRefreshToken
  } = authContext

  // ========================================
  // Login Function
  // ========================================
  
  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      const response = await fetch('/api/auth/v1/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Login failed')
      }

      // Store tokens and user data
      await contextLogin(data.user, data.accessToken, data.refreshToken)
      
      onSuccess?.()
      return data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed'
      onError?.(errorMessage)
      throw error
    }
  }, [contextLogin, onSuccess, onError])

  // ========================================
  // Logout Function
  // ========================================
  
  const logout = useCallback(async () => {
    try {
      await contextLogout()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }, [contextLogout])

  // ========================================
  // Token Refresh Function
  // ========================================
  
  const refreshToken = useCallback(async () => {
    try {
      await contextRefreshToken()
    } catch (error) {
      console.error('Token refresh error:', error)
      // If refresh fails, logout the user
      await logout()
    }
  }, [contextRefreshToken, logout])

  // ========================================
  // Auto-refresh Token
  // ========================================
  
  useEffect(() => {
    if (!isAuthenticated) return

    // Set up token refresh timer (14 minutes - 1 minute before expiry)
    const refreshInterval = setInterval(() => {
      refreshToken()
    }, 14 * 60 * 1000)

    return () => clearInterval(refreshInterval)
  }, [isAuthenticated, refreshToken])

  // ========================================
  // Computed Values
  // ========================================
  
  const isCustomer = user?.role === 'customer'
  const isVendor = user?.role === 'vendor'
  const isAdmin = user?.role === 'admin'

  return {
    // State
    user,
    isAuthenticated,
    loading,
    error,
    
    // Computed values
    isCustomer,
    isVendor,
    isAdmin,
    
    // Actions
    login,
    logout,
    refreshToken
  }
}
