import { z } from 'zod'

// ========================================
// PaymentMethod DTOs (Auto-Generated from Prisma)
// ========================================

export const CreatePaymentMethodInputSchema = z.object({
  userId: z.string(),
  provider: z.string().optional(),
  brand: z.string().optional(),
  last4: z.string().optional(),
  isDefault: z.boolean().optional()
})

export const UpdatePaymentMethodInputSchema = z.object({
  userId: z.string().optional(),
  provider: z.string().optional(),
  brand: z.string().optional(),
  last4: z.string().optional(),
  isDefault: z.boolean().optional()
}).refine(data => Object.keys(data).length > 0, 'At least one field must be provided')

export const PaymentMethodResponseSchema = z.object({
  userId: z.string(),
  user: z.string(),
  provider: z.string().nullable(),
  brand: z.string().nullable(),
  last4: z.string().nullable(),
  isDefault: z.boolean().nullable()
})

export const PaymentMethodListResponseSchema = z.object({
  data: z.array(PaymentMethodResponseSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
})

export const PaymentMethodQuerySchema = z.object({
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



// Type exports
export type CreatePaymentMethodInput = z.infer<typeof CreatePaymentMethodInputSchema>
export type UpdatePaymentMethodInput = z.infer<typeof UpdatePaymentMethodInputSchema>
export type PaymentMethodResponse = z.infer<typeof PaymentMethodResponseSchema>
export type PaymentMethodListResponse = z.infer<typeof PaymentMethodListResponseSchema>
export type PaymentMethodQuery = z.infer<typeof PaymentMethodQuerySchema>

