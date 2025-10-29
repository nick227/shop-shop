/**
 * User Mutations
 * 
 * All write operations related to users.
 * Feature-agnostic mutation functions.
 */

import { api } from '../client-adapter'
import type { UpdateUserInput, UserResponse } from '@packages/sdk'

/**
 * Update user
 */
export async function updateUser(id: string, input: UpdateUserInput): Promise<UserResponse> {
  const response = await api.users.updateUser(id, input)
  return response.data
}

/**
 * Delete user
 */
export async function deleteUser(id: string): Promise<void> {
  await api.users.deleteUser(id)
}
