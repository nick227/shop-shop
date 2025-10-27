import { z } from 'zod'

// ========================================
// PostLike DTOs (Auto-Generated from Prisma)
// ========================================

export const CreatePostLikeInputSchema = z.object({
  postId: z.string(),
  userId: z.string()
})

export const UpdatePostLikeInputSchema = z.object({
  postId: z.string().optional(),
  userId: z.string().optional()
}).refine(data => Object.keys(data).length > 0, 'At least one field must be provided')

export const PostLikeResponseSchema = z.object({
  postId: z.string(),
  userId: z.string(),
  post: z.string(),
  user: z.string()
})

export const PostLikeListResponseSchema = z.object({
  data: z.array(PostLikeResponseSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
})

export const PostLikeQuerySchema = z.object({
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
export type CreatePostLikeInput = z.infer<typeof CreatePostLikeInputSchema>
export type UpdatePostLikeInput = z.infer<typeof UpdatePostLikeInputSchema>
export type PostLikeResponse = z.infer<typeof PostLikeResponseSchema>
export type PostLikeListResponse = z.infer<typeof PostLikeListResponseSchema>
export type PostLikeQuery = z.infer<typeof PostLikeQuerySchema>

