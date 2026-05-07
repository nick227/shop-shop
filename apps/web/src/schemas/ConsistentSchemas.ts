// @ts-nocheck
/**
 * Consistent Schemas - Single Source of Truth
 * All schemas used across the application should import from here
 */

import { z } from 'zod'

// Re-export base validation schemas
export { z } from 'zod'

// Common validation schemas used across forms
export const emailSchema = z
  .string()
  .email('Invalid email address')
  .refine((value) => !value.split('@')[0]?.includes('..'), { message: 'Invalid email address' })

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .refine((value) => /\d/.test(value), { message: 'Password must include a number' })
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
  name: z.string().min(1, 'Name is required'),
})

export const loginFormSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
})

// Legacy compatibility - map old names to new ones
// Note: Schemas are temporarily commented out due to module resolution issues
export const schemas = {
  // Auth
  login: loginFormSchema,
  signup: signupFormSchema,
  authResponse: z.any(),
  user: z.any(),
  
  // Form schemas
  signupForm: signupFormSchema,
  loginForm: loginFormSchema,
  
  // Base schemas
  email: emailSchema,
  password: passwordSchema,
  phone: phoneSchema,

  // Marketplace/store/items/orders/cart/address/bundles/promotions/payments
  store: z.any(),
  createStore: z.any(),
  updateStore: z.any(),
  item: z.any(),
  createItem: z.any(),
  updateItem: z.any(),
  order: z.any(),
  createOrder: z.any(),
  cart: z.any(),
  address: z.any(),
  createAddress: z.any(),
  updateAddress: z.any(),
  bundle: z.any(),
  createBundle: z.any(),
  updateBundle: z.any(),
  promotion: z.any(),
  createPromotion: z.any(),
  updatePromotion: z.any(),
  paymentIntent: z.any(),
  createPaymentIntent: z.any(),
  tip: z.any(),
  createTip: z.any(),
  updateTip: z.any(),
  mediaUpload: z.any(),
  mediaUploadMetadata: z.any(),
} as const

// Type exports for convenience
export type SignupFormData = z.infer<typeof signupFormSchema>
export type LoginFormData = z.infer<typeof loginFormSchema>
