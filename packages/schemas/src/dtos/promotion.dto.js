import { z } from 'zod';
// ========================================
// Promotion DTOs (Auto-Generated from Prisma)
// ========================================
export const CreatePromotionInputSchema = z.object({
    storeId: z.string().optional(),
    code: z.string(),
    name: z.string(),
    description: z.string().optional(),
    type: z.string(),
    status: z.string().optional(),
    value: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal'),
    minOrderValue: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal').optional(),
    maxDiscount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal').optional(),
    usageLimit: z.number().int().optional(),
    usageCount: z.number().int().optional(),
    usageLimitPerUser: z.number().int().optional(),
    allowStacking: z.boolean().optional(),
    eligibleUserIds: z.record(z.unknown()).optional(),
    excludedUserIds: z.record(z.unknown()).optional(),
    validFrom: z.string().datetime(),
    validUntil: z.string().datetime(),
    isGlobal: z.boolean().optional(),
    createdById: z.string()
});
export const UpdatePromotionInputSchema = z.object({
    storeId: z.string().optional(),
    code: z.string().optional(),
    name: z.string().optional(),
    description: z.string().optional(),
    type: z.string().optional(),
    status: z.string().optional(),
    value: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal').optional(),
    minOrderValue: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal').optional(),
    maxDiscount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal').optional(),
    usageLimit: z.number().int().optional(),
    usageCount: z.number().int().optional(),
    usageLimitPerUser: z.number().int().optional(),
    allowStacking: z.boolean().optional(),
    eligibleUserIds: z.record(z.unknown()).optional(),
    excludedUserIds: z.record(z.unknown()).optional(),
    validFrom: z.string().datetime().optional(),
    validUntil: z.string().datetime().optional(),
    isGlobal: z.boolean().optional()
}).refine(data => Object.keys(data).length > 0, 'At least one field must be provided');
export const PromotionResponseSchema = z.object({
    storeId: z.string().nullable(),
    store: z.string().nullable(),
    code: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    type: z.string(),
    status: z.string().nullable(),
    value: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal'),
    minOrderValue: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal').nullable(),
    maxDiscount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal').nullable(),
    usageLimit: z.number().int().nullable(),
    usageCount: z.number().int().nullable(),
    usageLimitPerUser: z.number().int().nullable(),
    allowStacking: z.boolean().nullable(),
    eligibleUserIds: z.record(z.unknown()).nullable(),
    excludedUserIds: z.record(z.unknown()).nullable(),
    validFrom: z.string().datetime(),
    validUntil: z.string().datetime(),
    isGlobal: z.boolean().nullable(),
    createdById: z.string(),
    createdBy: z.string(),
    redemptions: z.string()
});
export const PromotionListResponseSchema = z.object({
    data: z.array(PromotionResponseSchema),
    total: z.number(),
    page: z.number(),
    limit: z.number(),
});
export const PromotionQuerySchema = z.object({
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
