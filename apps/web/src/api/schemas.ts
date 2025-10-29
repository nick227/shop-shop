/**
 * DEPRECATED: Manual Zod Schemas for API Validation
 * 
 * ⚠️  DEPRECATED - Use UnifiedSchemas instead
 * This file is kept for backward compatibility only
 * 
 * @deprecated Use './schemas/UnifiedSchemas' for new code
 * @see ./schemas/UnifiedSchemas.ts
 */

import { z } from 'zod'

// ============================================
// Base Schemas
// ============================================

export const IdSchema = z.string().min(1, 'ID is required')
export const EmailSchema = z.string().email('Invalid email format')
export const PhoneSchema = z.string().regex(/^\+?[\d\s()\-]+$/, 'Invalid phone format')
export const UrlSchema = z.string().url('Invalid URL format')
export const DateStringSchema = z.string().datetime('Invalid date format')

// ============================================
// Store Schemas
// ============================================

export const StoreSchema = z.object({
  id: IdSchema,
  name: z.string().min(1, 'Store name is required'),
  description: z.string().optional(),
  address: z.string().min(1, 'Address is required'),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  phone: PhoneSchema.optional(),
  email: EmailSchema.optional(),
  website: UrlSchema.optional(),
  isActive: z.boolean().default(true),
  deliveryFee: z.number().min(0).default(0),
  minOrder: z.number().min(0).default(0),
  media: z.array(z.object({
    id: IdSchema,
    url: UrlSchema,
    kind: z.enum(['image', 'video', 'document', 'audio']),
    filename: z.string(),
    size: z.number().positive(),
    mimeType: z.string(),
    createdAt: DateStringSchema,
    updatedAt: DateStringSchema,
    thumbnail: UrlSchema.optional(),
    altText: z.string().optional(),
    width: z.number().positive().optional(),
    height: z.number().positive().optional(),
  })).default([]),
  createdAt: DateStringSchema.optional(),
  updatedAt: DateStringSchema.optional(),
})

export const CreateStoreSchema = StoreSchema.omit({ id: true, createdAt: true, updatedAt: true })
export const UpdateStoreSchema = CreateStoreSchema.partial()

// ============================================
// Item Schemas
// ============================================

export const ItemSchema = z.object({
  id: IdSchema,
  storeId: IdSchema,
  name: z.string().min(1, 'Item name is required'),
  description: z.string().optional(),
  price: z.number().positive('Price must be positive'),
  category: z.string().optional(),
  isActive: z.boolean().default(true),
  imageUrl: UrlSchema.optional(),
  options: z.array(z.object({
    id: IdSchema,
    name: z.string().min(1, 'Option name is required'),
    type: z.enum(['single', 'multiple']),
    required: z.boolean().default(false),
    choices: z.array(z.object({
      id: IdSchema,
      name: z.string().min(1, 'Choice name is required'),
      price: z.number().min(0).default(0),
    })),
  })).default([]),
  createdAt: DateStringSchema.optional(),
  updatedAt: DateStringSchema.optional(),
})

export const CreateItemSchema = ItemSchema.omit({ id: true, createdAt: true, updatedAt: true })
export const UpdateItemSchema = CreateItemSchema.partial()

// ============================================
// Order Schemas
// ============================================

export const OrderItemSchema = z.object({
  id: IdSchema,
  itemId: IdSchema,
  quantity: z.number().int().positive('Quantity must be positive'),
  unitPrice: z.number().positive('Unit price must be positive'),
  titleSnapshot: z.string().min(1, 'Item title is required'),
  optionsSnapshot: z.record(z.unknown()).optional(),
})

export const OrderSchema = z.object({
  id: IdSchema,
  userId: IdSchema,
  storeId: IdSchema,
  status: z.enum(['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED']),
  deliveryType: z.enum(['DELIVERY', 'PICKUP']),
  addressId: IdSchema.optional(),
  items: z.array(OrderItemSchema).min(1, 'Order must have at least one item'),
  subtotal: z.number().min(0),
  tax: z.number().min(0),
  deliveryFee: z.number().min(0),
  tip: z.number().min(0).optional(),
  total: z.number().positive('Total must be positive'),
  notes: z.string().optional(),
  stripePaymentIntentId: z.string().nullable(),
  stripeChargeId: z.string().nullable(),
  createdAt: DateStringSchema.optional(),
  updatedAt: DateStringSchema.optional(),
})

export const CreateOrderSchema = z.object({
  cartId: IdSchema,
  deliveryType: z.enum(['DELIVERY', 'PICKUP']),
  addressId: IdSchema.optional(),
  tip: z.string().optional(),
})

// ============================================
// Address Schemas
// ============================================

export const AddressSchema = z.object({
  id: IdSchema,
  userId: IdSchema,
  street: z.string().min(1, 'Street address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zipCode: z.string().min(1, 'ZIP code is required'),
  country: z.string().default('US'),
  apartmentNumber: z.string().optional(),
  instructions: z.string().optional(),
  isDefault: z.boolean().default(false),
  createdAt: DateStringSchema.optional(),
  updatedAt: DateStringSchema.optional(),
})

export const CreateAddressSchema = AddressSchema.omit({ id: true, userId: true, createdAt: true, updatedAt: true })
export const UpdateAddressSchema = CreateAddressSchema.partial()

// ============================================
// Bundle Schemas
// ============================================

export const BundleItemSchema = z.object({
  itemId: IdSchema,
  quantity: z.number().int().positive('Quantity must be positive'),
  sortIndex: z.number().int().min(0).optional(),
})

export const BundlePricingSchema = z.object({
  pricingType: z.enum(['FIXED_PRICE', 'DISCOUNT_PERCENT', 'DISCOUNT_AMOUNT', 'BEST_DEAL']),
  fixedPrice: z.number().positive().optional(),
  discountPercent: z.number().min(0).max(100).optional(),
  discountAmount: z.number().min(0).optional(),
  minSavings: z.number().min(0).optional(),
  showSavings: z.boolean().default(true),
  savingsLabel: z.string().optional(),
})

export const BundleSchema = z.object({
  id: IdSchema,
  storeId: IdSchema,
  name: z.string().min(1, 'Bundle name is required'),
  description: z.string().optional(),
  imageUrl: UrlSchema.optional(),
  isActive: z.boolean().default(true),
  sortIndex: z.number().int().min(0).optional(),
  items: z.array(BundleItemSchema).min(1, 'Bundle must have at least one item'),
  pricing: BundlePricingSchema,
  createdAt: DateStringSchema.optional(),
  updatedAt: DateStringSchema.optional(),
})

export const CreateBundleSchema = BundleSchema.omit({ id: true, createdAt: true, updatedAt: true })
export const UpdateBundleSchema = CreateBundleSchema.partial()

// ============================================
// Cart Schemas
// ============================================

export const CartItemSchema = z.object({
  id: IdSchema,
  itemId: IdSchema,
  quantity: z.number().int().positive('Quantity must be positive'),
  options: z.record(z.unknown()).optional(),
  notes: z.string().optional(),
})

export const CartWithTotalsSchema = z.object({
  id: IdSchema,
  userId: IdSchema,
  items: z.array(CartItemSchema).default([]),
  itemCount: z.number().int().min(0).default(0),
  subtotal: z.number().min(0).default(0),
  tax: z.number().min(0).default(0),
  deliveryFee: z.number().min(0).default(0),
  fees: z.number().min(0).default(0),
  total: z.number().min(0).default(0),
  createdAt: DateStringSchema.optional(),
  updatedAt: DateStringSchema.optional(),
})

export const AddCartItemSchema = z.object({
  itemId: IdSchema,
  quantity: z.number().int().positive('Quantity must be positive'),
  options: z.record(z.unknown()).optional(),
  notes: z.string().optional(),
})

export const UpdateCartItemSchema = z.object({
  quantity: z.number().int().positive('Quantity must be positive'),
  options: z.record(z.unknown()).optional(),
  notes: z.string().optional(),
})

// ============================================
// Promotion Schemas
// ============================================

export const PromotionSchema = z.object({
  id: IdSchema,
  name: z.string().min(1, 'Promotion name is required'),
  description: z.string().optional(),
  code: z.string().optional(),
  type: z.enum(['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING']),
  value: z.number().positive('Value must be positive'),
  minOrderAmount: z.number().min(0).optional(),
  maxDiscountAmount: z.number().min(0).optional(),
  startDate: DateStringSchema,
  endDate: DateStringSchema,
  isActive: z.boolean().default(true),
  usageLimit: z.number().int().positive().optional(),
  storeId: IdSchema.optional(),
  createdAt: DateStringSchema.optional(),
  updatedAt: DateStringSchema.optional(),
})

export const CreatePromotionSchema = PromotionSchema.omit({ id: true, createdAt: true, updatedAt: true })
export const UpdatePromotionSchema = CreatePromotionSchema.partial()

// ============================================
// User Schemas
// ============================================

export const UserSchema = z.object({
  id: IdSchema,
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: EmailSchema,
  phone: PhoneSchema.optional(),
  avatar: UrlSchema.optional(),
  role: z.enum(['CUSTOMER', 'STORE_OWNER', 'ADMIN']).default('CUSTOMER'),
  isActive: z.boolean().default(true),
  preferences: z.record(z.unknown()).optional(),
  createdAt: DateStringSchema.optional(),
  updatedAt: DateStringSchema.optional(),
})

export const CreateUserSchema = UserSchema.omit({ id: true, createdAt: true, updatedAt: true })
export const UpdateUserSchema = CreateUserSchema.partial()

// ============================================
// Auth Schemas
// ============================================

export const LoginSchema = z.object({
  email: EmailSchema,
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().default(false),
})

export const SignupSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: EmailSchema,
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: PhoneSchema.optional(),
  acceptTerms: z.boolean().refine(val => val === true, 'You must accept the terms and conditions'),
})

export const AuthResponseSchema = z.object({
  id: IdSchema,
  user: UserSchema,
  token: z.string().min(1, 'Token is required'),
  refreshToken: z.string().min(1, 'Refresh token is required'),
  expiresAt: DateStringSchema,
  createdAt: DateStringSchema.optional(),
  updatedAt: DateStringSchema.optional(),
})

export const ForgotPasswordSchema = z.object({
  email: EmailSchema,
})

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
})

// ============================================
// Media Schemas
// ============================================

export const MediaUploadResponseSchema = z.object({
  id: IdSchema,
  url: UrlSchema,
  kind: z.enum(['image', 'video', 'document', 'audio']),
  filename: z.string().min(1, 'Filename is required'),
  size: z.number().positive('File size must be positive'),
  mimeType: z.string().min(1, 'MIME type is required'),
  createdAt: DateStringSchema,
  updatedAt: DateStringSchema,
  thumbnail: UrlSchema.optional(),
  altText: z.string().optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
})

export const MediaUploadMetadataSchema = z.object({
  altText: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

// ============================================
// Payment Schemas
// ============================================

export const PaymentIntentResponseSchema = z.object({
  id: IdSchema,
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3, 'Currency must be 3 characters').default('USD'),
  status: z.enum(['PENDING', 'SUCCEEDED', 'CANCELLED', 'FAILED']),
  clientSecret: z.string().optional(),
  paymentMethodId: z.string().optional(),
  orderId: IdSchema.optional(),
  createdAt: DateStringSchema.optional(),
  updatedAt: DateStringSchema.optional(),
})

export const CreatePaymentIntentSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3).default('USD'),
  orderId: IdSchema.optional(),
  paymentMethodId: z.string().optional(),
})

// ============================================
// Tip Schemas
// ============================================

export const TipSchema = z.object({
  id: IdSchema,
  orderId: IdSchema,
  amount: z.number().positive('Tip amount must be positive'),
  message: z.string().optional(),
  createdAt: DateStringSchema.optional(),
  updatedAt: DateStringSchema.optional(),
})

export const CreateTipSchema = z.object({
  orderId: IdSchema,
  amount: z.number().positive('Tip amount must be positive'),
  message: z.string().optional(),
})

export const UpdateTipSchema = z.object({
  amount: z.number().positive('Tip amount must be positive'),
  message: z.string().optional(),
})

// ============================================
// List Response Schemas
// ============================================

export const ListResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    data: z.array(itemSchema),
    total: z.number().int().min(0),
    page: z.number().int().min(1),
    limit: z.number().int().min(1),
  })

// ============================================
// Export all schemas
// ============================================

export const schemas = {
  // Base
  id: IdSchema,
  email: EmailSchema,
  phone: PhoneSchema,
  url: UrlSchema,
  dateString: DateStringSchema,

  // Store
  store: StoreSchema,
  createStore: CreateStoreSchema,
  updateStore: UpdateStoreSchema,

  // Item
  item: ItemSchema,
  createItem: CreateItemSchema,
  updateItem: UpdateItemSchema,

  // Order
  order: OrderSchema,
  orderItem: OrderItemSchema,
  createOrder: CreateOrderSchema,

  // Address
  address: AddressSchema,
  createAddress: CreateAddressSchema,
  updateAddress: UpdateAddressSchema,

  // Bundle
  bundle: BundleSchema,
  bundleItem: BundleItemSchema,
  bundlePricing: BundlePricingSchema,
  createBundle: CreateBundleSchema,
  updateBundle: UpdateBundleSchema,

  // Cart
  cart: CartWithTotalsSchema,
  cartItem: CartItemSchema,
  addCartItem: AddCartItemSchema,
  updateCartItem: UpdateCartItemSchema,

  // Promotion
  promotion: PromotionSchema,
  createPromotion: CreatePromotionSchema,
  updatePromotion: UpdatePromotionSchema,

  // User
  user: UserSchema,
  createUser: CreateUserSchema,
  updateUser: UpdateUserSchema,

  // Auth
  login: LoginSchema,
  signup: SignupSchema,
  authResponse: AuthResponseSchema,
  forgotPassword: ForgotPasswordSchema,
  resetPassword: ResetPasswordSchema,

  // Media
  mediaUpload: MediaUploadResponseSchema,
  mediaUploadMetadata: MediaUploadMetadataSchema,

  // Payment
  paymentIntent: PaymentIntentResponseSchema,
  createPaymentIntent: CreatePaymentIntentSchema,

  // Tip
  tip: TipSchema,
  createTip: CreateTipSchema,
  updateTip: UpdateTipSchema,

  // List responses
  listResponse: ListResponseSchema,
} as const
