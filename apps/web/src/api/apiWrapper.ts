/**
 * API Wrapper with Type Validation
 * ⚠️  AUTO-GENERATED - DO NOT EDIT MANUALLY
 * Generated from: SDK API classes
 * 
 * To regenerate: pnpm gen:wrapper
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import { apiClient } from './client'
import type { 
  StoreResponse as Store, 
  ItemResponse as Item, 
  CartWithTotals,
  OrderResponse as Order,
  AddressResponse as Address,
  Bundle,
} from './backend-types'

export interface CreateOrderInput {
  cartId: string
  deliveryType: 'DELIVERY' | 'PICKUP'
  addressId?: string
  tip?: string
}

export interface CreatePostInput {
  storeId: string
  content: string
  mediaUrls?: string[]
}

export interface CreateAddressInput {
  street: string
  city: string
  state: string
  zipCode: string
  country?: string
  apartmentNumber?: string
  instructions?: string
}

export interface AddCartItemInput {
  itemId: string
  quantity: number
  options?: Record<string, unknown>
  notes?: string
}

export interface UpdateCartItemInput {
  quantity: number
  options?: Record<string, unknown>
  notes?: string
}

export interface CreateBundleInput {
  storeId: string
  name: string
  description?: string
  imageUrl?: string
  isActive?: boolean
  sortIndex?: number
  items: {
    itemId: string
    quantity: number
    sortIndex?: number
  }[]
  pricing: {
    pricingType: 'FIXED_PRICE' | 'DISCOUNT_PERCENT' | 'DISCOUNT_AMOUNT' | 'BEST_DEAL'
    fixedPrice?: number
    discountPercent?: number
    discountAmount?: number
    minSavings?: number
    showSavings?: boolean
    savingsLabel?: string
  }
}


/**
 * Custom error class for API errors
 */
export class APIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message)
    this.name = 'APIError'
  }
}

/**
 * Helper: Wrap API calls with comprehensive error handling
 * 
 * NOTE: Currently uses 'any' assertions for type conversion between SDK and frontend types.
 * Future improvement: Implement proper type mappers for better type safety.
 */
async function handleRequest<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    // Handle API errors
    if (error && typeof error === 'object' && 'message' in error) {
      const apiError = error as { message: string; status?: number; code?: string }
      console.error('API Error:', apiError.message)
      throw new APIError(apiError.message, apiError.status, apiError.code)
    }
    
    console.error('Unknown Error:', error)
    throw new Error('An unexpected error occurred')
  }
}


// ============================================
// Stores API
// ============================================
export const stores = {
  /**
   * List stores
   */
  list: async (params?: { page?: string; limit?: string }): Promise<Store[]> => {
    const response = await handleRequest(() =>
      apiClient.stores().listStores(params as any)
    )
    return (response as any).data ?? (response as any) as Store[]
  },

  /**
   * Get store by ID
   */
  getById: async (id: string): Promise<Store> => {
    const result = await handleRequest(() =>
      apiClient.stores().getStoreById({ id })
    )
    return result as any as Store
  },
}

// ============================================
// Items API
// ============================================
export const items = {
  /**
   * List items
   */
  list: async (params?: { page?: string; limit?: string }): Promise<Item[]> => {
    const response = await handleRequest(() =>
      apiClient.items().listItems(params as any)
    )
    return (response as any).data ?? (response as any) as Item[]
  },

  /**
   * Get item by ID
   */
  getById: async (id: string): Promise<Item> => {
    const result = await handleRequest(() =>
      apiClient.items().getItemById({ id })
    )
    return result as any as Item
  },
}

// ============================================
// Carts API
// ============================================
export const carts = {
  /**
   * List carts
   */
  list: async (): Promise<CartWithTotals[]> => {
    const response = await handleRequest(() =>
      apiClient.carts().listCarts()
    )
    return (response as any).data ?? (response as any) as CartWithTotals[]
  },

  /**
   * Get cart by ID
   */
  getById: async (id: string): Promise<CartWithTotals> => {
    const result = await handleRequest(() =>
      apiClient.carts().getCartById({ id })
    )
    return result as any as CartWithTotals
  },

  /**
   * Create new cart
   */
  create: async (input: AddCartItemInput): Promise<CartWithTotals> => {
    const result = await handleRequest(() =>
        apiClient.carts().createCart({
          createCartRequest: input as any
        })
    )
    return result as any as CartWithTotals
  },

  /**
   * Delete cart
   */
  delete: async (id: string): Promise<void> => {
    await handleRequest(() =>
      apiClient.carts().deleteCart({ id })
    )
  },
}

// ============================================
// Orders API
// ============================================
export const orders = {
  /**
   * List orders
   */
  list: async (): Promise<Order[]> => {
    const response = await handleRequest(() =>
      apiClient.orders().listOrders()
    )
    return (response as any).data ?? (response as any) as Order[]
  },

  /**
   * Get order by ID
   */
  getById: async (id: string): Promise<Order> => {
    const result = await handleRequest(() =>
      apiClient.orders().getOrderById({ id })
    )
    return result as any as Order
  },

  /**
   * Create new order
   */
  create: async (input: CreateOrderInput): Promise<Order> => {
    const result = await handleRequest(() =>
        apiClient.orders().createOrder({
          createOrderRequest: input as any
        })
    )
    return result as any as Order
  },

  /**
   * Update order status (vendor only)
   */
  update: async (id: string, status: string): Promise<Order> => {
    const result = await handleRequest(() =>
      apiClient.orders().updateOrder({
        id,
        updateOrderRequest: { status: status as any },
      })
    )
    return result as Order
  },
}

// ============================================
// Addresses API
// ============================================
export const addresses = {
  /**
   * List addresses
   */
  list: async (): Promise<Address[]> => {
    const response = await handleRequest(() =>
      apiClient.addresses().listAddresss()
    )
    return (response as any).data ?? (response as any) as Address[]
  },

  /**
   * Get addresse by ID
   */
  getById: async (id: string): Promise<Address> => {
    const result = await handleRequest(() =>
      apiClient.addresses().getAddressById({ id })
    )
    return result as any as Address
  },

  /**
   * Create new addresse
   */
  create: async (input: CreateAddressInput): Promise<Address> => {
    const result = await handleRequest(() =>
        apiClient.addresses().createAddress({
          createAddressRequest: input as any
        })
    )
    return result as any as Address
  },

  /**
   * Update addresse
   */
  update: async (id: string, input: CreateAddressInput): Promise<Address> => {
    const result = await handleRequest(() =>
        apiClient.addresses().updateAddress({
          id,
          updateAddressRequest: input as any
        })
    )
    return result as any as Address
  },

  /**
   * Delete addresse
   */
  delete: async (id: string): Promise<void> => {
    await handleRequest(() =>
      apiClient.addresses().deleteAddress({ id })
    )
  },
}

// ============================================
// Bundles API
// ============================================
export const bundles = {
  /**
   * List bundles
   */
  list: async (params?: { page?: string; limit?: string }): Promise<Bundle[]> => {
    const response = await handleRequest(() =>
      apiClient.bundles().listBundles(params as any)
    )
    return (response as any).data ?? (response as any) as Bundle[]
  },

  /**
   * Get bundle by ID
   */
  getById: async (id: string): Promise<Bundle> => {
    const result = await handleRequest(() =>
      apiClient.bundles().getBundleById({ id })
    )
    return result as any as Bundle
  },

  /**
   * Create new bundle
   */
  create: async (input: CreateBundleInput): Promise<Bundle> => {
    const result = await handleRequest(() =>
        apiClient.bundles().createBundle({
          createBundleRequest: input as any
        })
    )
    return result as any as Bundle
  },

  /**
   * Update bundle
   */
  update: async (id: string, input: CreateBundleInput): Promise<Bundle> => {
    const result = await handleRequest(() =>
        apiClient.bundles().updateBundle({
          id,
          updateBundleRequest: input as any
        })
    )
    return result as any as Bundle
  },

  /**
   * Delete bundle
   */
  delete: async (id: string): Promise<void> => {
    await handleRequest(() =>
      apiClient.bundles().deleteBundle({ id })
    )
  },
}

// ============================================
// Cart API (Custom - not fully in SDK)
// ============================================
const CART_NOT_IMPLEMENTED_ERROR = 'Cart API methods not yet in OpenAPI spec'

export const cart = {
  /**
   * Get active cart for current user
   * NOTE: This will be auto-generated when added to OpenAPI spec
   */
  getActive: async (): Promise<CartWithTotals> => {
    // Placeholder - SDK method doesn't exist yet
    await Promise.resolve() // Add await to satisfy linter
    throw new Error(CART_NOT_IMPLEMENTED_ERROR)
  },

  /**
   * Add item to cart
   */
  addItem: async (_input: AddCartItemInput): Promise<CartWithTotals> => {
    await Promise.resolve() // Add await to satisfy linter
    throw new Error(CART_NOT_IMPLEMENTED_ERROR)
  },

  /**
   * Update cart item
   */
  updateItem: async (_itemId: string, _input: UpdateCartItemInput): Promise<CartWithTotals> => {
    await Promise.resolve() // Add await to satisfy linter
    throw new Error(CART_NOT_IMPLEMENTED_ERROR)
  },

  /**
   * Remove item from cart
   */
  removeItem: async (_itemId: string): Promise<CartWithTotals> => {
    await Promise.resolve() // Add await to satisfy linter
    throw new Error(CART_NOT_IMPLEMENTED_ERROR)
  },

  /**
   * Clear cart
   */
  clear: async (): Promise<CartWithTotals> => {
    await Promise.resolve() // Add await to satisfy linter
    throw new Error(CART_NOT_IMPLEMENTED_ERROR)
  },
}
