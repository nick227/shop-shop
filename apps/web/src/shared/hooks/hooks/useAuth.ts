/**
 * useAuth Hook - Authentication logic with standardized patterns
 */
import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@api/client'
import { useAuthStore } from '@stores/authStore'
import { createMutationErrorHandler, createMutationOnError, mutationRetryConfig, type CategorizedError } from './utils/errorHandling'
import type { SignupInput, LoginInput, UserResponse } from '@api/types'

export function useAuth() {
  const { user, isAuthenticated, setAuth, clearAuth } = useAuthStore()

  const loginMutation = useMutation<unknown, CategorizedError, LoginInput>({
    mutationFn: async (credentials) => {
      try {
        return await apiClient.auth().login({
          loginRequest: credentials
        })
      } catch (error: unknown) {
        return await createMutationErrorHandler()(error)
      }
    },
    onSuccess: (data) => {
      const authData = data as { user: UserResponse; token: string }
      setAuth(authData.user, authData.token)
      apiClient.setToken(authData.token)
    },
    onError: createMutationOnError(),
    ...mutationRetryConfig
  })

  const signupMutation = useMutation<unknown, CategorizedError, SignupInput>({
    mutationFn: async (input) => {
      try {
        return await apiClient.auth().signup({
          signupRequest: input
        })
      } catch (error: unknown) {
        return await createMutationErrorHandler()(error)
      }
    },
    onSuccess: (data) => {
      const authData = data as { user: UserResponse; token: string }
      setAuth(authData.user, authData.token)
      apiClient.setToken(authData.token)
    },
    onError: createMutationOnError(),
    ...mutationRetryConfig
  })

  const logout = () => {
    clearAuth()
    apiClient.setToken(undefined)
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

