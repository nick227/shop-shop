/**
 * Validation Adapters
 * 
 * Zod schemas for API request/response validation.
 * Provides type safety at the API boundary.
 */

import { z } from 'zod'

// Store validation schemas
export const CreateStoreSchema = z.object({
  name: z.string().min(1, 'Store name is required'),
  description: z.string().optional(),
  address: z.string().min(1, 'Address is required'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
})

export const UpdateStoreSchema = CreateStoreSchema.partial()

// Item validation schemas
export const CreateItemSchema = z.object({
  name: z.string().min(1, 'Item name is required'),
  description: z.string().optional(),
  price: z.number().positive('Price must be positive'),
  storeId: z.string().min(1, 'Store ID is required'),
  category: z.string().optional(),
  imageUrl: z.string().url().optional(),
  inStock: z.boolean().default(true),
  quantity: z.number().int().min(0).default(0),
})

export const UpdateItemSchema = CreateItemSchema.partial()

// Bundle validation schemas
export const CreateBundleSchema = z.object({
  name: z.string().min(1, 'Bundle name is required'),
  description: z.string().optional(),
  price: z.number().positive('Price must be positive'),
  storeId: z.string().min(1, 'Store ID is required'),
  itemIds: z.array(z.string()).min(1, 'At least one item is required'),
  discount: z.number().min(0).max(1).optional(),
})

export const UpdateBundleSchema = CreateBundleSchema.partial()

// Cart validation schemas
export const AddCartItemSchema = z.object({
  itemId: z.string().min(1, 'Item ID is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  cartId: z.string().optional(),
})

export const UpdateCartItemSchema = z.object({
  quantity: z.number().int().min(0, 'Quantity cannot be negative'),
})

// Order validation schemas
export const CreateOrderSchema = z.object({
  cartId: z.string().min(1, 'Cart ID is required'),
  shippingAddress: z.string().min(1, 'Shipping address is required'),
  paymentMethod: z.string().min(1, 'Payment method is required'),
  notes: z.string().optional(),
})

export const UpdateOrderSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']).optional(),
  trackingNumber: z.string().optional(),
  notes: z.string().optional(),
})

// User validation schemas
export const UpdateUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
})

// Media validation schemas
export const CreateMediaSchema = z.object({
  file: z.instanceof(File),
  storeId: z.string().min(1, 'Store ID is required'),
  type: z.enum(['image', 'video']),
  alt: z.string().optional(),
})

// Promotion validation schemas
export const CreatePromotionSchema = z.object({
  name: z.string().min(1, 'Promotion name is required'),
  description: z.string().optional(),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.number().positive('Discount value must be positive'),
  storeId: z.string().min(1, 'Store ID is required'),
  startDate: z.date(),
  endDate: z.date(),
  minOrderAmount: z.number().positive().optional(),
})

export const UpdatePromotionSchema = CreatePromotionSchema.partial()

// Type exports
export type CreateStoreInput = z.infer<typeof CreateStoreSchema>
export type UpdateStoreInput = z.infer<typeof UpdateStoreSchema>
export type CreateItemInput = z.infer<typeof CreateItemSchema>
export type UpdateItemInput = z.infer<typeof UpdateItemSchema>
export type CreateBundleInput = z.infer<typeof CreateBundleSchema>
export type UpdateBundleInput = z.infer<typeof UpdateBundleSchema>
export type AddCartItemInput = z.infer<typeof AddCartItemSchema>
export type UpdateCartItemInput = z.infer<typeof UpdateCartItemSchema>
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>
export type UpdateOrderInput = z.infer<typeof UpdateOrderSchema>
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>
export type CreateMediaInput = z.infer<typeof CreateMediaSchema>
export type CreatePromotionInput = z.infer<typeof CreatePromotionSchema>
export type UpdatePromotionInput = z.infer<typeof UpdatePromotionSchema>
