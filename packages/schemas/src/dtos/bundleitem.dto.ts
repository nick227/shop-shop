import { z } from 'zod'

// ========================================
// BundleItem DTOs (Auto-Generated from Prisma)
// ========================================

export const CreateBundleItemInputSchema = z.object({
  bundleId: z.string(),
  itemId: z.string(),
  quantity: z.number().int().optional(),
  sortIndex: z.number().int().optional()
})

export const UpdateBundleItemInputSchema = z.object({
  bundleId: z.string().optional(),
  itemId: z.string().optional(),
  quantity: z.number().int().optional(),
  sortIndex: z.number().int().optional()
}).refine(data => Object.keys(data).length > 0, 'At least one field must be provided')

export const BundleItemResponseSchema = z.object({
  bundleId: z.string(),
  bundle: z.string(),
  itemId: z.string(),
  item: z.string(),
  quantity: z.number().int().nullable(),
  sortIndex: z.number().int().nullable()
})

export const BundleItemListResponseSchema = z.object({
  data: z.array(BundleItemResponseSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
})

export const BundleItemQuerySchema = z.object({
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
export type CreateBundleItemInput = z.infer<typeof CreateBundleItemInputSchema>
export type UpdateBundleItemInput = z.infer<typeof UpdateBundleItemInputSchema>
export type BundleItemResponse = z.infer<typeof BundleItemResponseSchema>
export type BundleItemListResponse = z.infer<typeof BundleItemListResponseSchema>
export type BundleItemQuery = z.infer<typeof BundleItemQuerySchema>

