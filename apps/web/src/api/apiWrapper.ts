/**
 * API Wrapper with Type Validation
 * ⚠️  AUTO-GENERATED - DO NOT EDIT MANUALLY
 * Generated from: SDK API classes
 * 
 * To regenerate: pnpm gen:wrapper
 */

import { apiClient } from './client'
import type { 
  Store, 
  Item, 
  CartWithTotals,
  OrderResponse as Order,
  AddressResponse as Address,
  RiverPost,
} from './types'
// Bundle types are not yet available in the SDK
type Bundle = any
type UpdateBundleInput = any

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
  items: Array<{
    itemId: string
    quantity: number
    sortIndex?: number
  }>
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

// Validators (pass-through for now, can add Zod validation later)
const validators = {
  store: (data: unknown) => data,
  storeList: (data: unknown) => data,
  item: (data: unknown) => data,
  itemList: (data: unknown) => data,
  cart: (data: unknown) => data,
  order: (data: unknown) => data,
  orderList: (data: unknown) => data,
  address: (data: unknown) => data,
  addressList: (data: unknown) => data,
  post: (data: unknown) => data,
  postList: (data: unknown) => data,
  bundle: (data: unknown) => data,
  bundleList: (data: unknown) => data,
}

// Helper: Wrap API calls with error handling
async function handleRequest<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    console.error('API Error:', error)
    throw error
  }
}

// ============================================
// Stores API
// ============================================
export const stores = {
  /**
   * List stores
   */
  list: async (params?: { latitude?: number; longitude?: number; radiusMiles?: number }): Promise<Store[]> => {
    const response = await handleRequest(() => apiClient.stores().listStores(params as any || {}))
    return validators.storeList((response as any).data || response) as Store[]
  },

  /**
   * Get single store by ID
   */
  getById: async (id: string): Promise<Store> => {
    const result = await handleRequest(() => apiClient.stores().getStoreById({ id }))
    return validators.store(result) as Store
  },
}

// ============================================
// Items API
// ============================================
export const items = {
  /**
   * List items
   */
  list: async (params?: { storeId?: string }): Promise<Item[]> => {
    const response = await handleRequest(() => apiClient.items().listItems(params as any || {}))
    return validators.itemList((response as any).data || response) as Item[]
  },

  /**
   * Get single item by ID
   */
  getById: async (id: string): Promise<Item> => {
    const result = await handleRequest(() => apiClient.items().getItemById({ id }))
    return validators.item(result) as Item
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
    const response = await handleRequest(() => apiClient.orders().listOrders({}))
    return validators.orderList((response as any).data || response) as Order[]
  },

  /**
   * Get single order by ID
   */
  getById: async (id: string): Promise<Order> => {
    const result = await handleRequest(() => apiClient.orders().getOrderById({ id }))
    return validators.order(result) as Order
  },

  /**
   * Create new order
   */
  create: async (input: CreateOrderInput): Promise<Order> => {
    const result = await handleRequest(() =>
      apiClient.orders().createOrder({ createOrderRequest: input as any })
    )
    return validators.order(result) as Order
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
    return validators.order(result) as Order
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
    const response = await handleRequest(() => apiClient.addresses().listAddresss({}))
    return validators.addressList((response as any).data || response) as Address[]
  },

  /**
   * Get single addresse by ID
   */
  getById: async (id: string): Promise<Address> => {
    const result = await handleRequest(() => apiClient.addresses().getAddressById({ id }))
    return validators.address(result) as Address
  },

  /**
   * Create new addresse
   */
  create: async (input: CreateAddressInput): Promise<Address> => {
    const result = await handleRequest(() =>
      apiClient.addresses().createAddress({ createAddressRequest: input as any })
    )
    return validators.address(result) as Address
  },

  /**
   * Update addresse
   */
  update: async (id: string, input: Partial<CreateAddressInput>): Promise<Address> => {
    const result = await handleRequest(() =>
      apiClient.addresses().updateAddress({ id, updateAddressRequest: input as any })
    )
    return validators.address(result) as Address
  },

  /**
   * Delete addresse
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.addresses().deleteAddress({ id })
  },
}

// ============================================
// Posts API
// ============================================
export const posts = {
  /**
   * List posts
   */
  list: async (params?: { storeId?: string; sortBy?: string; hasMedia?: string }): Promise<RiverPost[]> => {
    const response = await handleRequest(() => apiClient.posts().listPosts(params as any || {}))
    return validators.postList((response as any).data || response) as RiverPost[]
  },

  /**
   * Get single post by ID
   */
  getById: async (id: string): Promise<RiverPost> => {
    const result = await handleRequest(() => apiClient.posts().getPostById({ id }))
    return validators.post(result) as RiverPost
  },

  /**
   * Create new post
   */
  create: async (input: CreatePostInput): Promise<RiverPost> => {
    const result = await handleRequest(() =>
      apiClient.posts().createPost({ createPostRequest: input as any })
    )
    return validators.post(result) as RiverPost
  },

  /**
   * Update post
   */
  update: async (id: string, input: Partial<CreatePostInput>): Promise<RiverPost> => {
    const result = await handleRequest(() =>
      apiClient.posts().updatePost({ id, createPostRequest: input as any })
    )
    return validators.post(result) as RiverPost
  },

  /**
   * Delete post
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.posts().deletePost({ id })
  },
}

// ============================================
// Bundles API
// ============================================
export const bundles = {
  /**
   * List bundles
   */
  list: async (params?: { storeId?: string; isActive?: boolean; search?: string }): Promise<Bundle[]> => {
    const response = await handleRequest(() => apiClient.bundles().listBundles(params as any || {}))
    return validators.bundleList((response as any).data || response) as Bundle[]
  },

  /**
   * Get single bundle by ID
   */
  getById: async (id: string): Promise<Bundle> => {
    const result = await handleRequest(() => apiClient.bundles().getBundleById({ id }))
    return validators.bundle(result) as Bundle
  },

  /**
   * Create new bundle
   */
  create: async (input: CreateBundleInput): Promise<Bundle> => {
    const result = await handleRequest(() =>
      apiClient.bundles().createBundle({ createBundleRequest: input as any })
    )
    return validators.bundle(result) as Bundle
  },

  /**
   * Update bundle
   */
  update: async (id: string, input: Partial<CreateBundleInput>): Promise<Bundle> => {
    const result = await handleRequest(() =>
      apiClient.bundles().updateBundle({ id, updateBundleRequest: input as any })
    )
    return validators.bundle(result) as Bundle
  },

  /**
   * Delete bundle
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.bundles().deleteBundle({ id })
  },
}

// ============================================
// Carts API (Custom - not fully in SDK)
// ============================================
export const carts = {
  /**
   * Get active cart for current user
   * TODO: Add to OpenAPI spec for auto-generation
   */
  getActive: async (): Promise<CartWithTotals> => {
    // Placeholder - SDK method doesn't exist yet
    throw new Error('Cart API methods not yet in OpenAPI spec')
  },

  /**
   * Add item to cart
   */
  addItem: async (input: AddCartItemInput): Promise<CartWithTotals> => {
    throw new Error('Cart API methods not yet in OpenAPI spec')
  },

  /**
   * Update cart item
   */
  updateItem: async (itemId: string, input: UpdateCartItemInput): Promise<CartWithTotals> => {
    throw new Error('Cart API methods not yet in OpenAPI spec')
  },

  /**
   * Remove item from cart
   */
  removeItem: async (itemId: string): Promise<CartWithTotals> => {
    throw new Error('Cart API methods not yet in OpenAPI spec')
  },

  /**
   * Clear cart
   */
  clear: async (): Promise<CartWithTotals> => {
    throw new Error('Cart API methods not yet in OpenAPI spec')
  },
}
