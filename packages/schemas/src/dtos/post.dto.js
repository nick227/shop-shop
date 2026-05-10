import { z } from 'zod';
// ========================================
// Post DTOs — update-only (create/list/query live in river.dto.ts)
// ========================================
export const UpdatePostInputSchema = z
    .object({
    storeId: z.string().optional(),
    content: z.string().optional(),
    mediaUrls: z.record(z.unknown()).optional(),
    likesCount: z.number().int().optional(),
    commentsCount: z.number().int().optional(),
    sharesCount: z.number().int().optional(),
})
    .refine((data) => Object.keys(data).length > 0, 'At least one field must be provided');
