import { z } from 'zod'

// ========================================
// Tip DTOs
// ========================================

export const CreateTipInputSchema = z.object({
  orderId: z.string().uuid('Invalid order ID'),
  amount: z.number()
    .positive('Tip amount must be positive')
    .max(1000, 'Tip amount cannot exceed $1000')
    .transform(val => Math.round(val * 100) / 100), // Round to 2 decimal places
})

export const TipResponseSchema = z.object({
  id: z.string().uuid(),
  orderId: z.string().uuid(),
  amount: z.number(),
  status: z.enum(['PENDING', 'PAID', 'FAILED', 'REFUNDED']),
  stripePaymentIntentId: z.string().nullable(),
  stripeChargeId: z.string().nullable(),
  stripeTransferId: z.string().nullable(),
  stripeApplicationFeeId: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export const ProcessTipInputSchema = z.object({
  paymentMethodId: z.string().min(1, 'Payment method is required'),
})

export const TipStatusUpdateSchema = z.object({
  status: z.enum(['PENDING', 'PAID', 'FAILED', 'REFUNDED']),
  stripeChargeId: z.string().optional(),
  stripeTransferId: z.string().optional(),
  stripeApplicationFeeId: z.string().optional(),
})

// Type exports
export type CreateTipInput = z.infer<typeof CreateTipInputSchema>
export type TipResponse = z.infer<typeof TipResponseSchema>
export type ProcessTipInput = z.infer<typeof ProcessTipInputSchema>
export type TipStatusUpdate = z.infer<typeof TipStatusUpdateSchema>
