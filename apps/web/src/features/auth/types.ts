/**
 * Shared auth types.
 *
 * Kept in a standalone module to avoid circular imports between
 * AuthContext and the `useAuth` hook.
 */

export interface User {
  id: string
  email: string
  role: 'customer' | 'vendor' | 'admin' | 'affiliate'
  name?: string
  phone?: string
}

export interface LoginCredentials {
  email: string
  password: string
}
