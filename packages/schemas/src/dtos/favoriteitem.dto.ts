import { z } from 'zod'

// ========================================
// FavoriteItem DTOs (Auto-Generated from Prisma)
// ========================================

export const CreateFavoriteItemInputSchema = z.object({
  userId: z.string(),
  itemId: z.string()
})

export const UpdateFavoriteItemInputSchema = z.object({
  userId: z.string().optional(),
  itemId: z.string().optional()
}).refine(data => Object.keys(data).length > 0, 'At least one field must be provided')

export const FavoriteItemResponseSchema = z.object({
  userId: z.string(),
  itemId: z.string(),
  user: z.string(),
  item: z.string()
})

export const FavoriteItemListResponseSchema = z.object({
  data: z.array(FavoriteItemResponseSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
})

export const FavoriteItemQuerySchema = z.object({
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
export type CreateFavoriteItemInput = z.infer<typeof CreateFavoriteItemInputSchema>
export type UpdateFavoriteItemInput = z.infer<typeof UpdateFavoriteItemInputSchema>
export type FavoriteItemResponse = z.infer<typeof FavoriteItemResponseSchema>
export type FavoriteItemListResponse = z.infer<typeof FavoriteItemListResponseSchema>
export type FavoriteItemQuery = z.infer<typeof FavoriteItemQuerySchema>

