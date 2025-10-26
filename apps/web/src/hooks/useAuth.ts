/**
 * useAuth Hook - Authentication logic;
 */
import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@api/client'
import { useAuthStore } from '@stores/authStore'
import { handleApiError, type AppError } from '@api/errors'
import type { SignupInput, LoginInput, User } from '@api/types'

export function useAuth() {
  const { user, isAuthenticated, setAuth, clearAuth } = useAuthStore()

  const loginMutation = useMutation<unknown, AppError, LoginInput>({
    mutationFn: async (credentials) => {
      try {
        return await apiClient.auth().login({
          loginRequest: credentials})
      } catch (error: any) {
        throw await handleApiError(error)
      }
    },
    onSuccess: (data) => {
      const authData = data as { user: User; token: string }
      setAuth(authData.user, authData.token)
      apiClient.setToken(authData.token)
    }})

  const signupMutation = useMutation<unknown, AppError, SignupInput>({
    mutationFn: async (input) => {
      try {
        return await apiClient.auth().signup({
          signupRequest: input})
      } catch (error: any) {
        throw await handleApiError(error)
      }
    },
    onSuccess: (data) => {
      const authData = data as { user: User; token: string }
      setAuth(authData.user, authData.token)
      apiClient.setToken(authData.token)
    }})

  const logout = () => {
    clearAuth()
    apiClient.setToken(null)
  }

  return {
    user,
    isAuthenticated,
    login: loginMutation.mutate,
    signup: signupMutation.mutate,
    logout,
    isLoggingIn: loginMutation.isPending,
    isSigningUp: signupMutation.isPending,
    loginError: loginMutation.error,
    signupError: signupMutation.error}
}

