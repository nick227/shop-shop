import { z } from 'zod'

// ========================================
// Invitation DTOs (Auto-Generated from Prisma)
// ========================================

export const CreateInvitationInputSchema = z.object({
  storeId: z.string(),
  senderUserId: z.string(),
  recipientEmail: z.string(),
  recipientUserId: z.string().optional(),
  token: z.string(),
  permissionsJson: z.record(z.unknown()),
  status: z.string().optional(),
  message: z.string().optional(),
  expiresAt: z.string().datetime(),
  acceptedAt: z.string().datetime().optional(),
  declinedAt: z.string().datetime().optional(),
  revokedAt: z.string().datetime().optional()
})

export const UpdateInvitationInputSchema = z.object({
  storeId: z.string().optional(),
  senderUserId: z.string().optional(),
  recipientEmail: z.string().optional(),
  recipientUserId: z.string().optional(),
  token: z.string().optional(),
  permissionsJson: z.record(z.unknown()).optional(),
  status: z.string().optional(),
  message: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
  acceptedAt: z.string().datetime().optional(),
  declinedAt: z.string().datetime().optional(),
  revokedAt: z.string().datetime().optional()
}).refine(data => Object.keys(data).length > 0, 'At least one field must be provided')

export const InvitationResponseSchema = z.object({
  storeId: z.string(),
  store: z.string(),
  senderUserId: z.string(),
  sender: z.string(),
  recipientEmail: z.string(),
  recipientUserId: z.string().nullable(),
  recipient: z.string().nullable(),
  token: z.string(),
  permissionsJson: z.record(z.unknown()),
  status: z.string().nullable(),
  message: z.string().nullable(),
  expiresAt: z.string().datetime(),
  acceptedAt: z.string().datetime().nullable(),
  declinedAt: z.string().datetime().nullable(),
  revokedAt: z.string().datetime().nullable()
})

export const InvitationListResponseSchema = z.object({
  data: z.array(InvitationResponseSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
})

export const InvitationQuerySchema = z.object({
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
export type CreateInvitationInput = z.infer<typeof CreateInvitationInputSchema>
export type UpdateInvitationInput = z.infer<typeof UpdateInvitationInputSchema>
export type InvitationResponse = z.infer<typeof InvitationResponseSchema>
export type InvitationListResponse = z.infer<typeof InvitationListResponseSchema>
export type InvitationQuery = z.infer<typeof InvitationQuerySchema>

