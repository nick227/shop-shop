import { z } from 'zod'

// ========================================
// Bundle DTOs
// ========================================

export const BundlePricingTypeSchema = z.enum([
  'FIXED_PRICE',
  'DISCOUNT_PERCENT', 
  'DISCOUNT_AMOUNT',
  'BEST_DEAL'
])

export const CreateBundleInputSchema = z.object({
  storeId: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  imageUrl: z.string().url().optional(),
  isActive: z.boolean().default(true),
  sortIndex: z.number().int().default(0),
  items: z.array(z.object({
    itemId: z.string().uuid(),
    quantity: z.number().int().positive().default(1),
    sortIndex: z.number().int().default(0)
  })).min(1),
  pricing: z.object({
    pricingType: BundlePricingTypeSchema,
    fixedPrice: z.number().positive().optional(),
    discountPercent: z.number().min(0).max(100).optional(),
    discountAmount: z.number().positive().optional(),
    minSavings: z.number().positive().optional(),
    showSavings: z.boolean().default(true),
    savingsLabel: z.string().max(50).optional()
  })
})

export const UpdateBundleInputSchema = CreateBundleInputSchema.partial()

export const BundleItemSchema = z.object({
  id: z.string().uuid(),
  bundleId: z.string().uuid(),
  itemId: z.string().uuid(),
  quantity: z.number().int().positive(),
  sortIndex: z.number().int(),
  item: z.object({
    id: z.string().uuid(),
    title: z.string(),
    price: z.number().positive(),
    imageUrl: z.string().url().optional()
  })
})

export const BundlePricingSchema = z.object({
  id: z.string().uuid(),
  bundleId: z.string().uuid(),
  pricingType: BundlePricingTypeSchema,
  fixedPrice: z.number().positive().optional(),
  discountPercent: z.number().min(0).max(100).optional(),
  discountAmount: z.number().positive().optional(),
  minSavings: z.number().positive().optional(),
  showSavings: z.boolean(),
  savingsLabel: z.string().optional()
})

export const BundleResponseSchema = z.object({
  id: z.string().uuid(),
  storeId: z.string().uuid(),
  name: z.string(),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  isActive: z.boolean(),
  sortIndex: z.number().int(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  items: z.array(BundleItemSchema),
  pricing: BundlePricingSchema,
  // Computed fields
  totalItems: z.number().int(),
  individualPrice: z.number().positive(),
  bundlePrice: z.number().positive(),
  savings: z.number().positive(),
  savingsPercent: z.number().min(0).max(100)
})

export const BundleListResponseSchema = z.object({
  data: z.array(BundleResponseSchema),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int()
})

export const BundleQuerySchema = z.object({
  storeId: z.string().uuid().optional(),
  isActive: z.boolean().optional(),
  search: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  sortBy: z.enum(['name', 'createdAt', 'sortIndex']).default('sortIndex'),
  sortOrder: z.enum(['asc', 'desc']).default('asc')
})

// ========================================
// Bundle Pricing Calculation DTOs
// ========================================

export const BundlePricingCalculationSchema = z.object({
  bundleId: z.string().uuid(),
  items: z.array(z.object({
    itemId: z.string().uuid(),
    quantity: z.number().int().positive(),
    price: z.number().positive()
  }))
})

export const BundlePricingResultSchema = z.object({
  bundleId: z.string().uuid(),
  individualTotal: z.number().positive(),
  bundlePrice: z.number().positive(),
  savings: z.number().positive(),
  savingsPercent: z.number().min(0).max(100),
  isValid: z.boolean(),
  errors: z.array(z.string()).optional()
})

// ========================================
// Type Exports
// ========================================

export type BundlePricingType = z.infer<typeof BundlePricingTypeSchema>
export type CreateBundleInput = z.infer<typeof CreateBundleInputSchema>
export type UpdateBundleInput = z.infer<typeof UpdateBundleInputSchema>
export type BundleItem = z.infer<typeof BundleItemSchema>
export type BundlePricing = z.infer<typeof BundlePricingSchema>
export type BundleResponse = z.infer<typeof BundleResponseSchema>
export type BundleListResponse = z.infer<typeof BundleListResponseSchema>
export type BundleQuery = z.infer<typeof BundleQuerySchema>
export type BundlePricingCalculation = z.infer<typeof BundlePricingCalculationSchema>
export type BundlePricingResult = z.infer<typeof BundlePricingResultSchema>
