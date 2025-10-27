import { z } from 'zod'

// ========================================
// Bundle DTOs (Auto-Generated from Prisma)
// ========================================

export const CreateBundleInputSchema = z.object({
  storeId: z.string(),
  name: z.string(),
  description: z.string(),
  imageUrl: z.string(),
  isActive: z.boolean().optional(),
  sortIndex: z.number().int().optional(),
  pricing: z.string().optional()
})

export const UpdateBundleInputSchema = z.object({
  storeId: z.string().optional(),
  name: z.string(),
  description: z.string(),
  imageUrl: z.string(),
  isActive: z.boolean().optional(),
  sortIndex: z.number().int().optional(),
  pricing: z.string().optional()
}).refine(data => Object.keys(data).length > 0, 'At least one field must be provided')

export const BundleResponseSchema = z.object({
  storeId: z.string(),
  store: z.string(),
  name: z.string(),
  description: z.string(),
  imageUrl: z.string(),
  isActive: z.boolean().nullable(),
  sortIndex: z.number().int().nullable(),
  items: z.string(),
  pricing: z.string().nullable(),
  orderItems: z.string()
})

export const BundleListResponseSchema = z.object({
  data: z.array(BundleResponseSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
})

export const BundleQuerySchema = z.object({
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
export type CreateBundleInput = z.infer<typeof CreateBundleInputSchema>
export type UpdateBundleInput = z.infer<typeof UpdateBundleInputSchema>
export type BundleResponse = z.infer<typeof BundleResponseSchema>
export type BundleListResponse = z.infer<typeof BundleListResponseSchema>
export type BundleQuery = z.infer<typeof BundleQuerySchema>

