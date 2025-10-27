import { z } from 'zod'

// ========================================
// Comment DTOs (Auto-Generated from Prisma)
// ========================================

export const CreateCommentInputSchema = z.object({
  postId: z.string(),
  userId: z.string(),
  content: z.string()
})

export const UpdateCommentInputSchema = z.object({
  postId: z.string().optional(),
  userId: z.string().optional(),
  content: z.string().optional()
}).refine(data => Object.keys(data).length > 0, 'At least one field must be provided')

export const CommentResponseSchema = z.object({
  postId: z.string(),
  userId: z.string(),
  post: z.string(),
  user: z.string(),
  content: z.string()
})

export const CommentListResponseSchema = z.object({
  data: z.array(CommentResponseSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
})

export const CommentQuerySchema = z.object({
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
export type CreateCommentInput = z.infer<typeof CreateCommentInputSchema>
export type UpdateCommentInput = z.infer<typeof UpdateCommentInputSchema>
export type CommentResponse = z.infer<typeof CommentResponseSchema>
export type CommentListResponse = z.infer<typeof CommentListResponseSchema>
export type CommentQuery = z.infer<typeof CommentQuerySchema>

