import { z } from 'zod';
// ========================================
// Bundle DTOs (Auto-Generated from Prisma)
// ========================================
export const CreateBundleInputSchema = z.object({
    storeId: z.string(),
    name: z.string(),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
    sortIndex: z.number().int().optional(),
    items: z.array(z.object({
        itemId: z.string(),
        quantity: z.number(),
        sortIndex: z.number().int().optional()
    })),
    pricing: z.object({
        pricingType: z.enum(['FIXED_PRICE', 'DISCOUNT_PERCENT', 'DISCOUNT_AMOUNT', 'BEST_DEAL']),
        fixedPrice: z.number().optional(),
        discountPercent: z.number().optional(),
        discountAmount: z.number().optional(),
        minSavings: z.number().optional(),
        showSavings: z.boolean().optional(),
        savingsLabel: z.string().optional()
    })
});
export const UpdateBundleInputSchema = z.object({
    storeId: z.string().optional(),
    name: z.string().optional(),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
    sortIndex: z.number().int().optional(),
    items: z.array(z.object({
        itemId: z.string(),
        quantity: z.number(),
        sortIndex: z.number().int().optional()
    })).optional(),
    pricing: z.object({
        pricingType: z.enum(['FIXED_PRICE', 'DISCOUNT_PERCENT', 'DISCOUNT_AMOUNT', 'BEST_DEAL']),
        fixedPrice: z.number().optional(),
        discountPercent: z.number().optional(),
        discountAmount: z.number().optional(),
        minSavings: z.number().optional(),
        showSavings: z.boolean().optional(),
        savingsLabel: z.string().optional()
    }).optional()
}).refine(data => Object.keys(data).length > 0, 'At least one field must be provided');
export const BundleResponseSchema = z.object({
    id: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
    storeId: z.string(),
    store: z.string().optional(),
    name: z.string(),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
    sortIndex: z.number().int().optional(),
    items: z.array(z.object({
        id: z.string(),
        bundleId: z.string(),
        itemId: z.string(),
        quantity: z.number(),
        sortIndex: z.number().int().optional(),
        price: z.number().optional(),
        title: z.string().optional(),
        item: z.object({
            id: z.string(),
            title: z.string(),
            price: z.number(),
            imageUrl: z.string().optional()
        }).optional()
    })).optional(),
    pricing: z.object({
        id: z.string(),
        bundleId: z.string(),
        pricingType: z.enum(['FIXED_PRICE', 'DISCOUNT_PERCENT', 'DISCOUNT_AMOUNT', 'BEST_DEAL']),
        fixedPrice: z.number().optional(),
        discountPercent: z.number().optional(),
        discountAmount: z.number().optional(),
        minSavings: z.number().optional(),
        showSavings: z.boolean().optional(),
        savingsLabel: z.string().optional()
    }).optional(),
    orderItems: z.string().optional()
});
export const BundleListResponseSchema = z.object({
    data: z.array(BundleResponseSchema),
    total: z.number(),
    page: z.number(),
    limit: z.number(),
});
export const BundleQuerySchema = z.object({
    page: z.string().transform(Number).default('1'),
    limit: z.string().transform(Number).default('20'),
    storeId: z.string().optional(),
    isActive: z
        .string()
        .optional()
        .transform((v) => (v === 'true' ? true : v === 'false' ? false : undefined)),
}).transform((data) => ({
    page: data.page,
    limit: data.limit,
    filters: {
        ...(data.storeId !== undefined && { storeId: data.storeId }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
    orderBy: { sortIndex: 'asc' },
}));
