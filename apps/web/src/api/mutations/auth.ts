/**
 * Auth Mutations
 * 
 * All write operations related to authentication.
 * Feature-agnostic mutation functions.
 */

import { api } from '../client-adapter'
import type { LoginInput, SignupInput, UserResponse } from '@packages/sdk'

/**
 * Login user
 */
export async function loginUser(input: LoginInput): Promise<UserResponse> {
  const response = await api.auth.login(input)
  return response.data
}

/**
 * Signup user
 */
export async function signupUser(input: SignupInput): Promise<UserResponse> {
  const response = await api.auth.signup(input)
  return response.data
}

/**
 * Logout user
 */
export async function logoutUser(): Promise<void> {
  await api.auth.logout()
}

/**
 * Refresh token
 */
export async function refreshToken(): Promise<{ token: string }> {
  const response = await api.auth.refreshToken()
  return response.data
}
