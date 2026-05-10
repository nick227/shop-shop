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
    provider?: string | undefined;
    thumbnail?: string | undefined;
    width?: number | undefined;
    height?: number | undefined;
}, {
    type: "link" | "youtube" | "image" | "video";
    url: string;
    title?: string | undefined;
    provider?: string | undefined;
    thumbnail?: string | undefined;
    width?: number | undefined;
    height?: number | undefined;
}>;
export declare const CreatePostInputSchema: z.ZodObject<z.objectUtil.extendShape<Record<string, z.ZodTypeAny>, {
    storeId: z.ZodString;
    priority: z.ZodOptional<z.ZodNumber>;
    layout: z.ZodOptional<z.ZodString>;
    source: z.ZodOptional<z.ZodEnum<["MANUAL", "AUTO_STORE", "AUTO_PRODUCT"]>>;
    automationKey: z.ZodOptional<z.ZodString>;
    linkedItemId: z.ZodOptional<z.ZodString>;
    /** Omit or null for immediate visibility; future instant hides post from public feed until then. */
    publishAt: z.ZodOptional<z.ZodDate>;
}>, z.UnknownKeysParam, z.ZodTypeAny, {
    [x: string]: any;
    storeId?: unknown;
    priority?: unknown;
    layout?: unknown;
    source?: unknown;
    automationKey?: unknown;
    linkedItemId?: unknown;
    publishAt?: unknown;
}, {
    [x: string]: any;
    storeId?: unknown;
    priority?: unknown;
    layout?: unknown;
    source?: unknown;
    automationKey?: unknown;
    linkedItemId?: unknown;
    publishAt?: unknown;
}>;
export declare const PostResponseSchema: z.ZodObject<z.objectUtil.extendShape<Record<string, z.ZodTypeAny>, {
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
        provider?: string | undefined;
        thumbnail?: string | undefined;
        width?: number | undefined;
        height?: number | undefined;
    }, {
        type: "link" | "youtube" | "image" | "video";
        url: string;
        title?: string | undefined;
        provider?: string | undefined;
        thumbnail?: string | undefined;
        width?: number | undefined;
        height?: number | undefined;
    }>, "many">;
}>, z.UnknownKeysParam, z.ZodTypeAny, {
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
/** Cursor-based home River feed (`ORDER BY priority DESC, createdAt DESC, id DESC`) */
export declare const RiverFeedQuerySchema: z.ZodEffects<z.ZodEffects<z.ZodObject<{
    cursor: z.ZodOptional<z.ZodString>;
    limit: z.ZodOptional<z.ZodString>;
    storeId: z.ZodOptional<z.ZodString>;
    /** Pair with `lng`. Uses Store coordinates + Haversine miles filter on server. */
    lat: z.ZodOptional<z.ZodString>;
    lng: z.ZodOptional<z.ZodString>;
    /** Default 25 when `lat`+`lng` are set. */
    radiusMiles: z.ZodOptional<z.ZodString>;
    /** When true, include posts with empty `mediaUrls` (default: false — noise control). */
    allowEmptyMedia: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    cursor?: string | undefined;
    storeId?: string | undefined;
    limit?: string | undefined;
    lat?: string | undefined;
    lng?: string | undefined;
    radiusMiles?: string | undefined;
    allowEmptyMedia?: string | undefined;
}, {
    cursor?: string | undefined;
    storeId?: string | undefined;
    limit?: string | undefined;
    lat?: string | undefined;
    lng?: string | undefined;
    radiusMiles?: string | undefined;
    allowEmptyMedia?: string | undefined;
}>, {
    cursor?: string | undefined;
    storeId?: string | undefined;
    limit?: string | undefined;
    lat?: string | undefined;
    lng?: string | undefined;
    radiusMiles?: string | undefined;
    allowEmptyMedia?: string | undefined;
}, {
    cursor?: string | undefined;
    storeId?: string | undefined;
    limit?: string | undefined;
    lat?: string | undefined;
    lng?: string | undefined;
    radiusMiles?: string | undefined;
    allowEmptyMedia?: string | undefined;
}>, {
    cursor: string | undefined;
    limit: number;
    storeId: string | undefined;
    near: {
        lat: number;
        lng: number;
        radiusMiles: number;
    } | undefined;
    allowEmptyMedia: boolean;
}, {
    cursor?: string | undefined;
    storeId?: string | undefined;
    limit?: string | undefined;
    lat?: string | undefined;
    lng?: string | undefined;
    radiusMiles?: string | undefined;
    allowEmptyMedia?: string | undefined;
}>;
export declare const UpdatePostPrioritySchema: z.ZodObject<{
    priority: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    priority: number;
}, {
    priority: number;
}>;
export declare const RiverFeedItemSchema: z.ZodObject<{
    id: z.ZodString;
    createdAt: z.ZodString;
    priority: z.ZodNumber;
    layout: z.ZodString;
    actor: z.ZodObject<{
        kind: z.ZodEnum<["store", "system"]>;
        storeId: z.ZodOptional<z.ZodString>;
        displayName: z.ZodString;
        avatarUrl: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        kind: "store" | "system";
        displayName: string;
        storeId?: string | undefined;
        avatarUrl?: string | undefined;
    }, {
        kind: "store" | "system";
        displayName: string;
        storeId?: string | undefined;
        avatarUrl?: string | undefined;
    }>;
    title: z.ZodNullable<z.ZodString>;
    body: z.ZodNullable<z.ZodString>;
    media: z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<["image", "video"]>;
        url: z.ZodString;
        thumbnailUrl: z.ZodOptional<z.ZodString>;
        width: z.ZodOptional<z.ZodNumber>;
        height: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        type: "image" | "video";
        url: string;
        width?: number | undefined;
        height?: number | undefined;
        thumbnailUrl?: string | undefined;
    }, {
        type: "image" | "video";
        url: string;
        width?: number | undefined;
        height?: number | undefined;
        thumbnailUrl?: string | undefined;
    }>, "many">;
    source: z.ZodOptional<z.ZodEnum<["manual", "auto_store", "auto_product"]>>;
    links: z.ZodOptional<z.ZodObject<{
        storeId: z.ZodOptional<z.ZodString>;
        itemId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        storeId?: string | undefined;
        itemId?: string | undefined;
    }, {
        storeId?: string | undefined;
        itemId?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    title: string | null;
    id: string;
    createdAt: string;
    media: {
        type: "image" | "video";
        url: string;
        width?: number | undefined;
        height?: number | undefined;
        thumbnailUrl?: string | undefined;
    }[];
    priority: number;
    layout: string;
    actor: {
        kind: "store" | "system";
        displayName: string;
        storeId?: string | undefined;
        avatarUrl?: string | undefined;
    };
    body: string | null;
    source?: "manual" | "auto_store" | "auto_product" | undefined;
    links?: {
        storeId?: string | undefined;
        itemId?: string | undefined;
    } | undefined;
}, {
    title: string | null;
    id: string;
    createdAt: string;
    media: {
        type: "image" | "video";
        url: string;
        width?: number | undefined;
        height?: number | undefined;
        thumbnailUrl?: string | undefined;
    }[];
    priority: number;
    layout: string;
    actor: {
        kind: "store" | "system";
        displayName: string;
        storeId?: string | undefined;
        avatarUrl?: string | undefined;
    };
    body: string | null;
    source?: "manual" | "auto_store" | "auto_product" | undefined;
    links?: {
        storeId?: string | undefined;
        itemId?: string | undefined;
    } | undefined;
}>;
export declare const RiverFeedPageSchema: z.ZodObject<{
    items: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        createdAt: z.ZodString;
        priority: z.ZodNumber;
        layout: z.ZodString;
        actor: z.ZodObject<{
            kind: z.ZodEnum<["store", "system"]>;
            storeId: z.ZodOptional<z.ZodString>;
            displayName: z.ZodString;
            avatarUrl: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            kind: "store" | "system";
            displayName: string;
            storeId?: string | undefined;
            avatarUrl?: string | undefined;
        }, {
            kind: "store" | "system";
            displayName: string;
            storeId?: string | undefined;
            avatarUrl?: string | undefined;
        }>;
        title: z.ZodNullable<z.ZodString>;
        body: z.ZodNullable<z.ZodString>;
        media: z.ZodArray<z.ZodObject<{
            type: z.ZodEnum<["image", "video"]>;
            url: z.ZodString;
            thumbnailUrl: z.ZodOptional<z.ZodString>;
            width: z.ZodOptional<z.ZodNumber>;
            height: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            type: "image" | "video";
            url: string;
            width?: number | undefined;
            height?: number | undefined;
            thumbnailUrl?: string | undefined;
        }, {
            type: "image" | "video";
            url: string;
            width?: number | undefined;
            height?: number | undefined;
            thumbnailUrl?: string | undefined;
        }>, "many">;
        source: z.ZodOptional<z.ZodEnum<["manual", "auto_store", "auto_product"]>>;
        links: z.ZodOptional<z.ZodObject<{
            storeId: z.ZodOptional<z.ZodString>;
            itemId: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            storeId?: string | undefined;
            itemId?: string | undefined;
        }, {
            storeId?: string | undefined;
            itemId?: string | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        title: string | null;
        id: string;
        createdAt: string;
        media: {
            type: "image" | "video";
            url: string;
            width?: number | undefined;
            height?: number | undefined;
            thumbnailUrl?: string | undefined;
        }[];
        priority: number;
        layout: string;
        actor: {
            kind: "store" | "system";
            displayName: string;
            storeId?: string | undefined;
            avatarUrl?: string | undefined;
        };
        body: string | null;
        source?: "manual" | "auto_store" | "auto_product" | undefined;
        links?: {
            storeId?: string | undefined;
            itemId?: string | undefined;
        } | undefined;
    }, {
        title: string | null;
        id: string;
        createdAt: string;
        media: {
            type: "image" | "video";
            url: string;
            width?: number | undefined;
            height?: number | undefined;
            thumbnailUrl?: string | undefined;
        }[];
        priority: number;
        layout: string;
        actor: {
            kind: "store" | "system";
            displayName: string;
            storeId?: string | undefined;
            avatarUrl?: string | undefined;
        };
        body: string | null;
        source?: "manual" | "auto_store" | "auto_product" | undefined;
        links?: {
            storeId?: string | undefined;
            itemId?: string | undefined;
        } | undefined;
    }>, "many">;
    nextCursor: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    items: {
        title: string | null;
        id: string;
        createdAt: string;
        media: {
            type: "image" | "video";
            url: string;
            width?: number | undefined;
            height?: number | undefined;
            thumbnailUrl?: string | undefined;
        }[];
        priority: number;
        layout: string;
        actor: {
            kind: "store" | "system";
            displayName: string;
            storeId?: string | undefined;
            avatarUrl?: string | undefined;
        };
        body: string | null;
        source?: "manual" | "auto_store" | "auto_product" | undefined;
        links?: {
            storeId?: string | undefined;
            itemId?: string | undefined;
        } | undefined;
    }[];
    nextCursor: string | null;
}, {
    items: {
        title: string | null;
        id: string;
        createdAt: string;
        media: {
            type: "image" | "video";
            url: string;
            width?: number | undefined;
            height?: number | undefined;
            thumbnailUrl?: string | undefined;
        }[];
        priority: number;
        layout: string;
        actor: {
            kind: "store" | "system";
            displayName: string;
            storeId?: string | undefined;
            avatarUrl?: string | undefined;
        };
        body: string | null;
        source?: "manual" | "auto_store" | "auto_product" | undefined;
        links?: {
            storeId?: string | undefined;
            itemId?: string | undefined;
        } | undefined;
    }[];
    nextCursor: string | null;
}>;
export declare const CreateCommentInputSchema: z.ZodObject<z.objectUtil.extendShape<Record<string, z.ZodTypeAny>, {
    postId: z.ZodString;
}>, z.UnknownKeysParam, z.ZodTypeAny, {
    [x: string]: any;
    postId?: unknown;
}, {
    [x: string]: any;
    postId?: unknown;
}>;
export declare const CommentResponseSchema: z.ZodObject<z.objectUtil.extendShape<Record<string, z.ZodTypeAny>, {
    userName: z.ZodString;
    userImage: z.ZodOptional<z.ZodString>;
}>, z.UnknownKeysParam, z.ZodTypeAny, {
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
export type RiverFeedQuery = z.infer<typeof RiverFeedQuerySchema>;
export type RiverFeedItem = z.infer<typeof RiverFeedItemSchema>;
export type RiverFeedPage = z.infer<typeof RiverFeedPageSchema>;
export type UpdatePostPriorityInput = z.infer<typeof UpdatePostPrioritySchema>;
//# sourceMappingURL=river.dto.d.ts.map