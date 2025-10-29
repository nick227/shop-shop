/**
 * Mock Unified Schemas for Testing
 * Provides mock implementations when @packages/schemas is not available
 */

import { z } from 'zod'
import * as mockSchemas from './schemas'

// Re-export all mock schemas
export * from './schemas'

// Create schemas object for backward compatibility
export const schemas = {
  // Auth
  login: mockSchemas.LoginInputSchema,
  signup: mockSchemas.SignupInputSchema,
  authResponse: mockSchemas.AuthResponseSchema,
  user: mockSchemas.UserPublicResponseSchema,

  // Store
  store: mockSchemas.StoreResponseSchema,
  createStore: mockSchemas.CreateStoreInputSchema,
  updateStore: mockSchemas.UpdateStoreInputSchema,

  // Item
  item: mockSchemas.ItemResponseSchema,
  createItem: mockSchemas.CreateItemInputSchema,
  updateItem: mockSchemas.UpdateItemInputSchema,

  // Order
  order: mockSchemas.OrderResponseSchema,
  createOrder: mockSchemas.CreateOrderInputSchema,

  // Cart
  cart: mockSchemas.CartResponseSchema,
  addCartItem: mockSchemas.AddToCartInputSchema,
  updateCartItem: mockSchemas.UpdateCartInputSchema,

  // Address
  address: mockSchemas.AddressResponseSchema,
  createAddress: mockSchemas.CreateAddressInputSchema,
  updateAddress: mockSchemas.UpdateAddressInputSchema,

  // Bundle
  bundle: mockSchemas.BundleResponseSchema,
  createBundle: mockSchemas.CreateBundleInputSchema,
  updateBundle: mockSchemas.UpdateBundleInputSchema,

  // Promotion
  promotion: mockSchemas.PromotionResponseSchema,
  createPromotion: mockSchemas.CreatePromotionInputSchema,
  updatePromotion: mockSchemas.UpdatePromotionInputSchema,

  // Payment
  paymentIntent: mockSchemas.PaymentIntentResponseSchema,
  createPaymentIntent: mockSchemas.CreatePaymentIntentInputSchema,

  // Tip
  tip: mockSchemas.TipResponseSchema,
  createTip: mockSchemas.CreateTipInputSchema,
  updateTip: mockSchemas.UpdateTipInputSchema,

  // Media
  mediaUpload: mockSchemas.MediaResponseSchema,
  mediaUploadMetadata: mockSchemas.UploadMediaInputSchema,

  // Post & Comment (River features)
  post: mockSchemas.PostResponseSchema,
  comment: mockSchemas.CommentResponseSchema,
  media: mockSchemas.MediaResponseSchema,

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
