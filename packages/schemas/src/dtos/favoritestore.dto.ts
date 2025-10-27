import { z } from 'zod'

// ========================================
// FavoriteStore DTOs (Auto-Generated from Prisma)
// ========================================

export const CreateFavoriteStoreInputSchema = z.object({
  userId: z.string(),
  storeId: z.string()
})

export const UpdateFavoriteStoreInputSchema = z.object({
  userId: z.string().optional(),
  storeId: z.string().optional()
}).refine(data => Object.keys(data).length > 0, 'At least one field must be provided')

export const FavoriteStoreResponseSchema = z.object({
  userId: z.string(),
  storeId: z.string(),
  user: z.string(),
  store: z.string()
})

export const FavoriteStoreListResponseSchema = z.object({
  data: z.array(FavoriteStoreResponseSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
})

export const FavoriteStoreQuerySchema = z.object({
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
export type CreateFavoriteStoreInput = z.infer<typeof CreateFavoriteStoreInputSchema>
export type UpdateFavoriteStoreInput = z.infer<typeof UpdateFavoriteStoreInputSchema>
export type FavoriteStoreResponse = z.infer<typeof FavoriteStoreResponseSchema>
export type FavoriteStoreListResponse = z.infer<typeof FavoriteStoreListResponseSchema>
export type FavoriteStoreQuery = z.infer<typeof FavoriteStoreQuerySchema>

