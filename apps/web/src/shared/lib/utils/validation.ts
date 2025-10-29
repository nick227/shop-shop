/**
 * Validation Utilities - Client-side validation helpers
 * DEPRECATED: Use ConsistentSchemas instead
 * @deprecated Use @schemas/ConsistentSchemas for new code
 */
import { z } from 'zod'

// Define schemas directly to avoid import chain issues
const emailSchema = z.string().email('Invalid email address')
const passwordSchema = z.string().min(8, 'Password must be at least 8 characters')
const phoneSchema = z
  .string()
  .regex(/^[\d\s()-]+$/, 'Invalid phone number')
  .transform((val) => val.replaceAll(/\D/g, ''))
  .refine((val) => val.length === 10 || val.length === 11, {
    message: 'Phone number must be 10 or 11 digits',
  })

// Re-export schemas for backward compatibility
export { emailSchema, passwordSchema, phoneSchema }

// Legacy function exports for backward compatibility
export const isValidEmail = (email: string): boolean => {
  const result = emailSchema.safeParse(email)
  return result.success
}

export const isValidPassword = (password: string): boolean => {
  const result = passwordSchema.safeParse(password)
  return result.success
}

export const isValidPhone = (phone: string): boolean => {
  const result = phoneSchema.safeParse(phone)
  return result.success
}

export const isRequired = (value: string | undefined): boolean => {
  return value !== undefined && value.trim().length > 0
}

export const minLength = (value: string, min: number): boolean => {
  return value.length >= min
}

export const maxLength = (value: string, max: number): boolean => {
  return value.length <= max
}

export const inRange = (value: number, min: number, max: number): boolean => {
  return value >= min && value <= max
}

