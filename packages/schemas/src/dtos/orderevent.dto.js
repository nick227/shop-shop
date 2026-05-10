import { z } from 'zod';
// ========================================
// OrderEvent DTOs (Auto-Generated from Prisma)
// ========================================
export const CreateOrderEventInputSchema = z.object({
    orderId: z.string(),
    status: z.string(),
    note: z.string().optional()
});
export const UpdateOrderEventInputSchema = z.object({
    orderId: z.string().optional(),
    status: z.string().optional(),
    note: z.string().optional()
}).refine(data => Object.keys(data).length > 0, 'At least one field must be provided');
export const OrderEventResponseSchema = z.object({
    orderId: z.string(),
    order: z.string(),
    status: z.string(),
    note: z.string().nullable()
});
export const OrderEventListResponseSchema = z.object({
    data: z.array(OrderEventResponseSchema),
    total: z.number(),
    page: z.number(),
    limit: z.number(),
});
export const OrderEventQuerySchema = z.object({
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
