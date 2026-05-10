import { z } from 'zod';
// ========================================
// PromotionRedemption DTOs (Auto-Generated from Prisma)
// ========================================
export const CreatePromotionRedemptionInputSchema = z.object({
    promotionId: z.string(),
    userId: z.string(),
    orderId: z.string().optional(),
    discountAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal'),
    redeemedAt: z.string().datetime().optional()
});
export const UpdatePromotionRedemptionInputSchema = z.object({
    promotionId: z.string().optional(),
    userId: z.string().optional(),
    orderId: z.string().optional(),
    discountAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal').optional(),
    redeemedAt: z.string().datetime().optional()
}).refine(data => Object.keys(data).length > 0, 'At least one field must be provided');
export const PromotionRedemptionResponseSchema = z.object({
    promotionId: z.string(),
    promotion: z.string(),
    userId: z.string(),
    orderId: z.string().nullable(),
    discountAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal'),
    redeemedAt: z.string().datetime().nullable()
});
export const PromotionRedemptionListResponseSchema = z.object({
    data: z.array(PromotionRedemptionResponseSchema),
    total: z.number(),
    page: z.number(),
    limit: z.number(),
});
export const PromotionRedemptionQuerySchema = z.object({
    page: z.string().transform(Number).default('1'),
    limit: z.string().transform(Number).default('20'),
}).transform(data => ({
    page: data.page,
    limit: data.limit,
    filters: Object.keys(data)
        .filter(k => k !== 'page' && k !== 'limit' && data[k] !== undefined)
        .reduce((acc, k) => ({ ...acc, [k]: data[k] }), {}),
    orderBy: { createdAt: 'desc' },
}));
