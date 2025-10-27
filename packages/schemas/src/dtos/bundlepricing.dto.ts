import { z } from 'zod'

// ========================================
// BundlePricing DTOs (Auto-Generated from Prisma)
// ========================================

export const CreateBundlePricingInputSchema = z.object({
  bundleId: z.string(),
  pricingType: z.string().optional(),
  fixedPrice: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal').optional(),
  discountPercent: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal').optional(),
  discountAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal').optional(),
  minSavings: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal').optional(),
  showSavings: z.boolean().optional(),
  savingsLabel: z.string().optional()
})

export const UpdateBundlePricingInputSchema = z.object({
  bundleId: z.string().optional(),
  pricingType: z.string().optional(),
  fixedPrice: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal').optional(),
  discountPercent: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal').optional(),
  discountAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal').optional(),
  minSavings: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal').optional(),
  showSavings: z.boolean().optional(),
  savingsLabel: z.string().optional()
}).refine(data => Object.keys(data).length > 0, 'At least one field must be provided')

export const BundlePricingResponseSchema = z.object({
  bundleId: z.string(),
  bundle: z.string(),
  pricingType: z.string().nullable(),
  fixedPrice: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal').nullable(),
  discountPercent: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal').nullable(),
  discountAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal').nullable(),
  minSavings: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal').nullable(),
  showSavings: z.boolean().nullable(),
  savingsLabel: z.string().nullable()
})

export const BundlePricingListResponseSchema = z.object({
  data: z.array(BundlePricingResponseSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
})

export const BundlePricingQuerySchema = z.object({
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
export type CreateBundlePricingInput = z.infer<typeof CreateBundlePricingInputSchema>
export type UpdateBundlePricingInput = z.infer<typeof UpdateBundlePricingInputSchema>
export type BundlePricingResponse = z.infer<typeof BundlePricingResponseSchema>
export type BundlePricingListResponse = z.infer<typeof BundlePricingListResponseSchema>
export type BundlePricingQuery = z.infer<typeof BundlePricingQuerySchema>

