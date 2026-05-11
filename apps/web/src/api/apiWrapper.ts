/**
 * API Wrapper with Type Validation
 * ⚠️  AUTO-GENERATED - DO NOT EDIT MANUALLY
 * Generated from: SDK API classes
 * 
 * To regenerate: pnpm gen:wrapper
 */

import type { CreateItemRequest, UpdateItemRequest } from '@packages/sdk'
import { apiClient } from './client'
import { readHttpErrorFromResponse } from './readHttpError'
import { authGet } from '@shared/lib/auth/authFetch'
import type { 
  StoreResponse as Store,
  ItemResponse as Item,
  CartWithTotals,
  OrderResponse as Order,
  AddressResponse as Address,
  PromotionResponse as Promotion,
  UserResponse as User,
  Bundle,
  CreateAddressInput,
  UpdateAddressInput,
  CreateStoreInput,
  UpdateStoreInput,
  CreateItemInput,
  UpdateItemInput,
  CreatePromotionInput,
  UpdatePromotionInput,
  UpdateOrderInput,
  UpdateUserInput,
} from './backend-types'
// Inline types (previously from deleted adapters/validation)
interface AddCartItemInput { itemId: string; quantity: number; notes?: string }
interface UpdateCartItemInput { quantity?: number; notes?: string }
const CART_NOT_IMPLEMENTED_MESSAGE = 'Cart API methods not yet in OpenAPI spec'

function getApiBaseUrl(): string {
  return (import.meta.env.VITE_API_URL || 'http://localhost:3005').replace(/\/$/, '')
}

function setQueryParam(params: URLSearchParams, key: string, value: string | number | undefined): void {
  if (value !== undefined) {
    params.set(key, String(value))
  }
}

/** OpenAPI/SDK expects `stockQty` as string; Zod UI types use number. SDK marks `stockQty` required on create. */
function toSdkItemCreateBody(input: CreateItemInput): CreateItemRequest {
  const raw = input as CreateItemInput & { stockQty?: number | string | null }
  const { stockQty, ...rest } = raw
  const qty = stockQty === undefined || stockQty === null ? '0' : String(stockQty)
  return { ...rest, stockQty: qty } as unknown as CreateItemRequest
}

function toSdkItemUpdateBody(input: UpdateItemInput): UpdateItemRequest {
  const raw = input as UpdateItemInput & { stockQty?: number | string | null }
  const { stockQty, ...rest } = raw
  const payload: Record<string, unknown> = { ...rest }
  if (stockQty !== undefined && stockQty !== null) {
    payload.stockQty = String(stockQty)
  }
  return payload as unknown as UpdateItemRequest
}

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
    super(message)
    this.name = 'APIError'
    if (options?.cause !== undefined) {
      ;(this as Error & { cause?: unknown }).cause = options.cause
    }
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
         ((error as any).response === undefined || 
         (typeof (error as any).response === 'object' && 
          typeof (error as any).response.status === 'number'))
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
        error.message ?? error.statusText,
        error.status,
        'HTTP_ERROR',
        error,
        { cause: error }
      )
    }
    
    // Handle Axios-like errors
    if (isAxiosError(error)) {
      const status = error.response?.status
      const message = error.response?.data?.message ?? error.message ?? 'Request failed'
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
        error.code ?? 'UNKNOWN_ERROR',
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
  list: async (): Promise<Address[]> => {
    const response = await handleRequest(() =>
      apiClient.addresses().listAddresses()
    )
    return unwrapData<Address[]>(response)
  },

  /**
   * Get address by ID
   */
  getById: async (id: string): Promise<Address> => {
    const result = await handleRequest(() =>
      apiClient.addresses().getAddressById({ id })
    )
    return unwrapData<Address>(result)
  },

  /**
   * Create new address
   */
  create: async (input: CreateAddressInput): Promise<Address> => {
    const result = await handleRequest(() =>
      apiClient.addresses().createAddress({
        createAddressRequest: input as never,
      })
    )
    return unwrapData<Address>(result)
  },

  /**
   * Update address
   */
  update: async (id: string, input: UpdateAddressInput): Promise<Address> => {
    const result = await handleRequest(() =>
      apiClient.addresses().updateAddress({
        id,
        updateAddressRequest: input as never,
      })
    )
    return unwrapData<Address>(result)
  },

  /**
   * Delete address
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
  list: async (params?: { page?: string; limit?: string; storeId?: string; isActive?: boolean }): Promise<Bundle[]> => {
    const query =
      params === undefined
        ? undefined
        : {
            page: params.page,
            limit: params.limit,
            storeId: params.storeId,
            ...(params.isActive === undefined ? {} : { isActive: params.isActive ? 'true' : 'false' }),
          }
    const response = await handleRequest(() => apiClient.bundles().listBundles(query))
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
  create: async (input: Partial<Bundle>): Promise<Bundle> => {
    const result = await handleRequest(() =>
      apiClient.bundles().createBundle({
        createBundleRequest: input as never,
      })
    )
    return unwrapData<Bundle>(result)
  },

  /**
   * Update bundle
   */
  update: async (id: string, input: Partial<Bundle>): Promise<Bundle> => {
    const result = await handleRequest(() =>
      apiClient.bundles().updateBundle({
        id,
        updateBundleRequest: input as never,
      })
    )
    return unwrapData<Bundle>(result)
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
  create: async (input: Partial<CartWithTotals>): Promise<CartWithTotals> => {
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
  update: async (_id: string, _input: Partial<CartWithTotals>): Promise<CartWithTotals> => Promise.reject(
    new APIError(CART_NOT_IMPLEMENTED_MESSAGE, undefined, 'NOT_IMPLEMENTED')
  ),

  /**
   * Delete cart
   */
  delete: async (id: string): Promise<void> => {
    await handleRequest(() =>
      apiClient.carts().deleteCart({ id: id })
    )
  },
}

export interface ItemListPageResult {
  readonly data: Item[]
  readonly total: number
  readonly page: number
  readonly limit: number
}

// ============================================
// Items API
// ============================================
export const items = {
  /**
   * List items with pagination envelope.
   */
  listPage: async (params?: { page?: string; limit?: string; storeId?: string }): Promise<ItemListPageResult> => {
    const payload = await handleRequest(async () => {
      const searchParams = new URLSearchParams()
      setQueryParam(searchParams, 'page', params?.page)
      setQueryParam(searchParams, 'limit', params?.limit)
      setQueryParam(searchParams, 'storeId', params?.storeId)

      const query = searchParams.toString()
      const url = `${getApiBaseUrl()}/items${query ? `?${query}` : ''}`
      if (import.meta.env.MODE === 'development') {
        console.log('[API] -> GET ' + url)
      }

      const result = await fetch(url, {
        headers: {
          Accept: 'application/json',
        },
      })

      if (import.meta.env.MODE === 'development') {
        console.log('[API] <- ' + result.status + ' ' + url)
      }

      if (!result.ok) {
        const { message, body } = await readHttpErrorFromResponse(result)
        throw new APIError(message, result.status, 'HTTP_ERROR', body)
      }

      return await result.json() as {
        data: Item[]
        total: number
        page: number
        limit: number
      }
    })

    return {
      data: params?.storeId ? payload.data.filter((item) => item.storeId === params.storeId) : payload.data,
      total: payload.total,
      page: payload.page,
      limit: payload.limit,
    }
  },

  /**
   * List items
   */
  list: async (params?: { page?: string; limit?: string; storeId?: string }): Promise<Item[]> => {
    const response = await handleRequest(async () => {
      const searchParams = new URLSearchParams()
      setQueryParam(searchParams, 'page', params?.page)
      setQueryParam(searchParams, 'limit', params?.limit)
      setQueryParam(searchParams, 'storeId', params?.storeId)

      const query = searchParams.toString()
      const url = `${getApiBaseUrl()}/items${query ? `?${query}` : ''}`
      if (import.meta.env.MODE === 'development') {
        console.log('[API] -> GET ' + url)
      }

      const result = await fetch(url, {
        headers: {
          Accept: 'application/json',
        },
      })

      if (import.meta.env.MODE === 'development') {
        console.log('[API] <- ' + result.status + ' ' + url)
      }

      if (!result.ok) {
        const { message, body } = await readHttpErrorFromResponse(result)
        throw new APIError(message, result.status, 'HTTP_ERROR', body)
      }

      return await result.json()
    })
    const data = unwrapData<Item[]>(response)
    return params?.storeId ? data.filter((item) => item.storeId === params.storeId) : data
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
  create: async (input: CreateItemInput): Promise<Item> => {
    const result = await handleRequest(() =>
      apiClient.items().createItem({
        createItemRequest: toSdkItemCreateBody(input),
      })
    )
    return unwrapData<Item>(result)
  },

  /**
   * Update item
   */
  update: async (id: string, input: UpdateItemInput): Promise<Item> => {
    const result = await handleRequest(() =>
      apiClient.items().updateItem({
        id,
        updateItemRequest: toSdkItemUpdateBody(input),
      })
    )
    return unwrapData<Item>(result)
  },

  /**
   * Delete item
   */
  delete: async (id: string): Promise<void> => {
    await handleRequest(() =>
      apiClient.items().deleteItem({ id })
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
  update: async (id: string, input: UpdateOrderInput): Promise<Order> => {
    const result = await handleRequest(() =>
      apiClient.orders().updateOrder({
        id,
        updateOrderRequest: input as never,
      })
    )
    return unwrapData<Order>(result)
  },

  /**
   * Delete order
   */
  delete: async (id: string): Promise<void> => {
    await handleRequest(() =>
      apiClient.orders().deleteOrder({ id })
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
  list: async (): Promise<Promotion[]> => {
    const response = await handleRequest(() =>
      apiClient.promotions().listPromotions()
    )
    return unwrapData<Promotion[]>(response)
  },

  /**
   * Get promotion by ID
   */
  getById: async (id: string): Promise<Promotion> => {
    const result = await handleRequest(() =>
      apiClient.promotions().getPromotionById({ id })
    )
    return unwrapData<Promotion>(result)
  },

  /**
   * Create new promotion
   */
  create: async (input: CreatePromotionInput): Promise<Promotion> => {
    const result = await handleRequest(() =>
      apiClient.promotions().createPromotion({
        createPromotionRequest: input,
      })
    )
    return unwrapData<Promotion>(result)
  },

  /**
   * Update promotion
   */
  update: async (id: string, input: UpdatePromotionInput): Promise<Promotion> => {
    const result = await handleRequest(() =>
      apiClient.promotions().updatePromotion({
        id,
        updatePromotionRequest: input,
      })
    )
    return unwrapData<Promotion>(result)
  },

  /**
   * Delete promotion
   */
  delete: async (id: string): Promise<void> => {
    await handleRequest(() =>
      apiClient.promotions().deletePromotion({ id })
    )
  },
}

export interface StoreListPageResult {
  readonly data: Store[]
  readonly total: number
  readonly page: number
  readonly limit: number
}

// ============================================
// Stores API
// ============================================
export const stores = {
  /**
   * List stores with pagination envelope (total, page, limit).
   */
  listPage: async (params?: {
    page?: string
    limit?: string
    ownerUserId?: string
    latitude?: number
    longitude?: number
    radiusMiles?: number
    isPublished?: string
    sortBy?: string
    order?: string
  }): Promise<StoreListPageResult> => {
    const envelope = await handleRequest(async () => {
      const searchParams = new URLSearchParams()
      setQueryParam(searchParams, 'page', params?.page)
      setQueryParam(searchParams, 'limit', params?.limit)
      setQueryParam(searchParams, 'ownerUserId', params?.ownerUserId)
      setQueryParam(searchParams, 'latitude', params?.latitude)
      setQueryParam(searchParams, 'longitude', params?.longitude)
      setQueryParam(searchParams, 'radiusMiles', params?.radiusMiles)
      setQueryParam(searchParams, 'isPublished', params?.isPublished)
      setQueryParam(searchParams, 'sortBy', params?.sortBy)
      setQueryParam(searchParams, 'order', params?.order)

      const query = searchParams.toString()
      const path = `/stores${query ? `?${query}` : ''}`
      const fullUrl = `${getApiBaseUrl()}${path}`
      if (import.meta.env.MODE === 'development') {
        console.log('[API] -> GET ' + fullUrl)
      }

      const result = await authGet(path)

      if (import.meta.env.MODE === 'development') {
        console.log('[API] <- ' + result.status + ' ' + fullUrl)
      }

      if (!result.ok) {
        const { message, body } = await readHttpErrorFromResponse(result)
        throw new APIError(message, result.status, 'HTTP_ERROR', body)
      }

      return await result.json() as {
        data: Store[]
        total: number
        page: number
        limit: number
      }
    })

    return {
      data: envelope.data,
      total: envelope.total,
      page: envelope.page,
      limit: envelope.limit,
    }
  },

  /**
   * List stores
   */
  list: async (params?: {
    page?: string
    limit?: string
    ownerUserId?: string
    latitude?: number
    longitude?: number
    radiusMiles?: number
    isPublished?: string
    sortBy?: string
    order?: string
  }): Promise<Store[]> => {
    const response = await handleRequest(async () => {
      const searchParams = new URLSearchParams()
      setQueryParam(searchParams, 'page', params?.page)
      setQueryParam(searchParams, 'limit', params?.limit)
      setQueryParam(searchParams, 'ownerUserId', params?.ownerUserId)
      setQueryParam(searchParams, 'latitude', params?.latitude)
      setQueryParam(searchParams, 'longitude', params?.longitude)
      setQueryParam(searchParams, 'radiusMiles', params?.radiusMiles)
      setQueryParam(searchParams, 'isPublished', params?.isPublished)
      setQueryParam(searchParams, 'sortBy', params?.sortBy)
      setQueryParam(searchParams, 'order', params?.order)

      const query = searchParams.toString()
      const path = `/stores${query ? `?${query}` : ''}`
      const fullUrl = `${getApiBaseUrl()}${path}`
      if (import.meta.env.MODE === 'development') {
        console.log('[API] -> GET ' + fullUrl)
      }

      const result = await authGet(path)

      if (import.meta.env.MODE === 'development') {
        console.log('[API] <- ' + result.status + ' ' + fullUrl)
      }

      if (!result.ok) {
        const { message, body } = await readHttpErrorFromResponse(result)
        throw new APIError(message, result.status, 'HTTP_ERROR', body)
      }

      return await result.json()
    })
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
  create: async (input: CreateStoreInput): Promise<Store> => {
    const result = await handleRequest(() =>
      apiClient.stores().createStore({
        createStoreRequest: input,
      })
    )
    return unwrapData<Store>(result)
  },

  /**
   * Update store
   */
  update: async (id: string, input: UpdateStoreInput): Promise<Store> => {
    const result = await handleRequest(() =>
      apiClient.stores().updateStore({
        id,
        updateStoreRequest: input,
      })
    )
    return unwrapData<Store>(result)
  },

  /**
   * Delete store
   */
  delete: async (id: string): Promise<void> => {
    await handleRequest(() =>
      apiClient.stores().deleteStore({ id })
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
  list: async (): Promise<User[]> => {
    const response = await handleRequest(() =>
      apiClient.users().listUsers()
    )
    return unwrapData<User[]>(response)
  },

  /**
   * Get user by ID
   */
  getById: async (id: string): Promise<User> => {
    const result = await handleRequest(() =>
      apiClient.users().getUserById({ id })
    )
    return unwrapData<User>(result)
  },

  /**
   * Create new user
   */
  create: async (_input: unknown): Promise<User> => Promise.reject(
    new APIError('Users.create not implemented by current SDK', undefined, 'NOT_IMPLEMENTED')
  ),

  /**
   * Update user
   */
  update: async (id: string, input: UpdateUserInput): Promise<User> => {
    const result = await handleRequest(() =>
      apiClient.users().updateUser({
        id,
        updateUserRequest: input as never,
      })
    )
    return unwrapData<User>(result)
  },

  /**
   * Delete user
   */
  delete: async (_id: string): Promise<void> => Promise.reject(
    new APIError('Users.delete not implemented by current SDK', undefined, 'NOT_IMPLEMENTED')
  ),
}

// ============================================
// Cart API (Custom - not fully in SDK)
// ============================================

export const cart = {
  /**
   * Get active cart for current user
   * NOTE: This will be auto-generated when added to OpenAPI spec
   */
  getActive: (): Promise<CartWithTotals> => Promise.reject(
    new APIError(CART_NOT_IMPLEMENTED_MESSAGE, undefined, 'NOT_IMPLEMENTED')
  ),

  /**
   * Add item to cart
   */
  addItem: (_input: AddCartItemInput): Promise<CartWithTotals> => Promise.reject(
    new APIError(CART_NOT_IMPLEMENTED_MESSAGE, undefined, 'NOT_IMPLEMENTED')
  ),

  /**
   * Update cart item
   */
  updateItem: (_itemId: string, _input: UpdateCartItemInput): Promise<CartWithTotals> => Promise.reject(
    new APIError(CART_NOT_IMPLEMENTED_MESSAGE, undefined, 'NOT_IMPLEMENTED')
  ),

  /**
   * Remove item from cart
   */
  removeItem: (_itemId: string): Promise<CartWithTotals> => Promise.reject(
    new APIError(CART_NOT_IMPLEMENTED_MESSAGE, undefined, 'NOT_IMPLEMENTED')
  ),

  /**
   * Clear cart
   */
  clear: (): Promise<CartWithTotals> => Promise.reject(
    new APIError(CART_NOT_IMPLEMENTED_MESSAGE, undefined, 'NOT_IMPLEMENTED')
  ),
}

// ============================================
// Media Assets API (minimal stub for generated hooks)
// ============================================
// NOTE: The real media upload/list/delete for vendors currently lives in
// `src/shared/hooks/hooks/vendor/*` and uses `apiClient.media()` directly.
// This wrapper exists to satisfy generated hook imports during bundling.
export const mediaAssets = {
  list: (): Promise<any[]> => Promise.resolve([]),
  getById: (_id: string): Promise<any> => Promise.reject(
    new APIError('MediaAssets.getById not implemented', undefined, 'NOT_IMPLEMENTED')
  ),
  create: (_input: any): Promise<any> => Promise.reject(
    new APIError('MediaAssets.create not implemented', undefined, 'NOT_IMPLEMENTED')
  ),
  update: (_id: string, _input: any): Promise<any> => Promise.reject(
    new APIError('MediaAssets.update not implemented', undefined, 'NOT_IMPLEMENTED')
  ),
  delete: (_id: string): Promise<void> => Promise.reject(
    new APIError('MediaAssets.delete not implemented', undefined, 'NOT_IMPLEMENTED')
  ),
}

// ============================================
// Posts API (minimal stub for generated hooks)
// ============================================
// NOTE: Store "river" posts are currently fetched via custom hooks under
// `src/shared/hooks/hooks/river/*`.
export const posts = {
  list: (): Promise<any[]> => Promise.resolve([]),
  getById: (_id: string): Promise<any> => Promise.reject(
    new APIError('Posts.getById not implemented', undefined, 'NOT_IMPLEMENTED')
  ),
  create: (_input: any): Promise<any> => Promise.reject(
    new APIError('Posts.create not implemented', undefined, 'NOT_IMPLEMENTED')
  ),
  update: (_id: string, _input: any): Promise<any> => Promise.reject(
    new APIError('Posts.update not implemented', undefined, 'NOT_IMPLEMENTED')
  ),
  delete: (_id: string): Promise<void> => Promise.reject(
    new APIError('Posts.delete not implemented', undefined, 'NOT_IMPLEMENTED')
  ),
}
