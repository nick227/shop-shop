import { z } from 'zod';
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
});
export const LoginInputSchema = z.object({
    email: z.string()
        .email('Invalid email format')
        .transform(val => val.toLowerCase().trim()),
    password: z.string().min(1, 'Password is required'),
});
export const UserPublicResponseSchema = z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    name: z.string().nullable(),
    role: z.enum(['USER', 'VENDOR', 'ADMIN']),
    phone: z.string().nullable(),
    isCompany: z.boolean(),
    companyName: z.string().nullable(),
    createdAt: z.string().datetime(),
});
export const AuthResponseSchema = z.object({
    user: UserPublicResponseSchema,
    token: z.string(),
});
