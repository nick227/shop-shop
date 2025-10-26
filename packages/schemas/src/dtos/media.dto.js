import { z } from 'zod';
// ========================================
// Media DTOs
// ========================================
// Upload Media Input
export const UploadMediaInputSchema = z.object({
    storeId: z.string().uuid().optional().describe('Store ID (for store media)'),
    itemId: z.string().uuid().optional().describe('Item ID (for item media)'),
    altText: z.string().max(200).optional().describe('Alternative text for accessibility'),
    sortIndex: z.number().int().min(0).default(0).describe('Display order'),
});
// Media Response
export const MediaResponseSchema = z.object({
    id: z.string().uuid(),
    kind: z.enum(['IMAGE', 'VIDEO']),
    url: z.string().url(),
    altText: z.string().nullable(),
    sortIndex: z.number(),
    size: z.number().describe('File size in bytes'),
    createdAt: z.string().datetime(),
});
// Media List Response
export const MediaListResponseSchema = z.object({
    data: z.array(MediaResponseSchema),
    total: z.number(),
});
// Update Media Sort
export const UpdateMediaSortInputSchema = z.object({
    sortIndex: z.number().int().min(0).describe('New display order'),
});
