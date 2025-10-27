import { z } from 'zod'

// ========================================
// AffiliatePayout DTOs (Auto-Generated from Prisma)
// ========================================

export const CreateAffiliatePayoutInputSchema = z.object({
  affiliateId: z.string(),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal'),
  method: z.string(),
  status: z.string().optional(),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  referenceId: z.string().optional(),
  failureReason: z.string().optional(),
  paidAt: z.string().datetime().optional()
})

export const UpdateAffiliatePayoutInputSchema = z.object({
  affiliateId: z.string().optional(),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal').optional(),
  method: z.string().optional(),
  status: z.string().optional(),
  periodStart: z.string().datetime().optional(),
  periodEnd: z.string().datetime().optional(),
  referenceId: z.string().optional(),
  failureReason: z.string().optional(),
  paidAt: z.string().datetime().optional()
}).refine(data => Object.keys(data).length > 0, 'At least one field must be provided')

export const AffiliatePayoutResponseSchema = z.object({
  affiliateId: z.string(),
  affiliate: z.string(),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal'),
  method: z.string(),
  status: z.string().nullable(),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  referenceId: z.string().nullable(),
  failureReason: z.string().nullable(),
  paidAt: z.string().datetime().nullable(),
  commissions: z.string()
})

export const AffiliatePayoutListResponseSchema = z.object({
  data: z.array(AffiliatePayoutResponseSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
})

export const AffiliatePayoutQuerySchema = z.object({
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
export type CreateAffiliatePayoutInput = z.infer<typeof CreateAffiliatePayoutInputSchema>
export type UpdateAffiliatePayoutInput = z.infer<typeof UpdateAffiliatePayoutInputSchema>
export type AffiliatePayoutResponse = z.infer<typeof AffiliatePayoutResponseSchema>
export type AffiliatePayoutListResponse = z.infer<typeof AffiliatePayoutListResponseSchema>
export type AffiliatePayoutQuery = z.infer<typeof AffiliatePayoutQuerySchema>

