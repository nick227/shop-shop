import { z } from 'zod'

// ========================================
// Auth DTOs
// ========================================

export const SignupInputSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .transform(val => val.toLowerCase().trim()),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1).max(100).trim().optional(),
  phone: z.string().max(20).trim().optional(),
  affiliateReferralCode: z.string().trim().transform((v) => v.toUpperCase()).optional(),
})

export const LoginInputSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .transform(val => val.toLowerCase().trim()),
  password: z.string().min(1, 'Password is required'),
})

export const UserPublicResponseSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().nullable(),
  role: z.enum(['USER', 'VENDOR_PENDING', 'VENDOR', 'ADMIN', 'AFFILIATE', 'RIDER', 'STAFF']),
  phone: z.string().nullable(),
  isCompany: z.boolean(),
  companyName: z.string().nullable(),
  createdAt: z.string().datetime(),
})

export const AuthResponseSchema = z.object({
  user: UserPublicResponseSchema,
  token: z.string(),
})

// ========================================
// OpenAPI Path Registration
// (Imported and registered in index.ts)
// ========================================

// Schemas and type exports only
// Path registration happens in index.ts to avoid circular dependencies

// Type exports for convenience
export type SignupInput = z.infer<typeof SignupInputSchema>
export type LoginInput = z.infer<typeof LoginInputSchema>
export type UserPublicResponse = z.infer<typeof UserPublicResponseSchema>
export type AuthResponse = z.infer<typeof AuthResponseSchema>

