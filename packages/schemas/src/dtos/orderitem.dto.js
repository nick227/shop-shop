import { z } from 'zod';
// ========================================
// OrderItem DTOs (Auto-Generated from Prisma)
// ========================================
export const CreateOrderItemInputSchema = z.object({
    orderId: z.string(),
    itemId: z.string().optional(),
    bundleId: z.string().optional(),
    titleSnapshot: z.string(),
    unitPrice: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal'),
    quantity: z.number().int(),
    optionsJson: z.record(z.unknown()).optional(),
    notes: z.string().optional()
});
export const UpdateOrderItemInputSchema = z.object({
    orderId: z.string().optional(),
    itemId: z.string().optional(),
    bundleId: z.string().optional(),
    titleSnapshot: z.string().optional(),
    unitPrice: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal').optional(),
    quantity: z.number().int().optional(),
    optionsJson: z.record(z.unknown()).optional(),
    notes: z.string().optional()
}).refine(data => Object.keys(data).length > 0, 'At least one field must be provided');
export const OrderItemResponseSchema = z.object({
    orderId: z.string(),
    order: z.string(),
    itemId: z.string().nullable(),
    item: z.string().nullable(),
    bundleId: z.string().nullable(),
    bundle: z.string().nullable(),
    titleSnapshot: z.string(),
    unitPrice: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal'),
    quantity: z.number().int(),
    optionsJson: z.record(z.unknown()).nullable(),
    notes: z.string().nullable()
});
export const OrderItemListResponseSchema = z.object({
    data: z.array(OrderItemResponseSchema),
    total: z.number(),
    page: z.number(),
    limit: z.number(),
});
export const OrderItemQuerySchema = z.object({
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
