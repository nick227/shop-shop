import { z } from 'zod';
export declare const CreateBundlePricingInputSchema: z.ZodObject<{
    bundleId: z.ZodString;
    pricingType: z.ZodOptional<z.ZodString>;
    fixedPrice: z.ZodOptional<z.ZodString>;
    discountPercent: z.ZodOptional<z.ZodString>;
    discountAmount: z.ZodOptional<z.ZodString>;
    minSavings: z.ZodOptional<z.ZodString>;
    showSavings: z.ZodOptional<z.ZodBoolean>;
    savingsLabel: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    bundleId: string;
    discountAmount?: string | undefined;
    pricingType?: string | undefined;
    fixedPrice?: string | undefined;
    discountPercent?: string | undefined;
    minSavings?: string | undefined;
    showSavings?: boolean | undefined;
    savingsLabel?: string | undefined;
}, {
    bundleId: string;
    discountAmount?: string | undefined;
    pricingType?: string | undefined;
    fixedPrice?: string | undefined;
    discountPercent?: string | undefined;
    minSavings?: string | undefined;
    showSavings?: boolean | undefined;
    savingsLabel?: string | undefined;
}>;
export declare const UpdateBundlePricingInputSchema: z.ZodEffects<z.ZodObject<{
    bundleId: z.ZodOptional<z.ZodString>;
    pricingType: z.ZodOptional<z.ZodString>;
    fixedPrice: z.ZodOptional<z.ZodString>;
    discountPercent: z.ZodOptional<z.ZodString>;
    discountAmount: z.ZodOptional<z.ZodString>;
    minSavings: z.ZodOptional<z.ZodString>;
    showSavings: z.ZodOptional<z.ZodBoolean>;
    savingsLabel: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    bundleId?: string | undefined;
    discountAmount?: string | undefined;
    pricingType?: string | undefined;
    fixedPrice?: string | undefined;
    discountPercent?: string | undefined;
    minSavings?: string | undefined;
    showSavings?: boolean | undefined;
    savingsLabel?: string | undefined;
}, {
    bundleId?: string | undefined;
    discountAmount?: string | undefined;
    pricingType?: string | undefined;
    fixedPrice?: string | undefined;
    discountPercent?: string | undefined;
    minSavings?: string | undefined;
    showSavings?: boolean | undefined;
    savingsLabel?: string | undefined;
}>, {
    bundleId?: string | undefined;
    discountAmount?: string | undefined;
    pricingType?: string | undefined;
    fixedPrice?: string | undefined;
    discountPercent?: string | undefined;
    minSavings?: string | undefined;
    showSavings?: boolean | undefined;
    savingsLabel?: string | undefined;
}, {
    bundleId?: string | undefined;
    discountAmount?: string | undefined;
    pricingType?: string | undefined;
    fixedPrice?: string | undefined;
    discountPercent?: string | undefined;
    minSavings?: string | undefined;
    showSavings?: boolean | undefined;
    savingsLabel?: string | undefined;
}>;
export declare const BundlePricingResponseSchema: z.ZodObject<{
    bundleId: z.ZodString;
    bundle: z.ZodString;
    pricingType: z.ZodNullable<z.ZodString>;
    fixedPrice: z.ZodNullable<z.ZodString>;
    discountPercent: z.ZodNullable<z.ZodString>;
    discountAmount: z.ZodNullable<z.ZodString>;
    minSavings: z.ZodNullable<z.ZodString>;
    showSavings: z.ZodNullable<z.ZodBoolean>;
    savingsLabel: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    bundle: string;
    bundleId: string;
    discountAmount: string | null;
    pricingType: string | null;
    fixedPrice: string | null;
    discountPercent: string | null;
    minSavings: string | null;
    showSavings: boolean | null;
    savingsLabel: string | null;
}, {
    bundle: string;
    bundleId: string;
    discountAmount: string | null;
    pricingType: string | null;
    fixedPrice: string | null;
    discountPercent: string | null;
    minSavings: string | null;
    showSavings: boolean | null;
    savingsLabel: string | null;
}>;
export declare const BundlePricingListResponseSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodObject<{
        bundleId: z.ZodString;
        bundle: z.ZodString;
        pricingType: z.ZodNullable<z.ZodString>;
        fixedPrice: z.ZodNullable<z.ZodString>;
        discountPercent: z.ZodNullable<z.ZodString>;
        discountAmount: z.ZodNullable<z.ZodString>;
        minSavings: z.ZodNullable<z.ZodString>;
        showSavings: z.ZodNullable<z.ZodBoolean>;
        savingsLabel: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        bundle: string;
        bundleId: string;
        discountAmount: string | null;
        pricingType: string | null;
        fixedPrice: string | null;
        discountPercent: string | null;
        minSavings: string | null;
        showSavings: boolean | null;
        savingsLabel: string | null;
    }, {
        bundle: string;
        bundleId: string;
        discountAmount: string | null;
        pricingType: string | null;
        fixedPrice: string | null;
        discountPercent: string | null;
        minSavings: string | null;
        showSavings: boolean | null;
        savingsLabel: string | null;
    }>, "many">;
    total: z.ZodNumber;
    page: z.ZodNumber;
    limit: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    total: number;
    data: {
        bundle: string;
        bundleId: string;
        discountAmount: string | null;
        pricingType: string | null;
        fixedPrice: string | null;
        discountPercent: string | null;
        minSavings: string | null;
        showSavings: boolean | null;
        savingsLabel: string | null;
    }[];
    page: number;
    limit: number;
}, {
    total: number;
    data: {
        bundle: string;
        bundleId: string;
        discountAmount: string | null;
        pricingType: string | null;
        fixedPrice: string | null;
        discountPercent: string | null;
        minSavings: string | null;
        showSavings: boolean | null;
        savingsLabel: string | null;
    }[];
    page: number;
    limit: number;
}>;
export declare const BundlePricingQuerySchema: z.ZodEffects<z.ZodObject<{
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
export type CreateBundlePricingInput = z.infer<typeof CreateBundlePricingInputSchema>;
export type UpdateBundlePricingInput = z.infer<typeof UpdateBundlePricingInputSchema>;
export type BundlePricingResponse = z.infer<typeof BundlePricingResponseSchema>;
export type BundlePricingListResponse = z.infer<typeof BundlePricingListResponseSchema>;
export type BundlePricingQuery = z.infer<typeof BundlePricingQuerySchema>;
//# sourceMappingURL=bundlepricing.dto.d.ts.map