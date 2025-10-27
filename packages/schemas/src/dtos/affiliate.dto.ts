import { z } from 'zod'

// ========================================
// Affiliate DTOs (Auto-Generated from Prisma)
// ========================================

export const CreateAffiliateInputSchema = z.object({
  userId: z.string(),
  status: z.string().optional(),
  referralCode: z.string(),
  commissionRate: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal').optional(),
  paypalEmail: z.string().optional(),
  bankAccountJson: z.record(z.unknown()).optional(),
  taxId: z.string().optional(),
  bio: z.string().optional(),
  website: z.string().optional()
})

export const UpdateAffiliateInputSchema = z.object({
  userId: z.string().optional(),
  status: z.string().optional(),
  referralCode: z.string().optional(),
  commissionRate: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal').optional(),
  paypalEmail: z.string().optional(),
  bankAccountJson: z.record(z.unknown()).optional(),
  taxId: z.string().optional(),
  bio: z.string().optional(),
  website: z.string().optional()
}).refine(data => Object.keys(data).length > 0, 'At least one field must be provided')

export const AffiliateResponseSchema = z.object({
  userId: z.string(),
  user: z.string(),
  status: z.string().nullable(),
  referralCode: z.string(),
  commissionRate: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal').nullable(),
  paypalEmail: z.string().nullable(),
  bankAccountJson: z.record(z.unknown()).nullable(),
  taxId: z.string().nullable(),
  bio: z.string().nullable(),
  website: z.string().nullable(),
  referredStores: z.string(),
  commissions: z.string(),
  payouts: z.string()
})

export const AffiliateListResponseSchema = z.object({
  data: z.array(AffiliateResponseSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
})

export const AffiliateQuerySchema = z.object({
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
export type CreateAffiliateInput = z.infer<typeof CreateAffiliateInputSchema>
export type UpdateAffiliateInput = z.infer<typeof UpdateAffiliateInputSchema>
export type AffiliateResponse = z.infer<typeof AffiliateResponseSchema>
export type AffiliateListResponse = z.infer<typeof AffiliateListResponseSchema>
export type AffiliateQuery = z.infer<typeof AffiliateQuerySchema>

