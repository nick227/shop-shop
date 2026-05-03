import { z } from 'zod'

// ========================================
// Order DTOs (Auto-Generated from Prisma)
// ========================================

/** POST /orders — placement payload (server computes totals and rows). */
export const OrderPlacementInputSchema = z.object({
  cartId: z.string().min(1),
  deliveryType: z.enum(['DELIVERY', 'PICKUP']),
  addressId: z.string().optional(),
  tip: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal').optional(),
  /** Client geocode — preferred when Address.geo is missing */
  deliveryLatitude: z.union([z.number(), z.string()]).optional(),
  deliveryLongitude: z.union([z.number(), z.string()]).optional(),
})

/** @deprecated internal bulk/admin shape; prefer OrderPlacementInputSchema for HTTP */
export const OrderFullRowCreateInputSchema = z.object({
  userId: z.string(),
  storeId: z.string(),
  cartId: z.string().optional(),
  status: z.string(),
  deliveryType: z.string(),
  paymentStatus: z.string(),
  subtotal: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal'),
  fees: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal'),
  tax: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal'),
  tip: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal'),
  total: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal'),
  serviceFeePercent: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal'),
  serviceFeeAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal'),
  netToVendor: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal'),
  stripePaymentIntentId: z.string().optional(),
  stripeChargeId: z.string().optional(),
  stripeTransferId: z.string().optional(),
  stripeApplicationFeeId: z.string().optional(),
  stripeRefundId: z.string().optional(),
  addressId: z.string().optional(),
  addressSnapshot: z.record(z.unknown()).optional(),
  cancelReason: z.string().optional(),
  canceledBy: z.string().optional(),
  canceledAt: z.string().datetime().optional(),
  refundReason: z.string().optional(),
  refundedAt: z.string().datetime().optional(),
})

export const CreateOrderInputSchema = OrderPlacementInputSchema

export const UpdateOrderInputSchema = z.object({
  userId: z.string().optional(),
  storeId: z.string().optional(),
  cartId: z.string().optional(),
  status: z.string(),
  deliveryType: z.string(),
  paymentStatus: z.string(),
  subtotal: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal').optional(),
  fees: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal').optional(),
  tax: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal').optional(),
  tip: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal').optional(),
  total: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal').optional(),
  serviceFeePercent: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal').optional(),
  serviceFeeAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal').optional(),
  netToVendor: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal').optional(),
  stripePaymentIntentId: z.string().optional(),
  stripeChargeId: z.string().optional(),
  stripeTransferId: z.string().optional(),
  stripeApplicationFeeId: z.string().optional(),
  stripeRefundId: z.string().optional(),
  addressId: z.string().optional(),
  addressSnapshot: z.record(z.unknown()).optional(),
  cancelReason: z.string().optional(),
  canceledBy: z.string().optional(),
  canceledAt: z.string().datetime().optional(),
  refundReason: z.string().optional(),
  refundedAt: z.string().datetime().optional()
}).refine(data => Object.keys(data).length > 0, 'At least one field must be provided')

export const OrderResponseSchema = z.object({
  userId: z.string(),
  storeId: z.string(),
  cartId: z.string().nullable(),
  user: z.string(),
  store: z.string(),
  cart: z.string().nullable(),
  status: z.string(),
  deliveryType: z.string(),
  paymentStatus: z.string(),
  subtotal: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal'),
  fees: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal'),
  tax: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal'),
  tip: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal'),
  total: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal'),
  serviceFeePercent: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal'),
  serviceFeeAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal'),
  netToVendor: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal'),
  stripePaymentIntentId: z.string().nullable(),
  stripeChargeId: z.string().nullable(),
  stripeTransferId: z.string().nullable(),
  stripeApplicationFeeId: z.string().nullable(),
  stripeRefundId: z.string().nullable(),
  addressId: z.string().nullable(),
  address: z.string().nullable(),
  addressSnapshot: z.record(z.unknown()).nullable(),
  deliveryLatitude: z.union([z.string(), z.number()]).nullable().optional(),
  deliveryLongitude: z.union([z.string(), z.number()]).nullable().optional(),
  deliveryDistanceMiles: z.union([z.string(), z.number()]).nullable().optional(),
  estimatedDeliveryAt: z.string().datetime().nullable().optional(),
  cancelReason: z.string().nullable(),
  canceledBy: z.string().nullable(),
  canceledAt: z.string().datetime().nullable(),
  refundReason: z.string().nullable(),
  refundedAt: z.string().datetime().nullable(),
  items: z.string(),
  events: z.string(),
  tips: z.string(),
  commissions: z.string()
})

export const OrderListResponseSchema = z.object({
  data: z.array(OrderResponseSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
})

export const OrderQuerySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('20'),
}).transform((data) => {
  const row = data as Record<string, unknown>
  const filters: Record<string, unknown> = {}
  for (const k of Object.keys(row)) {
    if (k === 'page' || k === 'limit') continue
    const v = row[k]
    if (v !== undefined) filters[k] = v
  }
  return {
    page: data.page,
    limit: data.limit,
    filters,
    orderBy: { createdAt: 'desc' as const },
  }
})


// Additional schemas
export const UpdateOrderStatusSchema = z.object({
  status: z.enum([
    'PLACED',
    'ACCEPTED',
    'PREPARING',
    'READY',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'CANCELED',
  ]).optional(),
  assignedToUserId: z.string().nullable().optional(),
  note: z.string().optional(),
}).refine(data => Object.keys(data).some(k => (data as Record<string, unknown>)[k] !== undefined), 'At least one field must be provided')


// Type exports
export type OrderPlacementInput = z.infer<typeof OrderPlacementInputSchema>
export type CreateOrderInput = z.infer<typeof CreateOrderInputSchema>
export type OrderFullRowCreateInput = z.infer<typeof OrderFullRowCreateInputSchema>
export type UpdateOrderInput = z.infer<typeof UpdateOrderInputSchema>
export type OrderResponse = z.infer<typeof OrderResponseSchema>
export type OrderListResponse = z.infer<typeof OrderListResponseSchema>
export type OrderQuery = z.infer<typeof OrderQuerySchema>
export type UpdateOrderStatus = z.infer<typeof UpdateOrderStatusSchema>
