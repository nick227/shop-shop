import { z } from 'zod'

// ========================================
// TeamMember DTOs (Auto-Generated from Prisma)
// ========================================

export const CreateTeamMemberInputSchema = z.object({
  storeId: z.string(),
  userId: z.string(),
  permissionsJson: z.record(z.unknown()),
  isActive: z.boolean().optional(),
  addedAt: z.string().datetime().optional()
})

export const UpdateTeamMemberInputSchema = z.object({
  storeId: z.string().optional(),
  userId: z.string().optional(),
  permissionsJson: z.record(z.unknown()).optional(),
  isActive: z.boolean().optional(),
  addedAt: z.string().datetime().optional()
}).refine(data => Object.keys(data).length > 0, 'At least one field must be provided')

export const TeamMemberResponseSchema = z.object({
  storeId: z.string(),
  store: z.string(),
  userId: z.string(),
  user: z.string(),
  permissionsJson: z.record(z.unknown()),
  isActive: z.boolean().nullable(),
  addedAt: z.string().datetime().nullable()
})

export const TeamMemberListResponseSchema = z.object({
  data: z.array(TeamMemberResponseSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
})

export const TeamMemberQuerySchema = z.object({
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
export type CreateTeamMemberInput = z.infer<typeof CreateTeamMemberInputSchema>
export type UpdateTeamMemberInput = z.infer<typeof UpdateTeamMemberInputSchema>
export type TeamMemberResponse = z.infer<typeof TeamMemberResponseSchema>
export type TeamMemberListResponse = z.infer<typeof TeamMemberListResponseSchema>
export type TeamMemberQuery = z.infer<typeof TeamMemberQuerySchema>

