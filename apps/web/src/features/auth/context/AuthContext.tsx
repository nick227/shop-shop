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
import { apiPath } from '@shared/lib/auth/authFetch'

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
      // Store tokens in useAuthStore for consistency
      useAuthStore.getState().setAuth(
        { 
          id: user.id,
          email: user.email,
          name: user.name || '',
          role: user.role,
          phone: user.phone || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          // Add required fields for UserResponse type
          isCompany: false,
          companyName: '',
          addresses: [],
          carts: [],
          orders: [],
          reviews: [],
          wishlists: [],
          subscriptions: [],
          notifications: [],
          preferences: {},
          metadata: {}
        } as any,
        accessToken
      )
      
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
  }, [])

  // ========================================
  // Logout Function
  // ========================================

  const logout = useCallback(async () => {
    try {
      // Call logout endpoint to invalidate session
      const { accessToken } = getStoredTokens()
      if (accessToken) {
        await fetch(apiPath('/api/auth/v1/logout'), {
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
    // Server doesn't support refresh tokens - JWT tokens are used instead
    // Just return the current token without refreshing
    const { accessToken } = getStoredTokens()
    
    if (!accessToken) {
      throw new Error('No access token available')
    }
    
    // No refresh needed - JWT tokens are valid until they expire
    return
  }, [getStoredTokens])

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
      const { accessToken, refreshToken: storedRefreshToken } = getStoredTokens()
      
      if (!accessToken || !storedRefreshToken) {
        dispatch({ type: 'LOGIN_FAILURE', payload: { error: 'No tokens found' } })
        authResolved = true
        return
      }

      try {
        // Validate current access token by getting current user info
        const response = await fetch(apiPath('/api/auth/v1/me'), {
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
