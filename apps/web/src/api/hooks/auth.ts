/**
 * Auth Hooks
 * 
 * React Query hooks for authentication operations.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { loginUser, signupUser, logoutUser, getCurrentUser } from '../mutations/auth'
import { queries } from '../queries/users'
import type { LoginInput, SignupInput, UserResponse } from '@packages/sdk'

/**
 * Hook for user login
 */
export function useLogin() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: loginUser,
    onSuccess: (user) => {
      // Update user cache
      queryClient.setQueryData(['user', 'current'], user)
      // Invalidate user-related queries
      queryClient.invalidateQueries({ queryKey: ['user'] })
    },
  })
}

/**
 * Hook for user signup
 */
export function useSignup() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: signupUser,
    onSuccess: (user) => {
      // Update user cache
      queryClient.setQueryData(['user', 'current'], user)
      // Invalidate user-related queries
      queryClient.invalidateQueries({ queryKey: ['user'] })
    },
  })
}

/**
 * Hook for user logout
 */
export function useLogout() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: logoutUser,
    onSuccess: () => {
      // Clear all user-related data
      queryClient.clear()
    },
  })
}

/**
 * Hook for getting current user
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: ['user', 'current'],
    queryFn: getCurrentUser,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on 401 (unauthorized)
      if (error instanceof Error && error.message.includes('401')) {
        return false
      }
      return failureCount < 3
    },
  })
}
