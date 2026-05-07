import { z } from 'zod'

// ========================================
// Cart DTOs (Auto-Generated from Prisma)
// ========================================

export const CreateCartInputSchema = z.object({
  userId: z.string(),
  storeId: z.string(),
  status: z.string().optional(),
  note: z.string().optional(),
  order: z.string().optional()
})

export const UpdateCartInputSchema = z.object({
  userId: z.string().optional(),
  storeId: z.string().optional(),
  status: z.string().optional(),
  note: z.string().optional(),
  order: z.string().optional()
}).refine(data => Object.keys(data).length > 0, 'At least one field must be provided')

export const CartResponseSchema = z.object({
  userId: z.string(),
  storeId: z.string(),
  user: z.string(),
  store: z.string(),
  status: z.string().nullable(),
  note: z.string().nullable(),
  items: z.string(),
  order: z.string().nullable()
})

export const CartListResponseSchema = z.object({
  data: z.array(CartResponseSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
})

export const CartQuerySchema = z.object({
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


// Additional schemas
export const AddToCartInputSchema = z
  .object({
    itemId: z.string().optional(),
    bundleId: z.string().optional(),
    quantity: z.number().int().min(1).optional(),
    options: z.record(z.unknown()).optional(),
    notes: z.string().optional(),
  })
  .refine((d) => !!(d.itemId ?? d.bundleId), { message: 'Either itemId or bundleId is required' })
  .refine((d) => !(d.itemId && d.bundleId), { message: 'Provide either itemId or bundleId, not both' })


// Type exports
export type CreateCartInput = z.infer<typeof CreateCartInputSchema>
export type UpdateCartInput = z.infer<typeof UpdateCartInputSchema>
export type CartResponse = z.infer<typeof CartResponseSchema>
export type CartListResponse = z.infer<typeof CartListResponseSchema>
export type CartQuery = z.infer<typeof CartQuerySchema>
export type AddToCartInput = z.infer<typeof AddToCartInputSchema>
