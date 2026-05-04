import { z } from 'zod'
import { 
  defineFields,
  generateCreateInputSchema,
  generateResponseSchema,
  generateListResponseSchema,
  generateQuerySchema,
} from '../core/dto.generator.js'

// ========================================
// Media Schemas
// ========================================

export const MediaItemSchema = z.object({
  type: z.enum(['youtube', 'image', 'video', 'link']),
  url: z.string().url(),
  thumbnail: z.string().url().optional(),
  title: z.string().optional(),
  provider: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
})

// ========================================
// Post DTOs
// ========================================

const postFields = defineFields([
  { name: 'id', type: 'String', isOptional: false, hasDefault: true },
  { name: 'storeId', type: 'String', isOptional: false, hasDefault: false },
  { name: 'content', type: 'String', isOptional: true, hasDefault: false },
  { name: 'mediaUrls', type: 'Json', isOptional: false, hasDefault: false },
  { name: 'likesCount', type: 'Int', isOptional: false, hasDefault: true },
  { name: 'commentsCount', type: 'Int', isOptional: false, hasDefault: true },
  { name: 'sharesCount', type: 'Int', isOptional: false, hasDefault: true },
  { name: 'priority', type: 'Int', isOptional: false, hasDefault: true },
  { name: 'layout', type: 'String', isOptional: false, hasDefault: true },
  { name: 'source', type: 'String', isOptional: false, hasDefault: true },
  { name: 'automationKey', type: 'String', isOptional: true, hasDefault: false },
  { name: 'linkedItemId', type: 'String', isOptional: true, hasDefault: false },
  { name: 'createdAt', type: 'DateTime', isOptional: false, hasDefault: true },
  { name: 'updatedAt', type: 'DateTime', isOptional: false, hasDefault: true },
])

export const CreatePostInputSchema = generateCreateInputSchema({
  fields: postFields,
  exclude: ['storeId'], // Injected from context or required separately
  overrides: {
    content: z.string().max(5000).optional(),
    mediaUrls: z.array(MediaItemSchema).max(10), // Enhanced to structured media
  },
}).extend({
  storeId: z.string().uuid(),
  priority: z.number().int().min(0).max(1_000_000).optional(),
  layout: z.string().max(64).optional(),
  source: z.enum(['MANUAL', 'AUTO_STORE', 'AUTO_PRODUCT']).optional(),
  automationKey: z.string().max(128).optional(),
  linkedItemId: z.string().uuid().optional(),
  /** Omit or null for immediate visibility; future instant hides post from public feed until then. */
  publishAt: z.coerce.date().optional(),
})

export const PostResponseSchema = generateResponseSchema({
  fields: postFields,
}).extend({
  storeName: z.string(),
  storeImage: z.string().optional(),
  isLiked: z.boolean().default(false),
  media: z.array(MediaItemSchema), // Add structured media to response
})

export const PostListResponseSchema = generateListResponseSchema(PostResponseSchema)

export const PostQuerySchema = generateQuerySchema({
  additionalFilters: {
    storeId: z.string().uuid().optional(),
    sortBy: z.enum(['recent', 'popular', 'trending']).optional().default('recent'),
    hasMedia: z.string().transform((val) => val === 'true').optional(),
    pageSize: z.string().transform(Number).optional(),
  },
})

/** Cursor-based home River feed (`ORDER BY priority DESC, createdAt DESC, id DESC`) */
export const RiverFeedQuerySchema = z
  .object({
    cursor: z.string().optional(),
    limit: z.string().optional(),
    storeId: z.string().uuid().optional(),
    /** Pair with `lng`. Uses Store coordinates + Haversine miles filter on server. */
    lat: z.string().optional(),
    lng: z.string().optional(),
    /** Default 25 when `lat`+`lng` are set. */
    radiusMiles: z.string().optional(),
    /** When true, include posts with empty `mediaUrls` (default: false — noise control). */
    allowEmptyMedia: z.string().optional(),
  })
  .refine(
    (d) => {
      const hasLat = d.lat !== undefined && d.lat !== ''
      const hasLng = d.lng !== undefined && d.lng !== ''
      return hasLat === hasLng
    },
    { message: 'lat and lng must be provided together', path: ['lat'] },
  )
  .transform((data) => {
    const n = Number(data.limit ?? '20')
    const limit = Number.isFinite(n) ? n : 20
    const latNum = data.lat !== undefined && data.lat !== '' ? Number(data.lat) : undefined
    const lngNum = data.lng !== undefined && data.lng !== '' ? Number(data.lng) : undefined
    const hasGeo =
      latNum !== undefined &&
      lngNum !== undefined &&
      Number.isFinite(latNum) &&
      Number.isFinite(lngNum)
    const rm = Number(data.radiusMiles ?? '')
    const radiusMiles =
      hasGeo && Number.isFinite(rm) && rm > 0 ? rm : hasGeo ? 25 : undefined

    return {
      cursor: data.cursor,
      limit: Math.min(Math.max(limit, 1), 50),
      storeId: data.storeId,
      near:
        hasGeo && latNum !== undefined && lngNum !== undefined && radiusMiles !== undefined
          ? { lat: latNum, lng: lngNum, radiusMiles }
          : undefined,
      allowEmptyMedia: data.allowEmptyMedia === 'true' || data.allowEmptyMedia === '1',
    }
  })

export const UpdatePostPrioritySchema = z.object({
  priority: z.coerce.number().int().min(0).max(1_000_000),
})

const RiverFeedMediaSchema = z.object({
  type: z.enum(['image', 'video']),
  url: z.string(),
  thumbnailUrl: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
})

export const RiverFeedItemSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  priority: z.number().int(),
  layout: z.string(),
  actor: z.object({
    kind: z.enum(['store', 'system']),
    storeId: z.string().optional(),
    displayName: z.string(),
    avatarUrl: z.string().optional(),
  }),
  title: z.string().nullable(),
  body: z.string().nullable(),
  media: z.array(RiverFeedMediaSchema),
  source: z.enum(['manual', 'auto_store', 'auto_product']).optional(),
  links: z
    .object({
      storeId: z.string().optional(),
      itemId: z.string().optional(),
    })
    .optional(),
})

export const RiverFeedPageSchema = z.object({
  items: z.array(RiverFeedItemSchema),
  nextCursor: z.string().nullable(),
})

// ========================================
// Comment DTOs
// ========================================

const commentFields = defineFields([
  { name: 'id', type: 'String', isOptional: false, hasDefault: true },
  { name: 'postId', type: 'String', isOptional: false, hasDefault: false },
  { name: 'userId', type: 'String', isOptional: false, hasDefault: false },
  { name: 'content', type: 'String', isOptional: false, hasDefault: false },
  { name: 'createdAt', type: 'DateTime', isOptional: false, hasDefault: true },
  { name: 'updatedAt', type: 'DateTime', isOptional: false, hasDefault: true },
])

export const CreateCommentInputSchema = generateCreateInputSchema({
  fields: commentFields,
  exclude: ['userId'], // Injected from auth context
  overrides: {
    content: z.string().min(1).max(2000),
  },
}).extend({
  postId: z.string().uuid(),
})

export const CommentResponseSchema = generateResponseSchema({
  fields: commentFields,
}).extend({
  userName: z.string(),
  userImage: z.string().optional(),
})

export const CommentListResponseSchema = generateListResponseSchema(CommentResponseSchema)

export const CommentQuerySchema = generateQuerySchema({
  additionalFilters: {
    postId: z.string().uuid(),
  },
})

// ========================================
// Like DTOs
// ========================================

export const LikePostInputSchema = z.object({
  postId: z.string().uuid(),
})

export const UnlikePostInputSchema = z.object({
  postId: z.string().uuid(),
})

// Type exports
export type CreatePostInput = z.infer<typeof CreatePostInputSchema>
export type PostResponse = z.infer<typeof PostResponseSchema>
export type PostListResponse = z.infer<typeof PostListResponseSchema>
export type PostQuery = z.infer<typeof PostQuerySchema>

export type CreateCommentInput = z.infer<typeof CreateCommentInputSchema>
export type CommentResponse = z.infer<typeof CommentResponseSchema>
export type CommentListResponse = z.infer<typeof CommentListResponseSchema>
export type CommentQuery = z.infer<typeof CommentQuerySchema>

export type LikePostInput = z.infer<typeof LikePostInputSchema>
export type UnlikePostInput = z.infer<typeof UnlikePostInputSchema>

export type RiverFeedQuery = z.infer<typeof RiverFeedQuerySchema>
export type RiverFeedItem = z.infer<typeof RiverFeedItemSchema>
export type RiverFeedPage = z.infer<typeof RiverFeedPageSchema>
export type UpdatePostPriorityInput = z.infer<typeof UpdatePostPrioritySchema>

