import { z } from 'zod'
import { 
  defineFields,
  generateResponseSchema,
  generateListResponseSchema,
  generateQuerySchema,
} from '../core/dto.generator.js'

// ========================================
// Order DTOs (Aligned with Prisma Schema)
// Schema includes: fees, tax, tip, serviceFee, netToVendor, Stripe fields
// ========================================

const orderFields = defineFields([
  { name: 'id', type: 'String', isOptional: false, hasDefault: true },
  { name: 'userId', type: 'String', isOptional: false, hasDefault: false },
  { name: 'storeId', type: 'String', isOptional: false, hasDefault: false },
  { name: 'cartId', type: 'String', isOptional: true, hasDefault: false },
  { name: 'status', type: 'String', isOptional: false, hasDefault: true },
  { name: 'deliveryType', type: 'String', isOptional: false, hasDefault: false },
  { name: 'paymentStatus', type: 'String', isOptional: false, hasDefault: true },
  
  // Financial breakdown (all calculated)
  { name: 'subtotal', type: 'Decimal', isOptional: false, hasDefault: false },
  { name: 'fees', type: 'Decimal', isOptional: false, hasDefault: false },
  { name: 'tax', type: 'Decimal', isOptional: false, hasDefault: false },
  { name: 'tip', type: 'Decimal', isOptional: false, hasDefault: false },
  { name: 'total', type: 'Decimal', isOptional: false, hasDefault: false },
  { name: 'serviceFeePercent', type: 'Decimal', isOptional: false, hasDefault: false },
  { name: 'serviceFeeAmount', type: 'Decimal', isOptional: false, hasDefault: false },
  { name: 'netToVendor', type: 'Decimal', isOptional: false, hasDefault: false },
  
  // Stripe integration
  { name: 'stripePaymentIntentId', type: 'String', isOptional: true, hasDefault: false },
  { name: 'stripeChargeId', type: 'String', isOptional: true, hasDefault: false },
  { name: 'stripeTransferId', type: 'String', isOptional: true, hasDefault: false },
  { name: 'stripeApplicationFeeId', type: 'String', isOptional: true, hasDefault: false },
  { name: 'stripeRefundId', type: 'String', isOptional: true, hasDefault: false },
  
  { name: 'addressId', type: 'String', isOptional: true, hasDefault: false },
  { name: 'addressSnapshot', type: 'Json', isOptional: true, hasDefault: false },
  { name: 'createdAt', type: 'DateTime', isOptional: false, hasDefault: true },
  { name: 'updatedAt', type: 'DateTime', isOptional: false, hasDefault: true },
])

// Order creation input (user provides minimal info, system calculates rest)
export const CreateOrderInputSchema = z.object({
  cartId: z.string().uuid(),
  deliveryType: z.enum(['DELIVERY', 'PICKUP']),
  addressId: z.string().uuid().optional(),
  tip: z.string().regex(/^\d+(\.\d{1,2})?$/).default('0.00'),
})

// Order status updates (vendors update status)
export const UpdateOrderStatusSchema = z.object({
  status: z.enum(['PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELED']),
  note: z.string().max(500).optional(),
})

export const OrderResponseSchema = generateResponseSchema({
  fields: orderFields,
  exclude: ['stripePaymentIntentId', 'stripeChargeId', 'stripeTransferId'],  // Hide Stripe internal IDs from response
})

export const OrderListResponseSchema = generateListResponseSchema(OrderResponseSchema)

export const OrderQuerySchema = generateQuerySchema({
  additionalFilters: {
    userId: z.string().uuid().optional(),
    storeId: z.string().uuid().optional(),
    status: z.enum(['PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELED']).optional(),
    paymentStatus: z.enum(['UNPAID', 'PAID', 'REFUNDED']).optional(),
  },
})

// Type exports
export type CreateOrderInput = z.infer<typeof CreateOrderInputSchema>
export type UpdateOrderStatus = z.infer<typeof UpdateOrderStatusSchema>
export type OrderResponse = z.infer<typeof OrderResponseSchema>
export type OrderListResponse = z.infer<typeof OrderListResponseSchema>
export type OrderQuery = z.infer<typeof OrderQuerySchema>

