import { z } from 'zod'

// ========================================
// Store DTOs (Auto-Generated from Prisma)
// ========================================

export const CreateStoreInputSchema = z.object({
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  companyName: z.string().optional(),
  taxId: z.string().optional(),
  phone: z.string(),
  email: z.string(),
  website: z.string(),
  isPublished: z.boolean().optional(),
  deliveryEnabled: z.boolean().optional(),
  pickupEnabled: z.boolean().optional(),
  prepTimeMin: z.number().int().optional(),
  feesJson: z.record(z.unknown()).optional(),
  hoursJson: z.record(z.unknown()).optional(),
  deliveryDistance: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal').optional(),
  deliveryCharge: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal').optional(),
  latitude: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal').optional(),
  longitude: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal').optional(),
  addressStreet: z.string().optional(),
  addressCity: z.string().optional(),
  addressState: z.string().optional(),
  addressZip: z.string().optional(),
  addressCountry: z.string().optional(),
  geocodedAt: z.string().datetime().optional(),
  geocodeSource: z.string().optional(),
  referredByAffiliateId: z.string().optional(),
  stripeAccountId: z.string().optional(),
  stripeOnboarded: z.boolean().optional(),
  commissionRate: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal').optional()
})

export const UpdateStoreInputSchema = z.object({
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  companyName: z.string().optional(),
  taxId: z.string().optional(),
  phone: z.string(),
  email: z.string(),
  website: z.string(),
  isPublished: z.boolean().optional(),
  deliveryEnabled: z.boolean().optional(),
  pickupEnabled: z.boolean().optional(),
  prepTimeMin: z.number().int().optional(),
  feesJson: z.record(z.unknown()).optional(),
  hoursJson: z.record(z.unknown()).optional(),
  deliveryDistance: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal').optional(),
  deliveryCharge: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal').optional(),
  latitude: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal').optional(),
  longitude: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal').optional(),
  addressStreet: z.string().optional(),
  addressCity: z.string().optional(),
  addressState: z.string().optional(),
  addressZip: z.string().optional(),
  addressCountry: z.string().optional(),
  geocodedAt: z.string().datetime().optional(),
  geocodeSource: z.string().optional(),
  referredByAffiliateId: z.string().optional(),
  stripeAccountId: z.string().optional(),
  stripeOnboarded: z.boolean().optional(),
  commissionRate: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal').optional()
}).refine(data => Object.keys(data).length > 0, 'At least one field must be provided')

export const StoreResponseSchema = z.object({
  owner: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  companyName: z.string().nullable(),
  taxId: z.string().nullable(),
  phone: z.string(),
  email: z.string(),
  website: z.string(),
  isPublished: z.boolean().nullable(),
  deliveryEnabled: z.boolean().nullable(),
  pickupEnabled: z.boolean().nullable(),
  prepTimeMin: z.number().int().nullable(),
  feesJson: z.record(z.unknown()).nullable(),
  hoursJson: z.record(z.unknown()).nullable(),
  deliveryDistance: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal').nullable(),
  deliveryCharge: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal').nullable(),
  deliveryZones: z.string(),
  latitude: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal').nullable(),
  longitude: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal').nullable(),
  addressStreet: z.string().nullable(),
  addressCity: z.string().nullable(),
  addressState: z.string().nullable(),
  addressZip: z.string().nullable(),
  addressCountry: z.string().nullable(),
  geocodedAt: z.string().datetime().nullable(),
  geocodeSource: z.string().nullable(),
  referredByAffiliateId: z.string().nullable(),
  referredByAffiliate: z.string().nullable(),
  stripeAccountId: z.string().nullable(),
  stripeOnboarded: z.boolean().nullable(),
  commissionRate: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal').nullable(),
  media: z.string(),
  items: z.string(),
  orders: z.string(),
  carts: z.string(),
  posts: z.string(),
  bundles: z.string(),
  teamMembers: z.string(),
  invitations: z.string(),
  Promotion: z.string(),
  FavoriteStore: z.string()
})

export const StoreListResponseSchema = z.object({
  data: z.array(StoreResponseSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
})

export const StoreQuerySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('20'),
}).passthrough().transform(data => ({
  page: data.page,
  limit: data.limit,
  filters: Object.keys(data)
    .filter(k => k !== 'page' && k !== 'limit' && (data as any)[k] !== undefined)
    .reduce((acc, k) => ({ ...acc, [k]: (data as any)[k] }), {}),
  orderBy: { createdAt: 'desc' },
}))



// Type exports
export type CreateStoreInput = z.infer<typeof CreateStoreInputSchema>
export type UpdateStoreInput = z.infer<typeof UpdateStoreInputSchema>
export type StoreResponse = z.infer<typeof StoreResponseSchema>
export type StoreListResponse = z.infer<typeof StoreListResponseSchema>
export type StoreQuery = z.infer<typeof StoreQuerySchema>
