import { z } from 'zod'

// ========================================
// User DTOs (Auto-Generated from Prisma)
// ========================================

export const CreateUserInputSchema = z.object({
  role: z.string().optional(),
  email: z.string(),
  name: z.string(),
  phone: z.string(),
  isCompany: z.boolean().optional(),
  companyName: z.string().optional(),
  affiliate: z.string().optional(),
  vendorVerification: z.string().optional()
})

export const UpdateUserInputSchema = z.object({
  role: z.string().optional(),
  email: z.string(),
  name: z.string(),
  phone: z.string(),
  isCompany: z.boolean().optional(),
  companyName: z.string().optional(),
  affiliate: z.string().optional(),
  vendorVerification: z.string().optional()
}).refine(data => Object.keys(data).length > 0, 'At least one field must be provided')

export const UserResponseSchema = z.object({
  role: z.string().nullable(),
  email: z.string(),
  name: z.string(),
  phone: z.string(),
  isCompany: z.boolean().nullable(),
  companyName: z.string().nullable(),
  addresses: z.string(),
  carts: z.string(),
  orders: z.string(),
  storesOwned: z.string(),
  paymentMethods: z.string(),
  promotionsCreated: z.string(),
  postLikes: z.string(),
  comments: z.string(),
  affiliate: z.string().nullable(),
  vendorVerification: z.string().nullable(),
  teamMemberships: z.string(),
  invitationsSent: z.string(),
  invitationsReceived: z.string(),
  FavoriteStore: z.string(),
  FavoriteItem: z.string()
})

export const UserListResponseSchema = z.object({
  data: z.array(UserResponseSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
})

export const UserQuerySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('20'),
}).transform(data => ({
  page: data.page,
  limit: data.limit,
  filters: Object.keys(data)
    .filter(k => k !== 'page' && k !== 'limit' && (data as any)[k] !== undefined)
    .reduce((acc, k) => ({ ...acc, [k]: (data as any)[k] }), {}),
  orderBy: { createdAt: 'desc' },
}))



// Type exports
export type CreateUserInput = z.infer<typeof CreateUserInputSchema>
export type UpdateUserInput = z.infer<typeof UpdateUserInputSchema>
export type UserResponse = z.infer<typeof UserResponseSchema>
export type UserListResponse = z.infer<typeof UserListResponseSchema>
export type UserQuery = z.infer<typeof UserQuerySchema>

