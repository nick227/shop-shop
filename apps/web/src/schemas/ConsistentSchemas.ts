/**
 * Consistent Schemas - Single Source of Truth
 * All schemas used across the application should import from here
 */

import { z } from 'zod'

// Re-export all schemas from the unified system
export * from '../api/schemas/UnifiedSchemas'

// Re-export base validation schemas
export { z } from 'zod'

// Common validation schemas used across forms
export const emailSchema = z.string().email('Invalid email address')
export const passwordSchema = z.string().min(8, 'Password must be at least 8 characters')
export const phoneSchema = z
  .string()
  .regex(/^[\d\s()-]+$/, 'Invalid phone number')
  .transform((val) => val.replaceAll(/\D/g, ''))
  .refine((val) => val.length === 10 || val.length === 11, {
    message: 'Phone number must be 10 or 11 digits',
  })

// Form-specific schemas that extend the base schemas
export const signupFormSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().optional(),
})

export const loginFormSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
})

// Legacy compatibility - map old names to new ones
// Note: Schemas are temporarily commented out due to module resolution issues
export const schemas = {
  // Auth - temporarily using placeholder schemas
  login: {} as any,
  signup: {} as any,
  authResponse: {} as any,
  user: {} as any,
  
  // Form schemas
  signupForm: signupFormSchema,
  loginForm: loginFormSchema,
  
  // Base schemas
  email: emailSchema,
  password: passwordSchema,
  phone: phoneSchema,
} as const

// Type exports for convenience
export type SignupFormData = z.infer<typeof signupFormSchema>
export type LoginFormData = z.infer<typeof loginFormSchema>
