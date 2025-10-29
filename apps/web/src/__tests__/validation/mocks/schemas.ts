/**
 * Mock Schemas for Testing
 * Provides mock implementations of schemas when @packages/schemas is not available
 */

import { z } from 'zod'

// Mock schemas that match the expected structure
export const StoreResponseSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().length(2, 'State must be 2 characters'),
  postalCode: z.string().regex(/^\d{5}$/, 'Postal code must be 5 digits'),
  phone: z.string().optional(),
  email: z.string().email('Invalid email'),
  isActive: z.boolean(),
  deliveryFee: z.number().min(0, 'Delivery fee must be positive'),
  minimumOrder: z.number().min(0, 'Minimum order must be positive'),
  commissionRate: z.number().min(0).max(1, 'Commission rate must be between 0 and 1'),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  ownerId: z.string()
})

export const CreateStoreInputSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().length(2, 'State must be 2 characters'),
  postalCode: z.string().regex(/^\d{5}$/, 'Postal code must be 5 digits'),
  phone: z.string().optional(),
  email: z.string().email('Invalid email'),
  deliveryFee: z.number().min(0, 'Delivery fee must be positive'),
  minimumOrder: z.number().min(0, 'Minimum order must be positive'),
  commissionRate: z.number().min(0).max(1, 'Commission rate must be between 0 and 1')
})

export const UpdateStoreInputSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().optional(),
  address: z.string().min(1, 'Address is required').optional(),
  city: z.string().min(1, 'City is required').optional(),
  state: z.string().length(2, 'State must be 2 characters').optional(),
  postalCode: z.string().regex(/^\d{5}$/, 'Postal code must be 5 digits').optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional(),
  isActive: z.boolean().optional(),
  deliveryFee: z.number().min(0, 'Delivery fee must be positive').optional(),
  minimumOrder: z.number().min(0, 'Minimum order must be positive').optional(),
  commissionRate: z.number().min(0).max(1, 'Commission rate must be between 0 and 1').optional()
})

export const ItemResponseSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  price: z.number().min(0, 'Price must be positive'),
  stockQty: z.number().int().min(0, 'Stock quantity must be non-negative'),
  isActive: z.boolean(),
  storeId: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
})

export const CreateItemInputSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  price: z.number().min(0, 'Price must be positive'),
  stockQty: z.number().int().min(0, 'Stock quantity must be non-negative'),
  storeId: z.string()
})

export const UpdateItemInputSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().optional(),
  price: z.number().min(0, 'Price must be positive').optional(),
  stockQty: z.number().int().min(0, 'Stock quantity must be non-negative').optional(),
  isActive: z.boolean().optional()
})

export const OrderResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  storeId: z.string(),
  status: z.enum(['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED']),
  subtotal: z.number().min(0),
  tax: z.number().min(0),
  deliveryFee: z.number().min(0),
  total: z.number().min(0),
  deliveryType: z.enum(['PICKUP', 'DELIVERY']),
  addressSnapshot: z.object({
    line1: z.string(),
    line2: z.string().optional(),
    city: z.string(),
    state: z.string(),
    postalCode: z.string()
  }).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
})

export const CreateOrderInputSchema = z.object({
  storeId: z.string(),
  deliveryType: z.enum(['PICKUP', 'DELIVERY']),
  addressId: z.string().optional(),
  items: z.array(z.object({
    itemId: z.string(),
    quantity: z.number().int().min(1),
    unitPrice: z.number().min(0)
  }))
})

export const CartResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  storeId: z.string(),
  items: z.array(z.object({
    id: z.string(),
    itemId: z.string(),
    quantity: z.number().int().min(1),
    unitPrice: z.number().min(0),
    totalPrice: z.number().min(0)
  })),
  subtotal: z.number().min(0),
  tax: z.number().min(0),
  deliveryFee: z.number().min(0),
  total: z.number().min(0),
  status: z.enum(['ACTIVE', 'ABANDONED', 'COMPLETED']),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
}).refine((data) => {
  // Validate that total equals subtotal + tax + deliveryFee
  const calculatedTotal = data.subtotal + data.tax + data.deliveryFee
  return Math.abs(data.total - calculatedTotal) < 0.01 // Allow for small floating point differences
}, {
  message: "Total must equal subtotal + tax + deliveryFee",
  path: ["total"]
})

export const AddToCartInputSchema = z.object({
  itemId: z.string(),
  quantity: z.number().int().min(1, 'Quantity must be at least 1')
})

export const UpdateCartInputSchema = z.object({
  quantity: z.number().int().min(1, 'Quantity must be at least 1')
})

export const AddressResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  line1: z.string().min(1, 'Address line 1 is required'),
  line2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().length(2, 'State must be 2 characters'),
  postalCode: z.string().regex(/^\d{5}$/, 'Postal code must be 5 digits'),
  country: z.string().length(2, 'Country must be 2 characters').default('US'),
  isDefault: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
})

export const CreateAddressInputSchema = z.object({
  line1: z.string().min(1, 'Address line 1 is required'),
  line2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().length(2, 'State must be 2 characters'),
  postalCode: z.string().regex(/^\d{5}$/, 'Postal code must be 5 digits'),
  country: z.string().length(2, 'Country must be 2 characters').default('US'),
  isDefault: z.boolean().default(false)
})

export const UpdateAddressInputSchema = z.object({
  line1: z.string().min(1, 'Address line 1 is required').optional(),
  line2: z.string().optional(),
  city: z.string().min(1, 'City is required').optional(),
  state: z.string().length(2, 'State must be 2 characters').optional(),
  postalCode: z.string().regex(/^\d{5}$/, 'Postal code must be 5 digits').optional(),
  country: z.string().length(2, 'Country must be 2 characters').optional(),
  isDefault: z.boolean().optional()
})

export const BundleResponseSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  isActive: z.boolean(),
  sortIndex: z.number().int().optional(),
  pricing: z.object({
    type: z.enum(['FIXED_PRICE', 'DISCOUNT_PERCENT', 'DISCOUNT_AMOUNT', 'BEST_DEAL']),
    value: z.number().min(0)
  }),
  items: z.array(z.object({
    itemId: z.string(),
    quantity: z.number().int().min(1),
    sortIndex: z.number().int().optional()
  })),
  storeId: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
})

export const CreateBundleInputSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  pricing: z.object({
    type: z.enum(['FIXED_PRICE', 'DISCOUNT_PERCENT', 'DISCOUNT_AMOUNT', 'BEST_DEAL']),
    value: z.number().min(0)
  }),
  items: z.array(z.object({
    itemId: z.string(),
    quantity: z.number().int().min(1),
    sortIndex: z.number().int().optional()
  })),
  storeId: z.string()
})

export const UpdateBundleInputSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  sortIndex: z.number().int().optional(),
  pricing: z.object({
    type: z.enum(['FIXED_PRICE', 'DISCOUNT_PERCENT', 'DISCOUNT_AMOUNT', 'BEST_DEAL']),
    value: z.number().min(0)
  }).optional(),
  items: z.array(z.object({
    itemId: z.string(),
    quantity: z.number().int().min(1),
    sortIndex: z.number().int().optional()
  })).optional()
})

export const PromotionResponseSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
  discountValue: z.number().min(0),
  isActive: z.boolean(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  storeId: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
})

export const CreatePromotionInputSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
  discountValue: z.number().min(0),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  storeId: z.string()
})

export const UpdatePromotionInputSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().optional(),
  discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']).optional(),
  discountValue: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
})

export const UserPublicResponseSchema = z.object({
  id: z.string(),
  email: z.string().email('Invalid email'),
  name: z.string().nullable(),
  phone: z.string().nullable(),
  role: z.enum(['USER', 'VENDOR', 'ADMIN', 'AFFILIATE', 'RIDER', 'STAFF']),
  isCompany: z.boolean(),
  companyName: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
})

export const AuthResponseSchema = z.object({
  user: z.object({
    id: z.string(),
    email: z.string().email(),
    name: z.string().optional(),
    role: z.enum(['USER', 'VENDOR', 'ADMIN', 'AFFILIATE', 'RIDER', 'STAFF'])
  }),
  token: z.string()
})

export const LoginInputSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required')
})

export const SignupInputSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().optional()
})

export const CreatePaymentIntentInputSchema = z.object({
  amount: z.number().int().min(1, 'Amount must be positive'),
  currency: z.string().length(3, 'Currency must be 3 characters').default('usd'),
  orderId: z.string().optional()
})

export const PaymentIntentResponseSchema = z.object({
  id: z.string(),
  amount: z.number().int().min(1),
  currency: z.string(),
  status: z.string(),
  clientSecret: z.string(),
  createdAt: z.string().datetime()
})

export const CreateTipInputSchema = z.object({
  orderId: z.string(),
  amount: z.number().min(0, 'Amount must be non-negative')
})

export const UpdateTipInputSchema = z.object({
  amount: z.number().min(0, 'Amount must be non-negative').optional(),
  status: z.enum(['PENDING', 'COMPLETED', 'FAILED']).optional()
})

export const TipResponseSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  amount: z.number().min(0),
  status: z.enum(['PENDING', 'COMPLETED', 'FAILED']),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
})

export const UploadMediaInputSchema = z.object({
  filename: z.string().min(1, 'Filename is required'),
  mimeType: z.string().min(1, 'MIME type is required'),
  size: z.number().int().min(1, 'Size must be positive')
})

export const MediaResponseSchema = z.object({
  id: z.string(),
  url: z.string().url('Invalid URL'),
  filename: z.string(),
  mimeType: z.string(),
  size: z.number().int().min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
})

export const PostResponseSchema = z.object({
  id: z.string(),
  storeId: z.string(),
  content: z.string().nullable(),
  mediaUrls: z.array(z.string().url()),
  likesCount: z.number().int().min(0).nullable(),
  commentsCount: z.number().int().min(0).nullable(),
  sharesCount: z.number().int().min(0).nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
})

export const CommentResponseSchema = z.object({
  id: z.string(),
  postId: z.string(),
  userId: z.string(),
  content: z.string().min(1, 'Content is required'),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
})
