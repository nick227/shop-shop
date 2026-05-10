import { z } from 'zod';
// ========================================
// Tip DTOs (Auto-Generated from Prisma)
// ========================================
export const CreateTipInputSchema = z.object({
    orderId: z.string(),
    amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal'),
    status: z.string().optional(),
    stripePaymentIntentId: z.string().optional(),
    stripeChargeId: z.string().optional(),
    stripeTransferId: z.string().optional(),
    stripeApplicationFeeId: z.string().optional()
});
export const UpdateTipInputSchema = z.object({
    orderId: z.string().optional(),
    amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal').optional(),
    status: z.string().optional(),
    stripePaymentIntentId: z.string().optional(),
    stripeChargeId: z.string().optional(),
    stripeTransferId: z.string().optional(),
    stripeApplicationFeeId: z.string().optional()
}).refine(data => Object.keys(data).length > 0, 'At least one field must be provided');
export const TipResponseSchema = z.object({
    orderId: z.string(),
    order: z.string(),
    amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal'),
    status: z.string().nullable(),
    stripePaymentIntentId: z.string().nullable(),
    stripeChargeId: z.string().nullable(),
    stripeTransferId: z.string().nullable(),
    stripeApplicationFeeId: z.string().nullable()
});
export const TipListResponseSchema = z.object({
    data: z.array(TipResponseSchema),
    total: z.number(),
    page: z.number(),
    limit: z.number(),
});
export const TipQuerySchema = z.object({
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
// ========================================
// Manual Additions (not auto-generated)
// ========================================
export const ProcessTipInputSchema = z.object({
    paymentMethodId: z.string().min(1, 'Payment method is required'),
});
export const TipStatusUpdateSchema = z.object({
    status: z.enum(['PENDING', 'PAID', 'FAILED', 'REFUNDED']),
    stripeChargeId: z.string().optional(),
    stripeTransferId: z.string().optional(),
    stripeApplicationFeeId: z.string().optional(),
});
