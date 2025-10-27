import { z } from 'zod'

// ========================================
// Post DTOs (Auto-Generated from Prisma)
// ========================================

export const CreatePostInputSchema = z.object({
  storeId: z.string(),
  content: z.string().optional(),
  mediaUrls: z.record(z.unknown()),
  likesCount: z.number().int().optional(),
  commentsCount: z.number().int().optional(),
  sharesCount: z.number().int().optional()
})

export const UpdatePostInputSchema = z.object({
  storeId: z.string().optional(),
  content: z.string().optional(),
  mediaUrls: z.record(z.unknown()).optional(),
  likesCount: z.number().int().optional(),
  commentsCount: z.number().int().optional(),
  sharesCount: z.number().int().optional()
}).refine(data => Object.keys(data).length > 0, 'At least one field must be provided')

export const PostResponseSchema = z.object({
  storeId: z.string(),
  store: z.string(),
  content: z.string().nullable(),
  mediaUrls: z.record(z.unknown()),
  likesCount: z.number().int().nullable(),
  commentsCount: z.number().int().nullable(),
  sharesCount: z.number().int().nullable(),
  likes: z.string(),
  comments: z.string()
})

export const PostListResponseSchema = z.object({
  data: z.array(PostResponseSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
})

export const PostQuerySchema = z.object({
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
export type CreatePostInput = z.infer<typeof CreatePostInputSchema>
export type UpdatePostInput = z.infer<typeof UpdatePostInputSchema>
export type PostResponse = z.infer<typeof PostResponseSchema>
export type PostListResponse = z.infer<typeof PostListResponseSchema>
export type PostQuery = z.infer<typeof PostQuerySchema>

