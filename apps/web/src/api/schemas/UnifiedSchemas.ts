/**
 * Unified Schemas - Uses Generated Schemas from @packages/schemas
 * This replaces the manual schemas in apps/web/src/api/schemas.ts
 */

import { z } from 'zod'

// Re-export all schemas from the packages/schemas
export * from '@packages/schemas'

// Legacy compatibility - map old schema names to new ones
// This provides backward compatibility for existing code that uses the schemas object
import {
  StoreResponseSchema,
  CreateStoreInputSchema,
  UpdateStoreInputSchema,
  ItemResponseSchema,
  CreateItemInputSchema,
  UpdateItemInputSchema,
  OrderResponseSchema,
  CreateOrderInputSchema,
  CartResponseSchema,
  AddToCartInputSchema,
  UpdateCartInputSchema,
  AddressResponseSchema,
  CreateAddressInputSchema,
  UpdateAddressInputSchema,
  BundleResponseSchema,
  CreateBundleInputSchema,
  UpdateBundleInputSchema,
  PromotionResponseSchema,
  CreatePromotionInputSchema,
  UpdatePromotionInputSchema,
  UserPublicResponseSchema,
  AuthResponseSchema,
  LoginInputSchema,
  SignupInputSchema,
  CreatePaymentIntentInputSchema,
  PaymentIntentResponseSchema,
  CreateTipInputSchema,
  UpdateTipInputSchema,
  TipResponseSchema,
  UploadMediaInputSchema,
  MediaResponseSchema,
  PostResponseSchema,
  CommentResponseSchema
} from '@packages/schemas'

export const schemas = {
  // Auth
  login: LoginInputSchema,
  signup: SignupInputSchema,
  authResponse: AuthResponseSchema,
  user: UserPublicResponseSchema,

  // Store
  store: StoreResponseSchema,
  createStore: CreateStoreInputSchema,
  updateStore: UpdateStoreInputSchema,

  // Item
  item: ItemResponseSchema,
  createItem: CreateItemInputSchema,
  updateItem: UpdateItemInputSchema,

  // Order
  order: OrderResponseSchema,
  createOrder: CreateOrderInputSchema,

  // Cart
  cart: CartResponseSchema,
  addCartItem: AddToCartInputSchema,
  updateCartItem: UpdateCartInputSchema,

  // Address
  address: AddressResponseSchema,
  createAddress: CreateAddressInputSchema,
  updateAddress: UpdateAddressInputSchema,

  // Bundle
  bundle: BundleResponseSchema,
  createBundle: CreateBundleInputSchema,
  updateBundle: UpdateBundleInputSchema,

  // Promotion
  promotion: PromotionResponseSchema,
  createPromotion: CreatePromotionInputSchema,
  updatePromotion: UpdatePromotionInputSchema,

  // Payment
  paymentIntent: PaymentIntentResponseSchema,
  createPaymentIntent: CreatePaymentIntentInputSchema,

  // Tip
  tip: TipResponseSchema,
  createTip: CreateTipInputSchema,
  updateTip: UpdateTipInputSchema,

  // Media
  mediaUpload: MediaResponseSchema,
  mediaUploadMetadata: UploadMediaInputSchema,

  // Post & Comment (River features)
  post: PostResponseSchema,
  comment: CommentResponseSchema,
  media: MediaResponseSchema,

  // Additional schemas for complete coverage
  forgotPassword: z.string().email().optional(),
  resetPassword: z.string().min(8).optional(),
  createUser: z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().optional(),
    phone: z.string().optional(),
  }).optional(),
  updateUser: z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional(),
  }).optional(),
} as const

// ============================================
// Type Exports for Frontend Usage
// ============================================

// Re-export types that are commonly used in the frontend
// NOTE: These are now defined locally in api/types.ts due to module resolution issues
// export type {
//   PostResponse,
//   CommentResponse,
//   MediaResponse,
//   BundlePricingType
// } from '../../../../packages/schemas/dist/packages/schemas/src'