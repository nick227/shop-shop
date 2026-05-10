import { z } from 'zod';
export declare const CreateMediaAssetInputSchema: z.ZodObject<{
    storeId: z.ZodOptional<z.ZodString>;
    itemId: z.ZodOptional<z.ZodString>;
    kind: z.ZodString;
    url: z.ZodString;
    altText: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    sortIndex: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    url: string;
    kind: string;
    storeId?: string | undefined;
    sortIndex?: number | undefined;
    itemId?: string | undefined;
    altText?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
}, {
    url: string;
    kind: string;
    storeId?: string | undefined;
    sortIndex?: number | undefined;
    itemId?: string | undefined;
    altText?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
}>;
export declare const UpdateMediaAssetInputSchema: z.ZodEffects<z.ZodObject<{
    storeId: z.ZodOptional<z.ZodString>;
    itemId: z.ZodOptional<z.ZodString>;
    kind: z.ZodOptional<z.ZodString>;
    url: z.ZodOptional<z.ZodString>;
    altText: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    sortIndex: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    storeId?: string | undefined;
    sortIndex?: number | undefined;
    url?: string | undefined;
    kind?: string | undefined;
    itemId?: string | undefined;
    altText?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
}, {
    storeId?: string | undefined;
    sortIndex?: number | undefined;
    url?: string | undefined;
    kind?: string | undefined;
    itemId?: string | undefined;
    altText?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
}>, {
    storeId?: string | undefined;
    sortIndex?: number | undefined;
    url?: string | undefined;
    kind?: string | undefined;
    itemId?: string | undefined;
    altText?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
}, {
    storeId?: string | undefined;
    sortIndex?: number | undefined;
    url?: string | undefined;
    kind?: string | undefined;
    itemId?: string | undefined;
    altText?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
}>;
export declare const MediaAssetResponseSchema: z.ZodObject<{
    storeId: z.ZodNullable<z.ZodString>;
    itemId: z.ZodNullable<z.ZodString>;
    store: z.ZodNullable<z.ZodString>;
    item: z.ZodNullable<z.ZodString>;
    kind: z.ZodString;
    url: z.ZodString;
    altText: z.ZodNullable<z.ZodString>;
    metadata: z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    sortIndex: z.ZodNullable<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    store: string | null;
    item: string | null;
    storeId: string | null;
    sortIndex: number | null;
    url: string;
    kind: string;
    itemId: string | null;
    altText: string | null;
    metadata: Record<string, unknown> | null;
}, {
    store: string | null;
    item: string | null;
    storeId: string | null;
    sortIndex: number | null;
    url: string;
    kind: string;
    itemId: string | null;
    altText: string | null;
    metadata: Record<string, unknown> | null;
}>;
export declare const MediaAssetListResponseSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodObject<{
        storeId: z.ZodNullable<z.ZodString>;
        itemId: z.ZodNullable<z.ZodString>;
        store: z.ZodNullable<z.ZodString>;
        item: z.ZodNullable<z.ZodString>;
        kind: z.ZodString;
        url: z.ZodString;
        altText: z.ZodNullable<z.ZodString>;
        metadata: z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        sortIndex: z.ZodNullable<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        store: string | null;
        item: string | null;
        storeId: string | null;
        sortIndex: number | null;
        url: string;
        kind: string;
        itemId: string | null;
        altText: string | null;
        metadata: Record<string, unknown> | null;
    }, {
        store: string | null;
        item: string | null;
        storeId: string | null;
        sortIndex: number | null;
        url: string;
        kind: string;
        itemId: string | null;
        altText: string | null;
        metadata: Record<string, unknown> | null;
    }>, "many">;
    total: z.ZodNumber;
    page: z.ZodNumber;
    limit: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    total: number;
    data: {
        store: string | null;
        item: string | null;
        storeId: string | null;
        sortIndex: number | null;
        url: string;
        kind: string;
        itemId: string | null;
        altText: string | null;
        metadata: Record<string, unknown> | null;
    }[];
    page: number;
    limit: number;
}, {
    total: number;
    data: {
        store: string | null;
        item: string | null;
        storeId: string | null;
        sortIndex: number | null;
        url: string;
        kind: string;
        itemId: string | null;
        altText: string | null;
        metadata: Record<string, unknown> | null;
    }[];
    page: number;
    limit: number;
}>;
export declare const MediaAssetQuerySchema: z.ZodEffects<z.ZodObject<{
    page: z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>;
    limit: z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
}, {
    page?: string | undefined;
    limit?: string | undefined;
}>, {
    page: number;
    limit: number;
    filters: {};
    orderBy: {
        createdAt: string;
    };
}, {
    page?: string | undefined;
    limit?: string | undefined;
}>;
export declare const UpdateMediaSortInputSchema: z.ZodEffects<z.ZodObject<{
    sortIndex: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    sortIndex: number;
}, {
    sortIndex: number;
}>, {
    sortIndex: number;
}, {
    sortIndex: number;
}>;
export type CreateMediaAssetInput = z.infer<typeof CreateMediaAssetInputSchema>;
export type UpdateMediaAssetInput = z.infer<typeof UpdateMediaAssetInputSchema>;
export type MediaAssetResponse = z.infer<typeof MediaAssetResponseSchema>;
export type MediaAssetListResponse = z.infer<typeof MediaAssetListResponseSchema>;
export type MediaAssetQuery = z.infer<typeof MediaAssetQuerySchema>;
export type UpdateMediaSortInput = z.infer<typeof UpdateMediaSortInputSchema>;
//# sourceMappingURL=mediaasset.dto.d.ts.map