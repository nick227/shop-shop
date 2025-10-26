import { z } from 'zod';
export declare const UploadMediaInputSchema: z.ZodObject<{
    storeId: z.ZodOptional<z.ZodString>;
    itemId: z.ZodOptional<z.ZodString>;
    altText: z.ZodOptional<z.ZodString>;
    sortIndex: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    sortIndex: number;
    storeId?: string | undefined;
    itemId?: string | undefined;
    altText?: string | undefined;
}, {
    storeId?: string | undefined;
    sortIndex?: number | undefined;
    itemId?: string | undefined;
    altText?: string | undefined;
}>;
export declare const MediaResponseSchema: z.ZodObject<{
    id: z.ZodString;
    kind: z.ZodEnum<["IMAGE", "VIDEO"]>;
    url: z.ZodString;
    altText: z.ZodNullable<z.ZodString>;
    sortIndex: z.ZodNumber;
    size: z.ZodNumber;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: string;
    sortIndex: number;
    kind: "IMAGE" | "VIDEO";
    url: string;
    altText: string | null;
    size: number;
}, {
    id: string;
    createdAt: string;
    sortIndex: number;
    kind: "IMAGE" | "VIDEO";
    url: string;
    altText: string | null;
    size: number;
}>;
export declare const MediaListResponseSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        kind: z.ZodEnum<["IMAGE", "VIDEO"]>;
        url: z.ZodString;
        altText: z.ZodNullable<z.ZodString>;
        sortIndex: z.ZodNumber;
        size: z.ZodNumber;
        createdAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        createdAt: string;
        sortIndex: number;
        kind: "IMAGE" | "VIDEO";
        url: string;
        altText: string | null;
        size: number;
    }, {
        id: string;
        createdAt: string;
        sortIndex: number;
        kind: "IMAGE" | "VIDEO";
        url: string;
        altText: string | null;
        size: number;
    }>, "many">;
    total: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    data: {
        id: string;
        createdAt: string;
        sortIndex: number;
        kind: "IMAGE" | "VIDEO";
        url: string;
        altText: string | null;
        size: number;
    }[];
    total: number;
}, {
    data: {
        id: string;
        createdAt: string;
        sortIndex: number;
        kind: "IMAGE" | "VIDEO";
        url: string;
        altText: string | null;
        size: number;
    }[];
    total: number;
}>;
export declare const UpdateMediaSortInputSchema: z.ZodObject<{
    sortIndex: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    sortIndex: number;
}, {
    sortIndex: number;
}>;
export type UploadMediaInput = z.infer<typeof UploadMediaInputSchema>;
export type MediaResponse = z.infer<typeof MediaResponseSchema>;
export type MediaListResponse = z.infer<typeof MediaListResponseSchema>;
export type UpdateMediaSortInput = z.infer<typeof UpdateMediaSortInputSchema>;
//# sourceMappingURL=media.dto.d.ts.map