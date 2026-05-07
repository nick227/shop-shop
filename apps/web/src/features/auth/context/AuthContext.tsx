/**
 * Authentication Context
 * 
 * Provides authentication state to the entire application.
 * Handles token storage, user session management, and auto-refresh.
 */

import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useCallback, useReducer } from 'react'
import type { User } from '../types'
import { useAuthStore } from '@stores/authStore'

// ========================================
// Types & Interfaces
// ========================================

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
  accessToken: string | null
  refreshToken: string | null
}

export interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
  accessToken: string | null
  refreshToken: string | null
  login: (user: User, accessToken: string, refreshToken: string) => Promise<void>
  logout: () => Promise<void>
  refreshAccessToken: () => Promise<void>
  clearError: () => void
}

export type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; accessToken: string; refreshToken: string } }
  | { type: 'LOGIN_FAILURE'; payload: { error: string } }
  | { type: 'LOGOUT' }
  | { type: 'REFRESH_TOKEN'; payload: { accessToken: string; refreshToken: string } }
  | { type: 'CLEAR_ERROR' }

// ========================================
// Initial State
// ========================================

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null,
  accessToken: null,
  refreshToken: null
}

// ========================================
// Auth Reducer
// ========================================

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_START': {
      return {
        ...state,
        loading: true,
        error: null
      }
    }
    
    case 'LOGIN_SUCCESS': {
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        loading: false,
        error: null,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken
      }
    }
    
    case 'LOGIN_FAILURE': {
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loading: false,
        error: action.payload.error,
        accessToken: null,
        refreshToken: null
      }
    }
    
    case 'LOGOUT': {
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null,
        accessToken: null,
        refreshToken: null
      }
    }
    
    case 'REFRESH_TOKEN': {
      return {
        ...state,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken
      }
    }
    
    case 'CLEAR_ERROR': {
      return {
        ...state,
        error: null
      }
    }
    
    default: {
      return state
    }
  }
}

// ========================================
// Auth Context
// ========================================

const AuthContextContext = createContext<AuthContextType | undefined>(undefined)

export function useAuthContext() {
  const context = useContext(AuthContextContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}

// ========================================
// Auth Provider Component
// ========================================

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // ========================================
  // Token Storage Utilities
  // ========================================

  const storeTokens = useCallback(async (accessToken: string, refreshToken: string) => {
    try {
      // Store tokens in useAuthStore for consistency
      useAuthStore.getState().setAuth(
        { 
          id: '', // Will be updated by login response
          email: '',
          name: '',
          role: 'USER',
          phone: null,
          createdAt: new Date(),
          updatedAt: new Date()
        } as any, // Temporary fix - User type needs to be aligned
        accessToken
      )
    } catch (error) {
      console.error('Failed to store tokens:', error)
    }
  }, [])

  const clearTokens = useCallback(() => {
    try {
      // Clear tokens from useAuthStore for consistency
      useAuthStore.getState().clearAuth()
    } catch (error) {
      console.error('Failed to clear tokens:', error)
    }
  }, [])

  const getStoredTokens = useCallback(() => {
    try {
      // Get tokens from useAuthStore for consistency
      const state = useAuthStore.getState()
      return { 
        accessToken: state.token || null, 
        refreshToken: state.token || null // Simplified - using same token for both
      }
    } catch (error) {
      console.error('Failed to get stored tokens:', error)
      return { accessToken: null, refreshToken: null }
    }
  }, [])

  // ========================================
  // Login Function
  // ========================================

  const login = useCallback(async (user: User, accessToken: string, refreshToken: string) => {
    dispatch({ type: 'LOGIN_START' })
    
    try {
      await storeTokens(accessToken, refreshToken)
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user, accessToken, refreshToken }
      })
    } catch (error) {
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: { error: error instanceof Error ? error.message : 'Login failed' }
      })
      throw error
    }
  }, [storeTokens])

  // ========================================
  // Logout Function
  // ========================================

  const logout = useCallback(async () => {
    try {
      // Call logout endpoint to invalidate session
      const authBaseUrl = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')
      const { accessToken } = getStoredTokens()
      if (accessToken) {
        await fetch(`${authBaseUrl}/auth/v1/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })
      }
    } catch (error) {
      console.error('Logout API call failed:', error)
    } finally {
      clearTokens()
      dispatch({ type: 'LOGOUT' })
    }
  }, [getStoredTokens, clearTokens])

  // ========================================
  // Token Refresh Function
  // ========================================

  const refreshToken = useCallback(async () => {
    const authBaseUrl = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')
    const { refreshToken: storedRefreshToken } = getStoredTokens()
    
    if (!storedRefreshToken) {
      throw new Error('No refresh token available')
    }

    try {
      const response = await fetch(`${authBaseUrl}/auth/v1/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: storedRefreshToken }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Token refresh failed')
      }

      await storeTokens(data.accessToken, data.refreshToken)
      
      dispatch({
        type: 'REFRESH_TOKEN',
        payload: { accessToken: data.accessToken, refreshToken: data.refreshToken }
      })
    } catch (error) {
      console.error('Token refresh failed:', error)
      // Clear tokens and logout on refresh failure
      clearTokens()
      dispatch({ type: 'LOGOUT' })
      throw error
    }
  }, [getStoredTokens, storeTokens, clearTokens])

  // ========================================
  // Clear Error Function
  // ========================================

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' })
  }, [])

  // ========================================
  // Initialize Auth State
  // ========================================

  useEffect(() => {
    const initializeAuth = async () => {
      let authResolved = false
      const authBaseUrl = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')
      const { accessToken, refreshToken: storedRefreshToken } = getStoredTokens()
      
      if (!accessToken || !storedRefreshToken) {
        dispatch({ type: 'LOGIN_FAILURE', payload: { error: 'No tokens found' } })
        authResolved = true
        return
      }

      try {
        // Validate current access token by getting current user info
        const response = await fetch(`${authBaseUrl}/auth/v1/me`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const data = await response.json()
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: {
              user: data,
              accessToken,
              refreshToken: storedRefreshToken
            }
          })
          authResolved = true
        } else {
          // Access token invalid, try refresh
          await refreshToken()
          authResolved = true
        }
      } catch (error) {
        console.error('Auth initialization failed:', error)
        dispatch({ type: 'LOGIN_FAILURE', payload: { error: 'Session expired' } })
        authResolved = true
      } finally {
        // Guarantee auth loading terminates on every async path.
        if (!authResolved) {
          dispatch({ type: 'LOGIN_FAILURE', payload: { error: 'Session initialization failed' } })
        }
      }
    }

    initializeAuth()
  }, [getStoredTokens, refreshToken])

  // ========================================
  // Context Value
  // ========================================

  const contextValue: AuthContextType = {
    ...state,
    login,
    logout,
    refreshAccessToken: refreshToken,
    clearError
  }

  return (
    <AuthContextContext.Provider value={contextValue}>
      {children}
    </AuthContextContext.Provider>
  )
}

// ========================================
// Export Context
// ========================================

export const AuthContext = AuthContextContext
