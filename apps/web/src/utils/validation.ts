/**
 * Validation Utilities - Client-side validation helpers
 * DEPRECATED: Use unified validation service instead
 * @deprecated Use @utils/validation/unified for new code
 */
import { z } from 'zod'

// Re-export from unified validation service for backward compatibility
// export {
//   formValidator,
//   type ValidationResult
// } from './validation/unified' // Removed due to complex type issues

// Legacy schema exports for backward compatibility
export const emailSchema = z.string().email('Invalid email address')
export const passwordSchema = z.string().min(8, 'Password must be at least 8 characters')
export const phoneSchema = z
  .string()
  .regex(/^[\d\s()\-]+$/, 'Invalid phone number')
  .transform((val) => val.replaceAll(/\D/g, ''))
  .refine((val) => val.length === 10 || val.length === 11, {
    message: 'Phone number must be 10 or 11 digits',
  })

// Legacy function exports for backward compatibility
export const isValidEmail = (email: string): boolean => {
  const result = require('./validation/unified').formValidator.validateEmail(email)
  return result.valid
}

export const isValidPassword = (password: string): boolean => {
  const result = require('./validation/unified').formValidator.validatePassword(password)
  return result.valid
}

export const isValidPhone = (phone: string): boolean => {
  const result = require('./validation/unified').formValidator.validatePhone(phone)
  return result.valid
}

export const isRequired = (value: string | null | undefined): boolean => {
  return value !== null && value !== undefined && value.trim().length > 0
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

