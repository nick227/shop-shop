/**
 * Authentication Hook
 *
 * Provides centralized authentication state management for the entire application.
 * Handles login, logout, token refresh, and user session persistence.
 */

import { useCallback, useEffect, useContext, useState } from 'react'
import { AuthContext } from '../context/AuthContext'
import type { LoginCredentials } from '../types'
import { useAuthStore } from '@stores/authStore'
import { apiClient } from '@api/client'

export interface UseAuthProps {
  onSuccess?: () => void
  onError?: (error: string) => void
}

export function useAuth({ onSuccess, onError }: UseAuthProps = {}) {
  const authContext = useContext(AuthContext)
  const authBaseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
  const setAuth = useAuthStore((state) => state.setAuth)

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
    refreshAccessToken: contextRefreshToken,
  } = authContext

  // ========================================
  // State Management
  // ========================================

  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [isSigningUp, setIsSigningUp] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [signupError, setSignupError] = useState<string | null>(null)

  // ========================================
  // Login Function
  // ========================================

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      setIsLoggingIn(true)
      setLoginError(null)
      try {
        const response = await fetch(`${authBaseUrl}/api/auth/v1/login`, {
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

        const accessToken = data.accessToken ?? data.token
        const refreshToken = data.refreshToken ?? data.token

        if (!accessToken) {
          throw new Error('Login response did not include a token')
        }

        // Store tokens and user data in both auth layers while the app still uses both.
        await contextLogin(data.user, accessToken, refreshToken)
        setAuth(data.user, accessToken)
        apiClient.setToken(accessToken)

        onSuccess?.()
        return data
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Login failed'
        setLoginError(errorMessage)
        onError?.(errorMessage)
        throw error
      } finally {
        setIsLoggingIn(false)
      }
    },
    [authBaseUrl, contextLogin, onSuccess, onError, setAuth]
  )

  // ========================================
  // Signup Function
  // ========================================

  const signup = useCallback(
    async (credentials: LoginCredentials) => {
      setIsSigningUp(true)
      setSignupError(null)
      try {
        const storedAffiliateReferralCode = localStorage.getItem('affiliateReferralCode') || undefined
        const signupPayload = {
          ...credentials,
          ...(storedAffiliateReferralCode ? { affiliateReferralCode: storedAffiliateReferralCode } : {}),
        }

        const response = await fetch(`${authBaseUrl}/api/auth/v1/signup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(signupPayload),
        })

        const data = await response.json()

        if (!response.ok) {
          const apiError =
            (typeof data?.message === 'string' && data.message) ||
            (typeof data?.error === 'string' && data.error) ||
            'Signup failed'
          throw new Error(apiError)
        }

        const accessToken = data.accessToken ?? data.token
        const refreshToken = data.refreshToken ?? data.token

        if (!accessToken) {
          throw new Error('Signup response did not include a token')
        }

        // Store tokens and user data in both auth layers while the app still uses both.
        await contextLogin(data.user, accessToken, refreshToken)
        setAuth(data.user, accessToken)
        apiClient.setToken(accessToken)

        // Referral code has been consumed for attribution; clear it.
        if (storedAffiliateReferralCode) {
          localStorage.removeItem('affiliateReferralCode')
          localStorage.removeItem('affiliateReferralId')
        }

        onSuccess?.()
        return data
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Signup failed'
        setSignupError(errorMessage)
        onError?.(errorMessage)
        throw error
      } finally {
        setIsSigningUp(false)
      }
    },
    [authBaseUrl, contextLogin, onSuccess, onError, setAuth]
  )

  // ========================================
  // Logout Function
  // ========================================

  const logout = useCallback(async () => {
    try {
      await contextLogout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      apiClient.setToken(undefined)
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
    const refreshInterval = setInterval(
      () => {
        refreshToken()
      },
      14 * 60 * 1000
    )

    return () => clearInterval(refreshInterval)
  }, [isAuthenticated, refreshToken])

  // ========================================
  // Computed Values
  // ========================================

  const normalizedRole = user?.role?.toUpperCase()
  const isCustomer = normalizedRole === 'USER' || normalizedRole === 'CUSTOMER'
  const isVendor = normalizedRole === 'VENDOR'
  const isAdmin = normalizedRole === 'ADMIN'
  const isAffiliate = normalizedRole === 'AFFILIATE'

  return {
    user,
    isAuthenticated,
    loading,
    error,
    isLoggingIn,
    isSigningUp,
    loginError,
    signupError,

    isCustomer,
    isVendor,
    isAdmin,
    isAffiliate,

    login,
    signup,
    logout,
    refreshToken,
  }
}
