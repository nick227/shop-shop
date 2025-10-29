/**
 * User Queries
 * 
 * All read operations related to users.
 * Feature-agnostic query functions.
 */

import { api } from '../client-adapter'
import type { UserResponse } from '@packages/sdk'

/**
 * Get current user
 */
export async function getCurrentUser(): Promise<UserResponse | null> {
  try {
    const response = await api.users.getCurrentUser()
    return response.data || null
  } catch (error) {
    if (error instanceof Error && error.message.includes('401')) {
      return null
    }
    throw error
  }
}

/**
 * Get user by ID
 */
export async function getUserById(id: string): Promise<UserResponse | null> {
  try {
    const response = await api.users.getUserById(id)
    return response.data || null
  } catch (error) {
    if (error instanceof Error && error.message.includes('404')) {
      return null
    }
    throw error
  }
}
