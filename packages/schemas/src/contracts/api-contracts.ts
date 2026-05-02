/**
 * API Contract Schemas - Clean API interfaces derived from Prisma DTOs
 * These define the actual API contracts used by frontend
 * Generated from: Prisma DTOs with business logic applied
 */

import { z } from 'zod'
import {
  OrderPlacementInputSchema,
  CreateAddressInputSchema as PrismaCreateAddressInputSchema,
  CreateBundleInputSchema as PrismaCreateBundleInputSchema,
  AddToCartInputSchema as PrismaAddToCartInputSchema,
  UpdateCartInputSchema as PrismaUpdateCartInputSchema,
} from '../dtos/index.js'

// ========================================
// API Contract Schemas (Frontend-focused)
// ========================================

// Order API contract — matches POST /orders placement body
export const CreateOrderContractSchema = OrderPlacementInputSchema

// Address API Contract - Field name mapping for frontend
export const CreateAddressContractSchema = z.object({
  street: z.string(),
  city: z.string(),
  state: z.string(),
  zipCode: z.string(),
  country: z.string().optional(),
  apartmentNumber: z.string().optional(),
  instructions: z.string().optional(),
})

// Bundle API Contract - Already aligned
export const CreateBundleContractSchema = PrismaCreateBundleInputSchema

// Cart API Contracts
export const AddCartItemContractSchema = z.object({
  itemId: z.string(),
  quantity: z.number().int().min(1),
  options: z.record(z.unknown()).optional(),
  notes: z.string().optional(),
})

export const UpdateCartItemContractSchema = z.object({
  quantity: z.number().int().min(1),
  options: z.record(z.unknown()).optional(),
  notes: z.string().optional(),
})

// ========================================
// Type Exports
// ========================================

export type CreateOrderContract = z.infer<typeof CreateOrderContractSchema>
export type CreateAddressContract = z.infer<typeof CreateAddressContractSchema>
export type CreateBundleContract = z.infer<typeof CreateBundleContractSchema>
export type AddCartItemContract = z.infer<typeof AddCartItemContractSchema>
export type UpdateCartItemContract = z.infer<typeof UpdateCartItemContractSchema>

// ========================================
// Schema Registry for API Contracts
// ========================================

export const apiContracts = {
  createOrder: CreateOrderContractSchema,
  createAddress: CreateAddressContractSchema,
  createBundle: CreateBundleContractSchema,
  addCartItem: AddCartItemContractSchema,
  updateCartItem: UpdateCartItemContractSchema,
} as const

// ========================================
// Validation Helpers
// ========================================

export function validateApiContract<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data)
  
  if (result.success) {
    return { success: true, data: result.data }
  }
  
  return {
    success: false,
    errors: result.error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
  }
}
