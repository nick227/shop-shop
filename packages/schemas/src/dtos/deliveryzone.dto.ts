import { z } from 'zod'

// ========================================
// DeliveryZone DTOs (Auto-Generated from Prisma)
// ========================================

export const CreateDeliveryZoneInputSchema = z.object({
  storeId: z.string(),
  name: z.string(),
  polygonJson: z.record(z.unknown()),
  baseFee: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal'),
  minOrder: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal').optional(),
  isActive: z.boolean().optional(),
  priority: z.number().int().optional()
})

export const UpdateDeliveryZoneInputSchema = z.object({
  storeId: z.string().optional(),
  name: z.string().optional(),
  polygonJson: z.record(z.unknown()).optional(),
  baseFee: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal').optional(),
  minOrder: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal').optional(),
  isActive: z.boolean().optional(),
  priority: z.number().int().optional()
}).refine(data => Object.keys(data).length > 0, 'At least one field must be provided')

export const DeliveryZoneResponseSchema = z.object({
  storeId: z.string(),
  store: z.string(),
  name: z.string(),
  polygonJson: z.record(z.unknown()),
  baseFee: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal'),
  minOrder: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal').nullable(),
  isActive: z.boolean().nullable(),
  priority: z.number().int().nullable()
})

export const DeliveryZoneListResponseSchema = z.object({
  data: z.array(DeliveryZoneResponseSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
})

export const DeliveryZoneQuerySchema = z.object({
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
export type CreateDeliveryZoneInput = z.infer<typeof CreateDeliveryZoneInputSchema>
export type UpdateDeliveryZoneInput = z.infer<typeof UpdateDeliveryZoneInputSchema>
export type DeliveryZoneResponse = z.infer<typeof DeliveryZoneResponseSchema>
export type DeliveryZoneListResponse = z.infer<typeof DeliveryZoneListResponseSchema>
export type DeliveryZoneQuery = z.infer<typeof DeliveryZoneQuerySchema>

