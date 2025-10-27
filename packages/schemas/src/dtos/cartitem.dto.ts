import { z } from 'zod'

// ========================================
// CartItem DTOs (Auto-Generated from Prisma)
// ========================================

export const CreateCartItemInputSchema = z.object({
  cartId: z.string(),
  itemId: z.string(),
  titleSnapshot: z.string(),
  unitPrice: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal'),
  quantity: z.number().int(),
  optionsJson: z.record(z.unknown()).optional(),
  notes: z.string().optional()
})

export const UpdateCartItemInputSchema = z.object({
  cartId: z.string().optional(),
  itemId: z.string().optional(),
  titleSnapshot: z.string().optional(),
  unitPrice: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal').optional(),
  quantity: z.number().int().optional(),
  optionsJson: z.record(z.unknown()).optional(),
  notes: z.string().optional()
}).refine(data => Object.keys(data).length > 0, 'At least one field must be provided')

export const CartItemResponseSchema = z.object({
  cartId: z.string(),
  cart: z.string(),
  itemId: z.string(),
  item: z.string(),
  titleSnapshot: z.string(),
  unitPrice: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal'),
  quantity: z.number().int(),
  optionsJson: z.record(z.unknown()).nullable(),
  notes: z.string().nullable()
})

export const CartItemListResponseSchema = z.object({
  data: z.array(CartItemResponseSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
})

export const CartItemQuerySchema = z.object({
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
export type CreateCartItemInput = z.infer<typeof CreateCartItemInputSchema>
export type UpdateCartItemInput = z.infer<typeof UpdateCartItemInputSchema>
export type CartItemResponse = z.infer<typeof CartItemResponseSchema>
export type CartItemListResponse = z.infer<typeof CartItemListResponseSchema>
export type CartItemQuery = z.infer<typeof CartItemQuerySchema>

