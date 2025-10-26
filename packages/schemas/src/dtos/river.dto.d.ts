import { z } from 'zod';
export declare const MediaItemSchema: z.ZodObject<{
    type: z.ZodEnum<["youtube", "image", "video", "link"]>;
    url: z.ZodString;
    thumbnail: z.ZodOptional<z.ZodString>;
    title: z.ZodOptional<z.ZodString>;
    provider: z.ZodOptional<z.ZodString>;
    width: z.ZodOptional<z.ZodNumber>;
    height: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    type: "link" | "youtube" | "image" | "video";
    url: string;
    title?: string | undefined;
    thumbnail?: string | undefined;
    provider?: string | undefined;
    width?: number | undefined;
    height?: number | undefined;
}, {
    type: "link" | "youtube" | "image" | "video";
    url: string;
    title?: string | undefined;
    thumbnail?: string | undefined;
    provider?: string | undefined;
    width?: number | undefined;
    height?: number | undefined;
}>;
export declare const CreatePostInputSchema: z.ZodObject<{
    [x: string]: z.ZodTypeAny;
} & {
    storeId: z.ZodString;
}, z.UnknownKeysParam, z.ZodTypeAny, {
    [x: string]: any;
    storeId?: unknown;
}, {
    [x: string]: any;
    storeId?: unknown;
}>;
export declare const PostResponseSchema: z.ZodObject<{
    [x: string]: z.ZodTypeAny;
} & {
    storeName: z.ZodString;
    storeImage: z.ZodOptional<z.ZodString>;
    isLiked: z.ZodDefault<z.ZodBoolean>;
    media: z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<["youtube", "image", "video", "link"]>;
        url: z.ZodString;
        thumbnail: z.ZodOptional<z.ZodString>;
        title: z.ZodOptional<z.ZodString>;
        provider: z.ZodOptional<z.ZodString>;
        width: z.ZodOptional<z.ZodNumber>;
        height: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        type: "link" | "youtube" | "image" | "video";
        url: string;
        title?: string | undefined;
        thumbnail?: string | undefined;
        provider?: string | undefined;
        width?: number | undefined;
        height?: number | undefined;
    }, {
        type: "link" | "youtube" | "image" | "video";
        url: string;
        title?: string | undefined;
        thumbnail?: string | undefined;
        provider?: string | undefined;
        width?: number | undefined;
        height?: number | undefined;
    }>, "many">;
}, z.UnknownKeysParam, z.ZodTypeAny, {
    [x: string]: any;
    storeName?: unknown;
    storeImage?: unknown;
    isLiked?: unknown;
    media?: unknown;
}, {
    [x: string]: any;
    storeName?: unknown;
    storeImage?: unknown;
    isLiked?: unknown;
    media?: unknown;
}>;
export declare const PostListResponseSchema: z.ZodObject<Record<string, z.ZodTypeAny>, z.UnknownKeysParam, z.ZodTypeAny, {
    [x: string]: any;
}, {
    [x: string]: any;
}>;
export declare const PostQuerySchema: z.ZodTypeAny;
export declare const CreateCommentInputSchema: z.ZodObject<{
    [x: string]: z.ZodTypeAny;
} & {
    postId: z.ZodString;
}, z.UnknownKeysParam, z.ZodTypeAny, {
    [x: string]: any;
    postId?: unknown;
}, {
    [x: string]: any;
    postId?: unknown;
}>;
export declare const CommentResponseSchema: z.ZodObject<{
    [x: string]: z.ZodTypeAny;
} & {
    userName: z.ZodString;
    userImage: z.ZodOptional<z.ZodString>;
}, z.UnknownKeysParam, z.ZodTypeAny, {
    [x: string]: any;
    userName?: unknown;
    userImage?: unknown;
}, {
    [x: string]: any;
    userName?: unknown;
    userImage?: unknown;
}>;
export declare const CommentListResponseSchema: z.ZodObject<Record<string, z.ZodTypeAny>, z.UnknownKeysParam, z.ZodTypeAny, {
    [x: string]: any;
}, {
    [x: string]: any;
}>;
export declare const CommentQuerySchema: z.ZodTypeAny;
export declare const LikePostInputSchema: z.ZodObject<{
    postId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    postId: string;
}, {
    postId: string;
}>;
export declare const UnlikePostInputSchema: z.ZodObject<{
    postId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    postId: string;
}, {
    postId: string;
}>;
export type CreatePostInput = z.infer<typeof CreatePostInputSchema>;
export type PostResponse = z.infer<typeof PostResponseSchema>;
export type PostListResponse = z.infer<typeof PostListResponseSchema>;
export type PostQuery = z.infer<typeof PostQuerySchema>;
export type CreateCommentInput = z.infer<typeof CreateCommentInputSchema>;
export type CommentResponse = z.infer<typeof CommentResponseSchema>;
export type CommentListResponse = z.infer<typeof CommentListResponseSchema>;
export type CommentQuery = z.infer<typeof CommentQuerySchema>;
export type LikePostInput = z.infer<typeof LikePostInputSchema>;
export type UnlikePostInput = z.infer<typeof UnlikePostInputSchema>;
//# sourceMappingURL=river.dto.d.ts.map