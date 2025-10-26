import { defineResource } from '@packages/schemas/core'
import {
  UpdateUserProfileInputSchema,
  UserResponseSchema,
  UserListResponseSchema,
} from '@packages/schemas/dtos'

/**
 * User Resource Definition
 * Manages user profiles (creation handled by /auth/signup)
 */
export const userResource = defineResource({
  name: 'user',
  model: 'user',
  schemas: {
    update: UpdateUserProfileInputSchema,
    response: UserResponseSchema,
    list: UserListResponseSchema,
  },
  access: {
    read: ['USER', 'VENDOR', 'ADMIN'], // Users can read their own profile
    update: ['USER', 'VENDOR', 'ADMIN'], // Users can update their own profile
    list: ['ADMIN'], // Only admins can list all users
  },
  ownership: {
    enabled: true,
    relationPath: 'id', // Users can only manage their own profile
  },
  operations: ['read', 'update', 'list'], // No create (use /auth/signup) or delete (separate endpoint)
  customHooks: {
    beforeUpdate: async (_id, data) => {
      const input = data as {
        isCompany?: boolean
        companyName?: string | null
      }

      // Validate: if isCompany is true, companyName must be provided
      if (input.isCompany === true && !input.companyName) {
        throw new Error('companyName is required when isCompany is true')
      }

      // Clear companyName if switching to non-company
      if (input.isCompany === false) {
        return {
          ...input,
          companyName: null,
        }
      }

      return data
    },

    afterRead: async (result: unknown) => {
      // Filter out sensitive fields (just in case)
      const user = result as {
        passwordHash?: string
        [key: string]: unknown
      }
      
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash, ...safeUser } = user
      return safeUser
    },
  },
})

