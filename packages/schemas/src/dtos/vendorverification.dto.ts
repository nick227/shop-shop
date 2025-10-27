import { z } from 'zod'

// ========================================
// VendorVerification DTOs (Auto-Generated from Prisma)
// ========================================

export const CreateVendorVerificationInputSchema = z.object({
  userId: z.string(),
  businessName: z.string(),
  businessType: z.string(),
  taxId: z.string(),
  documentsJson: z.record(z.unknown()).optional(),
  status: z.string().optional(),
  submittedAt: z.string().datetime().optional(),
  reviewedAt: z.string().datetime().optional(),
  approvedAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
  reviewNotes: z.string().optional(),
  rejectionReason: z.string().optional(),
  stripeAccountId: z.string().optional()
})

export const UpdateVendorVerificationInputSchema = z.object({
  userId: z.string().optional(),
  businessName: z.string().optional(),
  businessType: z.string().optional(),
  taxId: z.string().optional(),
  documentsJson: z.record(z.unknown()).optional(),
  status: z.string().optional(),
  submittedAt: z.string().datetime().optional(),
  reviewedAt: z.string().datetime().optional(),
  approvedAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
  reviewNotes: z.string().optional(),
  rejectionReason: z.string().optional(),
  stripeAccountId: z.string().optional()
}).refine(data => Object.keys(data).length > 0, 'At least one field must be provided')

export const VendorVerificationResponseSchema = z.object({
  userId: z.string(),
  user: z.string(),
  businessName: z.string(),
  businessType: z.string(),
  taxId: z.string(),
  documentsJson: z.record(z.unknown()).nullable(),
  status: z.string().nullable(),
  submittedAt: z.string().datetime().nullable(),
  reviewedAt: z.string().datetime().nullable(),
  approvedAt: z.string().datetime().nullable(),
  expiresAt: z.string().datetime().nullable(),
  reviewNotes: z.string().nullable(),
  rejectionReason: z.string().nullable(),
  stripeAccountId: z.string().nullable()
})

export const VendorVerificationListResponseSchema = z.object({
  data: z.array(VendorVerificationResponseSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
})

export const VendorVerificationQuerySchema = z.object({
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
export type CreateVendorVerificationInput = z.infer<typeof CreateVendorVerificationInputSchema>
export type UpdateVendorVerificationInput = z.infer<typeof UpdateVendorVerificationInputSchema>
export type VendorVerificationResponse = z.infer<typeof VendorVerificationResponseSchema>
export type VendorVerificationListResponse = z.infer<typeof VendorVerificationListResponseSchema>
export type VendorVerificationQuery = z.infer<typeof VendorVerificationQuerySchema>

