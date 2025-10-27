import { z } from 'zod'

// ========================================
// Order DTOs (Auto-Generated from Prisma)
// ========================================

export const CreateOrderInputSchema = z.object({
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
  refundedAt: z.string().datetime().optional()
})

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
}).transform(data => ({
  page: data.page,
  limit: data.limit,
  filters: Object.keys(data)
    .filter(k => k !== 'page' && k !== 'limit' && (data as any)[k] !== undefined)
    .reduce((acc, k) => ({ ...acc, [k]: (data as any)[k] }), {}),
  orderBy: { createdAt: 'desc' },
}))


// Additional schemas
export const UpdateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED'])
}).refine(data => Object.keys(data).length > 0, 'At least one field must be provided')


// Type exports
export type CreateOrderInput = z.infer<typeof CreateOrderInputSchema>
export type UpdateOrderInput = z.infer<typeof UpdateOrderInputSchema>
export type OrderResponse = z.infer<typeof OrderResponseSchema>
export type OrderListResponse = z.infer<typeof OrderListResponseSchema>
export type OrderQuery = z.infer<typeof OrderQuerySchema>
export type UpdateOrderStatus = z.infer<typeof UpdateOrderStatusSchema>
