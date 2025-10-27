import { z } from 'zod'

// ========================================
// Commission DTOs (Auto-Generated from Prisma)
// ========================================

export const CreateCommissionInputSchema = z.object({
  affiliateId: z.string(),
  orderId: z.string(),
  storeId: z.string(),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal'),
  rate: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal'),
  serviceFeeBase: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal'),
  status: z.string().optional(),
  approvedAt: z.string().datetime().optional(),
  paidAt: z.string().datetime().optional(),
  payoutId: z.string().optional()
})

export const UpdateCommissionInputSchema = z.object({
  affiliateId: z.string().optional(),
  orderId: z.string().optional(),
  storeId: z.string().optional(),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal').optional(),
  rate: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal').optional(),
  serviceFeeBase: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal').optional(),
  status: z.string().optional(),
  approvedAt: z.string().datetime().optional(),
  paidAt: z.string().datetime().optional(),
  payoutId: z.string().optional()
}).refine(data => Object.keys(data).length > 0, 'At least one field must be provided')

export const CommissionResponseSchema = z.object({
  affiliateId: z.string(),
  affiliate: z.string(),
  orderId: z.string(),
  order: z.string(),
  storeId: z.string(),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal'),
  rate: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal'),
  serviceFeeBase: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal'),
  status: z.string().nullable(),
  approvedAt: z.string().datetime().nullable(),
  paidAt: z.string().datetime().nullable(),
  payoutId: z.string().nullable(),
  payout: z.string().nullable()
})

export const CommissionListResponseSchema = z.object({
  data: z.array(CommissionResponseSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
})

export const CommissionQuerySchema = z.object({
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
export type CreateCommissionInput = z.infer<typeof CreateCommissionInputSchema>
export type UpdateCommissionInput = z.infer<typeof UpdateCommissionInputSchema>
export type CommissionResponse = z.infer<typeof CommissionResponseSchema>
export type CommissionListResponse = z.infer<typeof CommissionListResponseSchema>
export type CommissionQuery = z.infer<typeof CommissionQuerySchema>

