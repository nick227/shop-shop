// @ts-nocheck
/**
 * API Wrapper with Type Validation
 * ⚠️  AUTO-GENERATED - DO NOT EDIT MANUALLY
 * Generated from: SDK API classes
 * 
 * To regenerate: pnpm gen:wrapper
 */

import { apiClient } from './client'
import type { 
  StoreResponse as Store, 
  ItemResponse as Item, 
  CartWithTotals,
  OrderResponse as Order,
  AddressResponse as Address,
  Bundle,
} from './backend-types'
// Inline types (previously from deleted adapters/validation)
interface AddCartItemInput { itemId: string; quantity: number; notes?: string }
interface UpdateCartItemInput { quantity?: number; notes?: string }

/**
 * Custom error class for API errors
 */
export class APIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public details?: unknown,
    options?: { cause?: unknown }
  ) {
    super(message, options as ErrorOptions)
    this.name = 'APIError'
  }
}

/**
 * Helper to unwrap data from API responses that may be wrapped in { data: T } or just T
 */
function unwrapData<T>(response: unknown): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as { data: T }).data
  }
  return response as T
}

/**
 * Type predicates for better error classification
 */
function isResponseError(error: unknown): error is { status: number; statusText: string; message?: string } {
  return error !== null && 
         typeof error === 'object' && 
         'status' in error && 
         'statusText' in error &&
         typeof (error as any).status === 'number' &&
         typeof (error as any).statusText === 'string'
}

function isAxiosError(error: unknown): error is { 
  response?: { status: number; data?: { message?: string } }
  message?: string
} {
  return error !== null && 
         typeof error === 'object' && 
         'response' in error &&
         (error as any).response === undefined || 
         (typeof (error as any).response === 'object' && 
          typeof (error as any).response.status === 'number')
}

function isGenericError(error: unknown): error is { message: string; status?: number; code?: string } {
  return error !== null && 
         typeof error === 'object' && 
         'message' in error &&
         typeof (error as any).message === 'string'
}

/**
 * Helper: Wrap API calls with comprehensive error handling
 */
async function handleRequest<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn()
  } catch (error: unknown) {
    // Handle APIError instances (re-throw as-is)
    if (error instanceof APIError) {
      throw error
    }
    
    // Handle Response-like errors (fetch API)
    if (isResponseError(error)) {
      throw new APIError(
        error.message || error.statusText,
        error.status,
        'HTTP_ERROR',
        error,
        { cause: error }
      )
    }
    
    // Handle Axios-like errors
    if (isAxiosError(error)) {
      const status = error.response?.status
      const message = error.response?.data?.message || error.message || 'Request failed'
      throw new APIError(
        message,
        status,
        'HTTP_ERROR',
        error,
        { cause: error }
      )
    }
    
    // Handle generic errors with message
    if (isGenericError(error)) {
      throw new APIError(
        error.message,
        error.status,
        error.code || 'UNKNOWN_ERROR',
        error,
        { cause: error }
      )
    }
    
    // Handle unknown errors
    const message = error instanceof Error ? error.message : 'An unexpected error occurred'
    throw new APIError(
      message,
      undefined,
      'UNKNOWN_ERROR',
      error,
      { cause: error }
    )
  }
}


// ============================================
// Addresses API
// ============================================
export const addresses = {
  /**
   * List addresses
   */
  list: async (params?: { page?: string; limit?: string }): Promise<Addresses[]> => {
    const response = await handleRequest(() =>
      apiClient.addresses().listAddressess(params)
    )
    return unwrapData<Addresses[]>(response)
  },

  /**
   * Get address by ID
   */
  getById: async (id: string): Promise<Addresses> => {
    const result = await handleRequest(() =>
      apiClient.addresses().getAddressesById({ id: id })
    )
    return unwrapData<Addresses>(result)
  },

  /**
   * Create new address
   */
  create: async (input: CreateAddressesInput): Promise<Addresses> => {
    const result = await handleRequest(() =>
        apiClient.addresses().createAddresses({
          createAddressesRequest: input
        })
    )
    return unwrapData<Addresses>(result)
  },

  /**
   * Update address
   */
  update: async (id: string, input: CreateAddressesInput): Promise<Addresses> => {
    const result = await handleRequest(() =>
        apiClient.addresses().updateAddresses({
          id,
          updateAddressesRequest: input
        })
    )
    return unwrapData<Addresses>(result)
  },

  /**
   * Delete address
   */
  delete: async (id: string): Promise<void> => {
    await handleRequest(() =>
      apiClient.addresses().deleteAddresses({ id: id })
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
  list: async (params?: { page?: string; limit?: string; storeId?: string; isActive?: boolean }): Promise<Bundle[]> => {
    const response = await handleRequest(() =>
      apiClient.bundles().listBundles(params as any)
    )
    return unwrapData<Bundle[]>(response)
  },

  /**
   * Get bundle by ID
   */
  getById: async (id: string): Promise<Bundle> => {
    const result = await handleRequest(() =>
      apiClient.bundles().getBundleById({ id: id })
    )
    return unwrapData<Bundle>(result)
  },

  /**
   * Create new bundle
   */
  create: async (input: CreateBundlesInput): Promise<Bundles> => {
    const result = await handleRequest(() =>
        apiClient.bundles().createBundles({
          createBundlesRequest: input
        })
    )
    return unwrapData<Bundles>(result)
  },

  /**
   * Update bundle
   */
  update: async (id: string, input: CreateBundlesInput): Promise<Bundles> => {
    const result = await handleRequest(() =>
        apiClient.bundles().updateBundles({
          id,
          updateBundlesRequest: input
        })
    )
    return unwrapData<Bundles>(result)
  },

  /**
   * Delete bundle
   */
  delete: async (id: string): Promise<void> => {
    await handleRequest(() =>
      apiClient.bundles().deleteBundles({ id: id })
    )
  },
}

// ============================================
// Carts API
// ============================================
export const carts = {
  /**
   * List carts
   */
  list: async (params?: { page?: string; limit?: string }): Promise<CartWithTotals[]> => {
    const response = await handleRequest(() =>
      apiClient.carts().listCarts(params)
    )
    return unwrapData<CartWithTotals[]>(response)
  },

  /**
   * Get cart by ID
   */
  getById: async (id: string): Promise<CartWithTotals> => {
    const result = await handleRequest(() =>
      apiClient.carts().getCartById({ id: id })
    )
    return unwrapData<CartWithTotals>(result)
  },

  /**
   * Create new cart
   */
  create: async (input: unknown): Promise<CartWithTotals> => {
    const result = await handleRequest(() =>
        apiClient.carts().createCart({
          createCartRequest: input as any
        })
    )
    return unwrapData<CartWithTotals>(result)
  },

  /**
   * Update cart
   */
  update: async (id: string, input: CreateCartsInput): Promise<Carts> => {
    const result = await handleRequest(() =>
        apiClient.carts().updateCarts({
          id,
          updateCartsRequest: input
        })
    )
    return unwrapData<Carts>(result)
  },

  /**
   * Delete cart
   */
  delete: async (id: string): Promise<void> => {
    await handleRequest(() =>
      apiClient.carts().deleteCart({ id: id })
    )
  },
}

// ============================================
// Items API
// ============================================
export const items = {
  /**
   * List items
   */
  list: async (params?: { page?: string; limit?: string; storeId?: string }): Promise<Item[]> => {
    const response = await handleRequest(() =>
      apiClient.items().listItems(params as any)
    )
    return unwrapData<Item[]>(response)
  },

  /**
   * Get item by ID
   */
  getById: async (id: string): Promise<Item> => {
    const result = await handleRequest(() =>
      apiClient.items().getItemById({ id: id })
    )
    return unwrapData<Item>(result)
  },

  /**
   * Create new item
   */
  create: async (input: CreateItemsInput): Promise<Items> => {
    const result = await handleRequest(() =>
        apiClient.items().createItems({
          createItemsRequest: input
        })
    )
    return unwrapData<Items>(result)
  },

  /**
   * Update item
   */
  update: async (id: string, input: CreateItemsInput): Promise<Items> => {
    const result = await handleRequest(() =>
        apiClient.items().updateItems({
          id,
          updateItemsRequest: input
        })
    )
    return unwrapData<Items>(result)
  },

  /**
   * Delete item
   */
  delete: async (id: string): Promise<void> => {
    await handleRequest(() =>
      apiClient.items().deleteItems({ id: id })
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
  list: async (params?: { page?: string; limit?: string }): Promise<Order[]> => {
    const response = await handleRequest(() =>
      apiClient.orders().listOrders(params)
    )
    return unwrapData<Order[]>(response)
  },

  /**
   * Get order by ID
   */
  getById: async (id: string): Promise<Order> => {
    const result = await handleRequest(() =>
      apiClient.orders().getOrderById({ id: id })
    )
    return unwrapData<Order>(result)
  },

  /**
   * Create new order
   */
  create: async (input: unknown): Promise<Order> => {
    const result = await handleRequest(() =>
        apiClient.orders().createOrder({
          createOrderRequest: input as any
        })
    )
    return unwrapData<Order>(result)
  },

  /**
   * Update order
   */
  update: async (id: string, input: CreateOrdersInput): Promise<Orders> => {
    const result = await handleRequest(() =>
        apiClient.orders().updateOrders({
          id,
          updateOrdersRequest: input
        })
    )
    return unwrapData<Orders>(result)
  },

  /**
   * Delete order
   */
  delete: async (id: string): Promise<void> => {
    await handleRequest(() =>
      apiClient.orders().deleteOrders({ id: id })
    )
  },
}

// ============================================
// Promotions API
// ============================================
export const promotions = {
  /**
   * List promotions
   */
  list: async (params?: { page?: string; limit?: string }): Promise<Promotions[]> => {
    const response = await handleRequest(() =>
      apiClient.promotions().listPromotionss(params)
    )
    return unwrapData<Promotions[]>(response)
  },

  /**
   * Get promotion by ID
   */
  getById: async (id: string): Promise<Promotions> => {
    const result = await handleRequest(() =>
      apiClient.promotions().getPromotionsById({ id: id })
    )
    return unwrapData<Promotions>(result)
  },

  /**
   * Create new promotion
   */
  create: async (input: CreatePromotionsInput): Promise<Promotions> => {
    const result = await handleRequest(() =>
        apiClient.promotions().createPromotions({
          createPromotionsRequest: input
        })
    )
    return unwrapData<Promotions>(result)
  },

  /**
   * Update promotion
   */
  update: async (id: string, input: CreatePromotionsInput): Promise<Promotions> => {
    const result = await handleRequest(() =>
        apiClient.promotions().updatePromotions({
          id,
          updatePromotionsRequest: input
        })
    )
    return unwrapData<Promotions>(result)
  },

  /**
   * Delete promotion
   */
  delete: async (id: string): Promise<void> => {
    await handleRequest(() =>
      apiClient.promotions().deletePromotions({ id: id })
    )
  },
}

// ============================================
// Stores API
// ============================================
export const stores = {
  /**
   * List stores
   */
  list: async (params?: { page?: string; limit?: string; latitude?: number; longitude?: number; radiusMiles?: number }): Promise<Store[]> => {
    const response = await handleRequest(() =>
      apiClient.stores().listStores(params as any)
    )
    return unwrapData<Store[]>(response)
  },

  /**
   * Get store by ID
   */
  getById: async (id: string): Promise<Store> => {
    const result = await handleRequest(() =>
      apiClient.stores().getStoreById({ id: id })
    )
    return unwrapData<Store>(result)
  },

  /**
   * Create new store
   */
  create: async (input: CreateStoresInput): Promise<Stores> => {
    const result = await handleRequest(() =>
        apiClient.stores().createStores({
          createStoresRequest: input
        })
    )
    return unwrapData<Stores>(result)
  },

  /**
   * Update store
   */
  update: async (id: string, input: CreateStoresInput): Promise<Stores> => {
    const result = await handleRequest(() =>
        apiClient.stores().updateStores({
          id,
          updateStoresRequest: input
        })
    )
    return unwrapData<Stores>(result)
  },

  /**
   * Delete store
   */
  delete: async (id: string): Promise<void> => {
    await handleRequest(() =>
      apiClient.stores().deleteStores({ id: id })
    )
  },
}

// ============================================
// Users API
// ============================================
export const users = {
  /**
   * List users
   */
  list: async (params?: { page?: string; limit?: string }): Promise<Users[]> => {
    const response = await handleRequest(() =>
      apiClient.users().listUserss(params)
    )
    return unwrapData<Users[]>(response)
  },

  /**
   * Get user by ID
   */
  getById: async (id: string): Promise<Users> => {
    const result = await handleRequest(() =>
      apiClient.users().getUsersById({ id: id })
    )
    return unwrapData<Users>(result)
  },

  /**
   * Create new user
   */
  create: async (input: CreateUsersInput): Promise<Users> => {
    const result = await handleRequest(() =>
        apiClient.users().createUsers({
          createUsersRequest: input
        })
    )
    return unwrapData<Users>(result)
  },

  /**
   * Update user
   */
  update: async (id: string, input: CreateUsersInput): Promise<Users> => {
    const result = await handleRequest(() =>
        apiClient.users().updateUsers({
          id,
          updateUsersRequest: input
        })
    )
    return unwrapData<Users>(result)
  },

  /**
   * Delete user
   */
  delete: async (id: string): Promise<void> => {
    await handleRequest(() =>
      apiClient.users().deleteUsers({ id: id })
    )
  },
}

// ============================================
// Cart API (Custom - not fully in SDK)
// ============================================

export const cart = {
  /**
   * Get active cart for current user
   * NOTE: This will be auto-generated when added to OpenAPI spec
   */
  getActive: async (): Promise<CartWithTotals> => {
    throw new APIError(
      'Cart API methods not yet in OpenAPI spec',
      undefined,
      'NOT_IMPLEMENTED'
    )
  },

  /**
   * Add item to cart
   */
  addItem: async (_input: AddCartItemInput): Promise<CartWithTotals> => {
    throw new APIError(
      'Cart API methods not yet in OpenAPI spec',
      undefined,
      'NOT_IMPLEMENTED'
    )
  },

  /**
   * Update cart item
   */
  updateItem: async (_itemId: string, _input: UpdateCartItemInput): Promise<CartWithTotals> => {
    throw new APIError(
      'Cart API methods not yet in OpenAPI spec',
      undefined,
      'NOT_IMPLEMENTED'
    )
  },

  /**
   * Remove item from cart
   */
  removeItem: async (_itemId: string): Promise<CartWithTotals> => {
    throw new APIError(
      'Cart API methods not yet in OpenAPI spec',
      undefined,
      'NOT_IMPLEMENTED'
    )
  },

  /**
   * Clear cart
   */
  clear: async (): Promise<CartWithTotals> => {
    throw new APIError(
      'Cart API methods not yet in OpenAPI spec',
      undefined,
      'NOT_IMPLEMENTED'
    )
  },
}

// ============================================
// Media Assets API (minimal stub for generated hooks)
// ============================================
// NOTE: The real media upload/list/delete for vendors currently lives in
// `src/shared/hooks/hooks/vendor/*` and uses `apiClient.media()` directly.
// This wrapper exists to satisfy generated hook imports during bundling.
export const mediaAssets = {
  list: async (): Promise<any[]> => [],
  getById: async (_id: string): Promise<any> => {
    throw new APIError('MediaAssets.getById not implemented', undefined, 'NOT_IMPLEMENTED')
  },
  create: async (_input: any): Promise<any> => {
    throw new APIError('MediaAssets.create not implemented', undefined, 'NOT_IMPLEMENTED')
  },
  update: async (_id: string, _input: any): Promise<any> => {
    throw new APIError('MediaAssets.update not implemented', undefined, 'NOT_IMPLEMENTED')
  },
  delete: async (_id: string): Promise<void> => {
    throw new APIError('MediaAssets.delete not implemented', undefined, 'NOT_IMPLEMENTED')
  },
}

// ============================================
// Posts API (minimal stub for generated hooks)
// ============================================
// NOTE: Store "river" posts are currently fetched via custom hooks under
// `src/shared/hooks/hooks/river/*`.
export const posts = {
  list: async (): Promise<any[]> => [],
  getById: async (_id: string): Promise<any> => {
    throw new APIError('Posts.getById not implemented', undefined, 'NOT_IMPLEMENTED')
  },
  create: async (_input: any): Promise<any> => {
    throw new APIError('Posts.create not implemented', undefined, 'NOT_IMPLEMENTED')
  },
  update: async (_id: string, _input: any): Promise<any> => {
    throw new APIError('Posts.update not implemented', undefined, 'NOT_IMPLEMENTED')
  },
  delete: async (_id: string): Promise<void> => {
    throw new APIError('Posts.delete not implemented', undefined, 'NOT_IMPLEMENTED')
  },
}
