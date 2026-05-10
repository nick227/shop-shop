import { z } from 'zod';
export declare const CreatePromotionRedemptionInputSchema: z.ZodObject<{
    promotionId: z.ZodString;
    userId: z.ZodString;
    orderId: z.ZodOptional<z.ZodString>;
    discountAmount: z.ZodString;
    redeemedAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    promotionId: string;
    discountAmount: string;
    orderId?: string | undefined;
    redeemedAt?: string | undefined;
}, {
    userId: string;
    promotionId: string;
    discountAmount: string;
    orderId?: string | undefined;
    redeemedAt?: string | undefined;
}>;
export declare const UpdatePromotionRedemptionInputSchema: z.ZodEffects<z.ZodObject<{
    promotionId: z.ZodOptional<z.ZodString>;
    userId: z.ZodOptional<z.ZodString>;
    orderId: z.ZodOptional<z.ZodString>;
    discountAmount: z.ZodOptional<z.ZodString>;
    redeemedAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    userId?: string | undefined;
    orderId?: string | undefined;
    promotionId?: string | undefined;
    discountAmount?: string | undefined;
    redeemedAt?: string | undefined;
}, {
    userId?: string | undefined;
    orderId?: string | undefined;
    promotionId?: string | undefined;
    discountAmount?: string | undefined;
    redeemedAt?: string | undefined;
}>, {
    userId?: string | undefined;
    orderId?: string | undefined;
    promotionId?: string | undefined;
    discountAmount?: string | undefined;
    redeemedAt?: string | undefined;
}, {
    userId?: string | undefined;
    orderId?: string | undefined;
    promotionId?: string | undefined;
    discountAmount?: string | undefined;
    redeemedAt?: string | undefined;
}>;
export declare const PromotionRedemptionResponseSchema: z.ZodObject<{
    promotionId: z.ZodString;
    promotion: z.ZodString;
    userId: z.ZodString;
    orderId: z.ZodNullable<z.ZodString>;
    discountAmount: z.ZodString;
    redeemedAt: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    promotion: string;
    userId: string;
    orderId: string | null;
    promotionId: string;
    discountAmount: string;
    redeemedAt: string | null;
}, {
    promotion: string;
    userId: string;
    orderId: string | null;
    promotionId: string;
    discountAmount: string;
    redeemedAt: string | null;
}>;
export declare const PromotionRedemptionListResponseSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodObject<{
        promotionId: z.ZodString;
        promotion: z.ZodString;
        userId: z.ZodString;
        orderId: z.ZodNullable<z.ZodString>;
        discountAmount: z.ZodString;
        redeemedAt: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        promotion: string;
        userId: string;
        orderId: string | null;
        promotionId: string;
        discountAmount: string;
        redeemedAt: string | null;
    }, {
        promotion: string;
        userId: string;
        orderId: string | null;
        promotionId: string;
        discountAmount: string;
        redeemedAt: string | null;
    }>, "many">;
    total: z.ZodNumber;
    page: z.ZodNumber;
    limit: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    total: number;
    data: {
        promotion: string;
        userId: string;
        orderId: string | null;
        promotionId: string;
        discountAmount: string;
        redeemedAt: string | null;
    }[];
    page: number;
    limit: number;
}, {
    total: number;
    data: {
        promotion: string;
        userId: string;
        orderId: string | null;
        promotionId: string;
        discountAmount: string;
        redeemedAt: string | null;
    }[];
    page: number;
    limit: number;
}>;
export declare const PromotionRedemptionQuerySchema: z.ZodEffects<z.ZodObject<{
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
export type CreatePromotionRedemptionInput = z.infer<typeof CreatePromotionRedemptionInputSchema>;
export type UpdatePromotionRedemptionInput = z.infer<typeof UpdatePromotionRedemptionInputSchema>;
export type PromotionRedemptionResponse = z.infer<typeof PromotionRedemptionResponseSchema>;
export type PromotionRedemptionListResponse = z.infer<typeof PromotionRedemptionListResponseSchema>;
export type PromotionRedemptionQuery = z.infer<typeof PromotionRedemptionQuerySchema>;
//# sourceMappingURL=promotionredemption.dto.d.ts.map