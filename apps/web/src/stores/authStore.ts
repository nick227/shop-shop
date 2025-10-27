/**
 * Auth Store - Zustand (Minimal State Management)
 * Only stores auth state, all other state via React Query
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserResponse } from '@api/backend-types'

interface AuthState {
  user: UserResponse | undefined
  token: string | undefined
  isAuthenticated: boolean
  
  // Actions
  setAuth: (user: UserResponse, token: string) => void
  clearAuth: () => void
  updateUser: (user: Partial<UserResponse>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: undefined,
      token: undefined,
      isAuthenticated: false,

      setAuth: (user, token) =>
        set({
          user,
          token,
          isAuthenticated: true,
        }),

      clearAuth: () =>
        set({
          user: undefined,
          token: undefined,
          isAuthenticated: false,
        }),

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : undefined,
        })),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

