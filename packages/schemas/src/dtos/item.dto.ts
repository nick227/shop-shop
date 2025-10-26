import { z } from 'zod'
import { 
  defineFields,
  generateCreateInputSchema,
  generateUpdateInputSchema,
  generateResponseSchema,
  generateListResponseSchema,
  generateQuerySchema,
} from '../core/dto.generator.js'

// ========================================
// Item DTOs (Aligned with Prisma Schema)
// Schema uses: title, isActive, isSoldOut, optionsJson, sortIndex, stockQty
// ========================================

const itemFields = defineFields([
  { name: 'id', type: 'String', isOptional: false, hasDefault: true },
  { name: 'storeId', type: 'String', isOptional: false, hasDefault: false },
  { name: 'title', type: 'String', isOptional: false, hasDefault: false },  // ← Schema uses "title"
  { name: 'description', type: 'String', isOptional: true, hasDefault: false },
  { name: 'price', type: 'Decimal', isOptional: false, hasDefault: false },
  { name: 'isActive', type: 'Boolean', isOptional: false, hasDefault: true },  // ← Schema uses "isActive"
  { name: 'isSoldOut', type: 'Boolean', isOptional: false, hasDefault: true },
  { name: 'sortIndex', type: 'Int', isOptional: false, hasDefault: true },
  { name: 'optionsJson', type: 'Json', isOptional: true, hasDefault: false },  // ← Schema uses "optionsJson"
  { name: 'stockQty', type: 'Int', isOptional: true, hasDefault: false },
  { name: 'createdAt', type: 'DateTime', isOptional: false, hasDefault: true },
  { name: 'updatedAt', type: 'DateTime', isOptional: false, hasDefault: true },
])

export const CreateItemInputSchema = generateCreateInputSchema({
  fields: itemFields,
  overrides: {
    storeId: z.string().uuid(),
    title: z.string().min(1).max(200),
    description: z.string().max(1000).optional(),
    price: z.string().regex(/^\d+(\.\d{1,2})?$/),
    stockQty: z.number().int().min(0).optional(),
  },
})

export const UpdateItemInputSchema = generateUpdateInputSchema({
  fields: itemFields,
  exclude: ['storeId'],  // Can't change store
  overrides: {
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(1000).optional(),
    price: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
    stockQty: z.number().int().min(0).optional(),
  },
})

export const ItemResponseSchema = generateResponseSchema({
  fields: itemFields,
})

export const ItemListResponseSchema = generateListResponseSchema(ItemResponseSchema)

export const ItemQuerySchema = generateQuerySchema({
  additionalFilters: {
    storeId: z.string().uuid().optional(),
    isActive: z.string().transform(val => val === 'true').optional(),
    isSoldOut: z.string().transform(val => val === 'true').optional(),
  },
})

// Type exports
export type CreateItemInput = z.infer<typeof CreateItemInputSchema>
export type UpdateItemInput = z.infer<typeof UpdateItemInputSchema>
export type ItemResponse = z.infer<typeof ItemResponseSchema>
export type ItemListResponse = z.infer<typeof ItemListResponseSchema>
export type ItemQuery = z.infer<typeof ItemQuerySchema>

