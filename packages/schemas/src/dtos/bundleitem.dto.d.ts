import { z } from 'zod';
export declare const CreateBundleItemInputSchema: z.ZodObject<{
    bundleId: z.ZodString;
    itemId: z.ZodString;
    quantity: z.ZodOptional<z.ZodNumber>;
    sortIndex: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    itemId: string;
    bundleId: string;
    sortIndex?: number | undefined;
    quantity?: number | undefined;
}, {
    itemId: string;
    bundleId: string;
    sortIndex?: number | undefined;
    quantity?: number | undefined;
}>;
export declare const UpdateBundleItemInputSchema: z.ZodEffects<z.ZodObject<{
    bundleId: z.ZodOptional<z.ZodString>;
    itemId: z.ZodOptional<z.ZodString>;
    quantity: z.ZodOptional<z.ZodNumber>;
    sortIndex: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    sortIndex?: number | undefined;
    itemId?: string | undefined;
    bundleId?: string | undefined;
    quantity?: number | undefined;
}, {
    sortIndex?: number | undefined;
    itemId?: string | undefined;
    bundleId?: string | undefined;
    quantity?: number | undefined;
}>, {
    sortIndex?: number | undefined;
    itemId?: string | undefined;
    bundleId?: string | undefined;
    quantity?: number | undefined;
}, {
    sortIndex?: number | undefined;
    itemId?: string | undefined;
    bundleId?: string | undefined;
    quantity?: number | undefined;
}>;
export declare const BundleItemResponseSchema: z.ZodObject<{
    bundleId: z.ZodString;
    bundle: z.ZodString;
    itemId: z.ZodString;
    item: z.ZodString;
    quantity: z.ZodNullable<z.ZodNumber>;
    sortIndex: z.ZodNullable<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    item: string;
    bundle: string;
    sortIndex: number | null;
    itemId: string;
    bundleId: string;
    quantity: number | null;
}, {
    item: string;
    bundle: string;
    sortIndex: number | null;
    itemId: string;
    bundleId: string;
    quantity: number | null;
}>;
export declare const BundleItemListResponseSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodObject<{
        bundleId: z.ZodString;
        bundle: z.ZodString;
        itemId: z.ZodString;
        item: z.ZodString;
        quantity: z.ZodNullable<z.ZodNumber>;
        sortIndex: z.ZodNullable<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        item: string;
        bundle: string;
        sortIndex: number | null;
        itemId: string;
        bundleId: string;
        quantity: number | null;
    }, {
        item: string;
        bundle: string;
        sortIndex: number | null;
        itemId: string;
        bundleId: string;
        quantity: number | null;
    }>, "many">;
    total: z.ZodNumber;
    page: z.ZodNumber;
    limit: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    total: number;
    data: {
        item: string;
        bundle: string;
        sortIndex: number | null;
        itemId: string;
        bundleId: string;
        quantity: number | null;
    }[];
    page: number;
    limit: number;
}, {
    total: number;
    data: {
        item: string;
        bundle: string;
        sortIndex: number | null;
        itemId: string;
        bundleId: string;
        quantity: number | null;
    }[];
    page: number;
    limit: number;
}>;
export declare const BundleItemQuerySchema: z.ZodEffects<z.ZodObject<{
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
export type CreateBundleItemInput = z.infer<typeof CreateBundleItemInputSchema>;
export type UpdateBundleItemInput = z.infer<typeof UpdateBundleItemInputSchema>;
export type BundleItemResponse = z.infer<typeof BundleItemResponseSchema>;
export type BundleItemListResponse = z.infer<typeof BundleItemListResponseSchema>;
export type BundleItemQuery = z.infer<typeof BundleItemQuerySchema>;
//# sourceMappingURL=bundleitem.dto.d.ts.map