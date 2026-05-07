import { z } from 'zod'

// ========================================
// Item DTOs (Auto-Generated from Prisma)
// ========================================

export const CreateItemInputSchema = z.object({
  storeId: z.string(),
  title: z.string(),
  description: z.string(),
  price: z.string(),
  isActive: z.boolean().optional(),
  isSoldOut: z.boolean().optional(),
  sortIndex: z.number().int().optional(),
  optionsJson: z.record(z.unknown()).optional(),
  stockQty: z.string(),
  allergensJson: z.record(z.unknown()).optional(),
  isVegan: z.boolean().optional(),
  isVegetarian: z.boolean().optional(),
  isGlutenFree: z.boolean().optional(),
  isDairyFree: z.boolean().optional(),
  spicyLevel: z.number().int().optional()
})

export const UpdateItemInputSchema = z.object({
  storeId: z.string().optional(),
  title: z.string(),
  description: z.string(),
  price: z.string(),
  isActive: z.boolean().optional(),
  isSoldOut: z.boolean().optional(),
  sortIndex: z.number().int().optional(),
  optionsJson: z.record(z.unknown()).optional(),
  stockQty: z.string(),
  allergensJson: z.record(z.unknown()).optional(),
  isVegan: z.boolean().optional(),
  isVegetarian: z.boolean().optional(),
  isGlutenFree: z.boolean().optional(),
  isDairyFree: z.boolean().optional(),
  spicyLevel: z.number().int().optional()
}).refine(data => Object.keys(data).length > 0, 'At least one field must be provided')

const ItemTagSchema = z.object({
  slug: z.string(),
  label: z.string(),
  category: z.string(),
})

export const ItemResponseSchema = z.object({
  storeId: z.string(),
  store: z.string(),
  title: z.string(),
  description: z.string(),
  price: z.string(),
  isActive: z.boolean().nullable(),
  isSoldOut: z.boolean().nullable(),
  sortIndex: z.number().int().nullable(),
  optionsJson: z.record(z.unknown()).nullable(),
  stockQty: z.string(),
  allergensJson: z.record(z.unknown()).nullable(),
  isVegan: z.boolean().nullable(),
  isVegetarian: z.boolean().nullable(),
  isGlutenFree: z.boolean().nullable(),
  isDairyFree: z.boolean().nullable(),
  spicyLevel: z.number().int().nullable(),
  media: z.string(),
  cartItems: z.string(),
  orderItems: z.string(),
  bundleItems: z.string(),
  FavoriteItem: z.string(),
  tags: z.array(ItemTagSchema).optional(),
  mediaAssets: z.array(z.object({ url: z.string(), kind: z.string(), sortIndex: z.number().nullable().optional() })).optional(),
})

export const ItemListResponseSchema = z.object({
  data: z.array(ItemResponseSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
})

export const ItemQuerySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('20'),
}).passthrough().transform(data => ({
  page: data.page,
  limit: data.limit,
  filters: Object.keys(data)
    .filter(k => k !== 'page' && k !== 'limit' && (data as any)[k] !== undefined)
    .reduce((acc, k) => ({ ...acc, [k]: (data as any)[k] }), {}),
  orderBy: { createdAt: 'desc' },
}))



// Type exports
export type CreateItemInput = z.infer<typeof CreateItemInputSchema>
export type UpdateItemInput = z.infer<typeof UpdateItemInputSchema>
export type ItemResponse = z.infer<typeof ItemResponseSchema>
export type ItemListResponse = z.infer<typeof ItemListResponseSchema>
export type ItemQuery = z.infer<typeof ItemQuerySchema>
