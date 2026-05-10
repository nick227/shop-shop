import type { Post, PostLike, Comment } from '../generated/client/index.js';
import type { RiverFeedItem } from '@packages/schemas';
export interface MediaItem {
    type: 'youtube' | 'image' | 'video' | 'link';
    url: string;
    thumbnail?: string;
    title?: string;
    provider?: string;
    width?: number;
    height?: number;
}
export interface CreatePostInput {
    storeId: string;
    content?: string;
    mediaUrls: MediaItem[];
    priority?: number;
    layout?: string;
    source?: 'MANUAL' | 'AUTO_STORE' | 'AUTO_PRODUCT';
    automationKey?: string;
    linkedItemId?: string;
    /** If set, post stays hidden from public feed until this instant (UTC). Omitted = immediate. */
    publishAt?: Date;
}
export interface CreateCommentInput {
    postId: string;
    userId: string;
    content: string;
}
export interface PostWithDetails extends Post {
    store: {
        name: string;
        media: Array<{
            url: string;
        }>;
    };
    _count: {
        likes: number;
        comments: number;
    };
    likes: Array<{
        userId: string;
    }>;
}
/** Rejected automation insert (cooldown, duplicate welcome, missing media). */
export declare class RiverAutomationRejected extends Error {
    readonly code: 'DUPLICATE_AUTO_STORE' | 'AUTO_PRODUCT_COOLDOWN' | 'AUTO_MISSING_MEDIA';
    constructor(code: RiverAutomationRejected['code'], message: string);
}
export declare const createPost: (input: CreatePostInput) => Promise<Post>;
export declare const updatePostPriority: (postId: string, priority: number, scope?: Readonly<{
    storeId: string;
}>) => Promise<Post>;
export declare const getPostById: (id: string) => Promise<PostWithDetails | null>;
export declare const getPosts: (options: {
    storeId?: string;
    sortBy?: "recent" | "popular" | "trending";
    hasMedia?: boolean;
    page?: number;
    pageSize?: number;
    userId?: string;
}) => Promise<{
    posts: PostWithDetails[];
    total: number;
}>;
export declare const getRiverFeed: (options: {
    cursor?: string;
    limit: number;
    storeId?: string;
    near?: {
        lat: number;
        lng: number;
        radiusMiles: number;
    };
    /** When true (default), exclude rows with empty mediaUrls JSON array */
    requireMedia?: boolean;
}) => Promise<{
    items: RiverFeedItem[];
    nextCursor: string | null;
}>;
export declare const deletePost: (id: string) => Promise<Post>;
export declare const likePost: (postId: string, userId: string) => Promise<PostLike>;
export declare const unlikePost: (postId: string, userId: string) => Promise<void>;
export declare const getUserLike: (postId: string, userId: string) => Promise<PostLike | null>;
export declare const createComment: (input: CreateCommentInput) => Promise<Comment>;
export declare const getCommentsByPostId: (options: {
    postId: string;
    page?: number;
    pageSize?: number;
}) => Promise<{
    comments: Array<Comment & {
        user: {
            name: string | null;
        };
    }>;
    total: number;
}>;
export declare const deleteComment: (id: string) => Promise<Comment>;
//# sourceMappingURL=river.service.d.ts.map