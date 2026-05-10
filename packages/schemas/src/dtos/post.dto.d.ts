import { z } from 'zod';
export declare const UpdatePostInputSchema: z.ZodEffects<z.ZodObject<{
    storeId: z.ZodOptional<z.ZodString>;
    content: z.ZodOptional<z.ZodString>;
    mediaUrls: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    likesCount: z.ZodOptional<z.ZodNumber>;
    commentsCount: z.ZodOptional<z.ZodNumber>;
    sharesCount: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    storeId?: string | undefined;
    content?: string | undefined;
    mediaUrls?: Record<string, unknown> | undefined;
    likesCount?: number | undefined;
    commentsCount?: number | undefined;
    sharesCount?: number | undefined;
}, {
    storeId?: string | undefined;
    content?: string | undefined;
    mediaUrls?: Record<string, unknown> | undefined;
    likesCount?: number | undefined;
    commentsCount?: number | undefined;
    sharesCount?: number | undefined;
}>, {
    storeId?: string | undefined;
    content?: string | undefined;
    mediaUrls?: Record<string, unknown> | undefined;
    likesCount?: number | undefined;
    commentsCount?: number | undefined;
    sharesCount?: number | undefined;
}, {
    storeId?: string | undefined;
    content?: string | undefined;
    mediaUrls?: Record<string, unknown> | undefined;
    likesCount?: number | undefined;
    commentsCount?: number | undefined;
    sharesCount?: number | undefined;
}>;
export type UpdatePostInput = z.infer<typeof UpdatePostInputSchema>;
//# sourceMappingURL=post.dto.d.ts.map