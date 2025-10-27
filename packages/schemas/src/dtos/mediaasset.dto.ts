import { z } from 'zod'

// ========================================
// MediaAsset DTOs (Auto-Generated from Prisma)
// ========================================

export const CreateMediaAssetInputSchema = z.object({
  storeId: z.string().optional(),
  itemId: z.string().optional(),
  kind: z.string(),
  url: z.string(),
  altText: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  sortIndex: z.number().int().optional()
})

export const UpdateMediaAssetInputSchema = z.object({
  storeId: z.string().optional(),
  itemId: z.string().optional(),
  kind: z.string().optional(),
  url: z.string().optional(),
  altText: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  sortIndex: z.number().int().optional()
}).refine(data => Object.keys(data).length > 0, 'At least one field must be provided')

export const MediaAssetResponseSchema = z.object({
  storeId: z.string().nullable(),
  itemId: z.string().nullable(),
  store: z.string().nullable(),
  item: z.string().nullable(),
  kind: z.string(),
  url: z.string(),
  altText: z.string().nullable(),
  metadata: z.record(z.unknown()).nullable(),
  sortIndex: z.number().int().nullable()
})

export const MediaAssetListResponseSchema = z.object({
  data: z.array(MediaAssetResponseSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
})

export const MediaAssetQuerySchema = z.object({
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


// Additional schemas
export const UpdateMediaSortInputSchema = z.object({
  sortIndex: z.number().int().min(0),
}).refine(data => Object.keys(data).length > 0, 'At least one field must be provided')


// Type exports
export type CreateMediaAssetInput = z.infer<typeof CreateMediaAssetInputSchema>
export type UpdateMediaAssetInput = z.infer<typeof UpdateMediaAssetInputSchema>
export type MediaAssetResponse = z.infer<typeof MediaAssetResponseSchema>
export type MediaAssetListResponse = z.infer<typeof MediaAssetListResponseSchema>
export type MediaAssetQuery = z.infer<typeof MediaAssetQuerySchema>
export type UpdateMediaSortInput = z.infer<typeof UpdateMediaSortInputSchema>
