import { z } from 'zod';
// ========================================
// Promotion DTOs
// ========================================
export const PromotionTypeSchema = z.enum(['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_ITEM', 'FREE_DELIVERY']);
export const PromotionStatusSchema = z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'EXPIRED']);
export const CreatePromotionInputSchema = z.object({
    storeId: z.string().uuid().optional(), // Optional for global (admin-only) promotions
    code: z.string().min(3).max(20).regex(/^[A-Z0-9_-]+$/, 'Code must be uppercase letters, numbers, hyphens, or underscores'),
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    type: PromotionTypeSchema,
    value: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal'),
    minOrderValue: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
    maxDiscount: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
    usageLimit: z.number().int().positive().optional(),
    validFrom: z.string().datetime(),
    validUntil: z.string().datetime(),
});
export const UpdatePromotionInputSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    status: PromotionStatusSchema.optional(),
    value: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
    minOrderValue: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
    maxDiscount: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
    usageLimit: z.number().int().positive().optional(),
    validFrom: z.string().datetime().optional(),
    validUntil: z.string().datetime().optional(),
}).refine(data => Object.keys(data).length > 0, 'At least one field must be provided');
export const PromotionResponseSchema = z.object({
    id: z.string().uuid(),
    storeId: z.string().uuid().nullable(),
    code: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    type: PromotionTypeSchema,
    status: PromotionStatusSchema,
    value: z.string(),
    minOrderValue: z.string().nullable(),
    maxDiscount: z.string().nullable(),
    usageLimit: z.number().nullable(),
    usageCount: z.number(),
    validFrom: z.string().datetime(),
    validUntil: z.string().datetime(),
    isGlobal: z.boolean(),
    createdById: z.string().uuid(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});
export const ListPromotionsQuerySchema = z.object({
    storeId: z.string().uuid().optional(),
    status: PromotionStatusSchema.optional(),
    isActive: z.string().transform(val => val === 'true').optional(),
    page: z.string().transform(Number).default('1'),
    limit: z.string().transform(Number).default('20'),
}).transform(data => {
    const filters = {};
    if (data.storeId) {
        filters.storeId = data.storeId;
    }
    if (data.status) {
        filters.status = data.status;
    }
    if (data.isActive) {
        filters.status = 'ACTIVE';
        filters.validFrom = { lte: new Date() };
        filters.validUntil = { gte: new Date() };
    }
    return {
        page: data.page,
        limit: data.limit,
        filters,
        orderBy: { createdAt: 'desc' }
    };
});
export const PromotionListResponseSchema = z.object({
    data: z.array(PromotionResponseSchema),
    total: z.number(),
    page: z.number(),
    limit: z.number(),
});
