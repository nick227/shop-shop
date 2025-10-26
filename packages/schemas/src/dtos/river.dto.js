import { z } from 'zod';
import { defineFields, generateCreateInputSchema, generateResponseSchema, generateListResponseSchema, generateQuerySchema, } from '../core/dto.generator.js';
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
});
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
    { name: 'createdAt', type: 'DateTime', isOptional: false, hasDefault: true },
    { name: 'updatedAt', type: 'DateTime', isOptional: false, hasDefault: true },
]);
export const CreatePostInputSchema = generateCreateInputSchema({
    fields: postFields,
    exclude: ['storeId'], // Injected from context or required separately
    overrides: {
        content: z.string().max(5000).optional(),
        mediaUrls: z.array(MediaItemSchema).max(10), // Enhanced to structured media
    },
}).extend({
    storeId: z.string().uuid(),
});
export const PostResponseSchema = generateResponseSchema({
    fields: postFields,
}).extend({
    storeName: z.string(),
    storeImage: z.string().optional(),
    isLiked: z.boolean().default(false),
    media: z.array(MediaItemSchema), // Add structured media to response
});
export const PostListResponseSchema = generateListResponseSchema(PostResponseSchema);
export const PostQuerySchema = generateQuerySchema({
    additionalFilters: {
        storeId: z.string().uuid().optional(),
        sortBy: z.enum(['recent', 'popular', 'trending']).optional().default('recent'),
        hasMedia: z.string().transform(val => val === 'true').optional(),
    },
});
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
]);
export const CreateCommentInputSchema = generateCreateInputSchema({
    fields: commentFields,
    exclude: ['userId'], // Injected from auth context
    overrides: {
        content: z.string().min(1).max(2000),
    },
}).extend({
    postId: z.string().uuid(),
});
export const CommentResponseSchema = generateResponseSchema({
    fields: commentFields,
}).extend({
    userName: z.string(),
    userImage: z.string().optional(),
});
export const CommentListResponseSchema = generateListResponseSchema(CommentResponseSchema);
export const CommentQuerySchema = generateQuerySchema({
    additionalFilters: {
        postId: z.string().uuid(),
    },
});
// ========================================
// Like DTOs
// ========================================
export const LikePostInputSchema = z.object({
    postId: z.string().uuid(),
});
export const UnlikePostInputSchema = z.object({
    postId: z.string().uuid(),
});
