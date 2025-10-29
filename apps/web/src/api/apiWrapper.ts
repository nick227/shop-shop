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

// Re-export from schemas package
export * from '@packages/schemas'


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
// Users API
// ============================================
export const users = {
  /**
   * List users
   */
  list: async (params?: { page?: string; limit?: string }): Promise<User[]> => {
    const response = await handleRequest(() =>
      apiClient.users().listUsers(params as any)
    )
    return (response as any).data ?? (response as any) as User[]
  },

  /**
   * Get user by ID
   */
  getById: async (id: string): Promise<User> => {
    const result = await handleRequest(() =>
      apiClient.users().getUserById({ id })
    )
    return result as any as User
  },

  /**
   * Create new user
   */
  create: async (input: CreateUserInput): Promise<User> => {
    const result = await handleRequest(() =>
        apiClient.users().createUser({
          createUserRequest: input as any
        })
    )
    return result as any as User
  },

  /**
   * Update user
   */
  update: async (id: string, input: CreateUserInput): Promise<User> => {
    const result = await handleRequest(() =>
        apiClient.users().updateUser({
          id,
          updateUserRequest: input as any
        })
    )
    return result as any as User
  },

  /**
   * Delete user
   */
  delete: async (id: string): Promise<void> => {
    await handleRequest(() =>
      apiClient.users().deleteUser({ id })
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

  /**
   * Create new store
   */
  create: async (input: CreateStoreInput): Promise<Store> => {
    const result = await handleRequest(() =>
        apiClient.stores().createStore({
          createStoreRequest: input as any
        })
    )
    return result as any as Store
  },

  /**
   * Update store
   */
  update: async (id: string, input: CreateStoreInput): Promise<Store> => {
    const result = await handleRequest(() =>
        apiClient.stores().updateStore({
          id,
          updateStoreRequest: input as any
        })
    )
    return result as any as Store
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
// Geocodingcaches API
// ============================================
export const geocodingcaches = {
  /**
   * List geocodingcaches
   */
  list: async (params?: { page?: string; limit?: string }): Promise<GeocodingCache[]> => {
    const response = await handleRequest(() =>
      apiClient.geocodingcaches().listGeocodingCaches(params as any)
    )
    return (response as any).data ?? (response as any) as GeocodingCache[]
  },

  /**
   * Get geocodingcache by ID
   */
  getById: async (id: string): Promise<GeocodingCache> => {
    const result = await handleRequest(() =>
      apiClient.geocodingcaches().getGeocodingCacheById({ id })
    )
    return result as any as GeocodingCache
  },

  /**
   * Create new geocodingcache
   */
  create: async (input: CreateGeocodingCacheInput): Promise<GeocodingCache> => {
    const result = await handleRequest(() =>
        apiClient.geocodingcaches().createGeocodingCache({
          createGeocodingCacheRequest: input as any
        })
    )
    return result as any as GeocodingCache
  },

  /**
   * Update geocodingcache
   */
  update: async (id: string, input: CreateGeocodingCacheInput): Promise<GeocodingCache> => {
    const result = await handleRequest(() =>
        apiClient.geocodingcaches().updateGeocodingCache({
          id,
          updateGeocodingCacheRequest: input as any
        })
    )
    return result as any as GeocodingCache
  },

  /**
   * Delete geocodingcache
   */
  delete: async (id: string): Promise<void> => {
    await handleRequest(() =>
      apiClient.geocodingcaches().deleteGeocodingCache({ id })
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

  /**
   * Create new item
   */
  create: async (input: CreateItemInput): Promise<Item> => {
    const result = await handleRequest(() =>
        apiClient.items().createItem({
          createItemRequest: input as any
        })
    )
    return result as any as Item
  },

  /**
   * Update item
   */
  update: async (id: string, input: CreateItemInput): Promise<Item> => {
    const result = await handleRequest(() =>
        apiClient.items().updateItem({
          id,
          updateItemRequest: input as any
        })
    )
    return result as any as Item
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
// Mediaassets API
// ============================================
export const mediaassets = {
  /**
   * List mediaassets
   */
  list: async (params?: { page?: string; limit?: string }): Promise<MediaAsset[]> => {
    const response = await handleRequest(() =>
      apiClient.mediaassets().listMediaAssets(params as any)
    )
    return (response as any).data ?? (response as any) as MediaAsset[]
  },

  /**
   * Get mediaasset by ID
   */
  getById: async (id: string): Promise<MediaAsset> => {
    const result = await handleRequest(() =>
      apiClient.mediaassets().getMediaAssetById({ id })
    )
    return result as any as MediaAsset
  },

  /**
   * Create new mediaasset
   */
  create: async (input: CreateMediaAssetInput): Promise<MediaAsset> => {
    const result = await handleRequest(() =>
        apiClient.mediaassets().createMediaAsset({
          createMediaAssetRequest: input as any
        })
    )
    return result as any as MediaAsset
  },

  /**
   * Update mediaasset
   */
  update: async (id: string, input: CreateMediaAssetInput): Promise<MediaAsset> => {
    const result = await handleRequest(() =>
        apiClient.mediaassets().updateMediaAsset({
          id,
          updateMediaAssetRequest: input as any
        })
    )
    return result as any as MediaAsset
  },

  /**
   * Delete mediaasset
   */
  delete: async (id: string): Promise<void> => {
    await handleRequest(() =>
      apiClient.mediaassets().deleteMediaAsset({ id })
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
  list: async (params?: { page?: string; limit?: string }): Promise<Cart[]> => {
    const response = await handleRequest(() =>
      apiClient.carts().listCarts(params as any)
    )
    return (response as any).data ?? (response as any) as Cart[]
  },

  /**
   * Get cart by ID
   */
  getById: async (id: string): Promise<Cart> => {
    const result = await handleRequest(() =>
      apiClient.carts().getCartById({ id })
    )
    return result as any as Cart
  },

  /**
   * Create new cart
   */
  create: async (input: CreateCartInput): Promise<Cart> => {
    const result = await handleRequest(() =>
        apiClient.carts().createCart({
          createCartRequest: input as any
        })
    )
    return result as any as Cart
  },

  /**
   * Update cart
   */
  update: async (id: string, input: CreateCartInput): Promise<Cart> => {
    const result = await handleRequest(() =>
        apiClient.carts().updateCart({
          id,
          updateCartRequest: input as any
        })
    )
    return result as any as Cart
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
// Cartitems API
// ============================================
export const cartitems = {
  /**
   * List cartitems
   */
  list: async (params?: { page?: string; limit?: string }): Promise<CartItem[]> => {
    const response = await handleRequest(() =>
      apiClient.cartitems().listCartItems(params as any)
    )
    return (response as any).data ?? (response as any) as CartItem[]
  },

  /**
   * Get cartitem by ID
   */
  getById: async (id: string): Promise<CartItem> => {
    const result = await handleRequest(() =>
      apiClient.cartitems().getCartItemById({ id })
    )
    return result as any as CartItem
  },

  /**
   * Create new cartitem
   */
  create: async (input: CreateCartItemInput): Promise<CartItem> => {
    const result = await handleRequest(() =>
        apiClient.cartitems().createCartItem({
          createCartItemRequest: input as any
        })
    )
    return result as any as CartItem
  },

  /**
   * Update cartitem
   */
  update: async (id: string, input: CreateCartItemInput): Promise<CartItem> => {
    const result = await handleRequest(() =>
        apiClient.cartitems().updateCartItem({
          id,
          updateCartItemRequest: input as any
        })
    )
    return result as any as CartItem
  },

  /**
   * Delete cartitem
   */
  delete: async (id: string): Promise<void> => {
    await handleRequest(() =>
      apiClient.cartitems().deleteCartItem({ id })
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
      apiClient.orders().listOrders(params as any)
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
   * Update order
   */
  update: async (id: string, input: CreateOrderInput): Promise<Order> => {
    const result = await handleRequest(() =>
        apiClient.orders().updateOrder({
          id,
          updateOrderRequest: input as any
        })
    )
    return result as any as Order
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
// Orderitems API
// ============================================
export const orderitems = {
  /**
   * List orderitems
   */
  list: async (params?: { page?: string; limit?: string }): Promise<OrderItem[]> => {
    const response = await handleRequest(() =>
      apiClient.orderitems().listOrderItems(params as any)
    )
    return (response as any).data ?? (response as any) as OrderItem[]
  },

  /**
   * Get orderitem by ID
   */
  getById: async (id: string): Promise<OrderItem> => {
    const result = await handleRequest(() =>
      apiClient.orderitems().getOrderItemById({ id })
    )
    return result as any as OrderItem
  },

  /**
   * Create new orderitem
   */
  create: async (input: CreateOrderItemInput): Promise<OrderItem> => {
    const result = await handleRequest(() =>
        apiClient.orderitems().createOrderItem({
          createOrderItemRequest: input as any
        })
    )
    return result as any as OrderItem
  },

  /**
   * Update orderitem
   */
  update: async (id: string, input: CreateOrderItemInput): Promise<OrderItem> => {
    const result = await handleRequest(() =>
        apiClient.orderitems().updateOrderItem({
          id,
          updateOrderItemRequest: input as any
        })
    )
    return result as any as OrderItem
  },

  /**
   * Delete orderitem
   */
  delete: async (id: string): Promise<void> => {
    await handleRequest(() =>
      apiClient.orderitems().deleteOrderItem({ id })
    )
  },
}

// ============================================
// Orderevents API
// ============================================
export const orderevents = {
  /**
   * List orderevents
   */
  list: async (params?: { page?: string; limit?: string }): Promise<OrderEvent[]> => {
    const response = await handleRequest(() =>
      apiClient.orderevents().listOrderEvents(params as any)
    )
    return (response as any).data ?? (response as any) as OrderEvent[]
  },

  /**
   * Get orderevent by ID
   */
  getById: async (id: string): Promise<OrderEvent> => {
    const result = await handleRequest(() =>
      apiClient.orderevents().getOrderEventById({ id })
    )
    return result as any as OrderEvent
  },

  /**
   * Create new orderevent
   */
  create: async (input: CreateOrderEventInput): Promise<OrderEvent> => {
    const result = await handleRequest(() =>
        apiClient.orderevents().createOrderEvent({
          createOrderEventRequest: input as any
        })
    )
    return result as any as OrderEvent
  },

  /**
   * Update orderevent
   */
  update: async (id: string, input: CreateOrderEventInput): Promise<OrderEvent> => {
    const result = await handleRequest(() =>
        apiClient.orderevents().updateOrderEvent({
          id,
          updateOrderEventRequest: input as any
        })
    )
    return result as any as OrderEvent
  },

  /**
   * Delete orderevent
   */
  delete: async (id: string): Promise<void> => {
    await handleRequest(() =>
      apiClient.orderevents().deleteOrderEvent({ id })
    )
  },
}

// ============================================
// Tips API
// ============================================
export const tips = {
  /**
   * List tips
   */
  list: async (params?: { page?: string; limit?: string }): Promise<Tip[]> => {
    const response = await handleRequest(() =>
      apiClient.tips().listTips(params as any)
    )
    return (response as any).data ?? (response as any) as Tip[]
  },

  /**
   * Get tip by ID
   */
  getById: async (id: string): Promise<Tip> => {
    const result = await handleRequest(() =>
      apiClient.tips().getTipById({ id })
    )
    return result as any as Tip
  },

  /**
   * Create new tip
   */
  create: async (input: CreateTipInput): Promise<Tip> => {
    const result = await handleRequest(() =>
        apiClient.tips().createTip({
          createTipRequest: input as any
        })
    )
    return result as any as Tip
  },

  /**
   * Update tip
   */
  update: async (id: string, input: CreateTipInput): Promise<Tip> => {
    const result = await handleRequest(() =>
        apiClient.tips().updateTip({
          id,
          updateTipRequest: input as any
        })
    )
    return result as any as Tip
  },

  /**
   * Delete tip
   */
  delete: async (id: string): Promise<void> => {
    await handleRequest(() =>
      apiClient.tips().deleteTip({ id })
    )
  },
}

// ============================================
// Addresss API
// ============================================
export const addresss = {
  /**
   * List addresss
   */
  list: async (params?: { page?: string; limit?: string }): Promise<Address[]> => {
    const response = await handleRequest(() =>
      apiClient.addresss().listAddresss(params as any)
    )
    return (response as any).data ?? (response as any) as Address[]
  },

  /**
   * Get address by ID
   */
  getById: async (id: string): Promise<Address> => {
    const result = await handleRequest(() =>
      apiClient.addresss().getAddressById({ id })
    )
    return result as any as Address
  },

  /**
   * Create new address
   */
  create: async (input: CreateAddressInput): Promise<Address> => {
    const result = await handleRequest(() =>
        apiClient.addresss().createAddress({
          createAddressRequest: input as any
        })
    )
    return result as any as Address
  },

  /**
   * Update address
   */
  update: async (id: string, input: CreateAddressInput): Promise<Address> => {
    const result = await handleRequest(() =>
        apiClient.addresss().updateAddress({
          id,
          updateAddressRequest: input as any
        })
    )
    return result as any as Address
  },

  /**
   * Delete address
   */
  delete: async (id: string): Promise<void> => {
    await handleRequest(() =>
      apiClient.addresss().deleteAddress({ id })
    )
  },
}

// ============================================
// Systemsettings API
// ============================================
export const systemsettings = {
  /**
   * List systemsettings
   */
  list: async (params?: { page?: string; limit?: string }): Promise<SystemSetting[]> => {
    const response = await handleRequest(() =>
      apiClient.systemsettings().listSystemSettings(params as any)
    )
    return (response as any).data ?? (response as any) as SystemSetting[]
  },

  /**
   * Get systemsetting by ID
   */
  getById: async (id: string): Promise<SystemSetting> => {
    const result = await handleRequest(() =>
      apiClient.systemsettings().getSystemSettingById({ id })
    )
    return result as any as SystemSetting
  },

  /**
   * Create new systemsetting
   */
  create: async (input: CreateSystemSettingInput): Promise<SystemSetting> => {
    const result = await handleRequest(() =>
        apiClient.systemsettings().createSystemSetting({
          createSystemSettingRequest: input as any
        })
    )
    return result as any as SystemSetting
  },

  /**
   * Update systemsetting
   */
  update: async (id: string, input: CreateSystemSettingInput): Promise<SystemSetting> => {
    const result = await handleRequest(() =>
        apiClient.systemsettings().updateSystemSetting({
          id,
          updateSystemSettingRequest: input as any
        })
    )
    return result as any as SystemSetting
  },

  /**
   * Delete systemsetting
   */
  delete: async (id: string): Promise<void> => {
    await handleRequest(() =>
      apiClient.systemsettings().deleteSystemSetting({ id })
    )
  },
}

// ============================================
// Paymentwebhooks API
// ============================================
export const paymentwebhooks = {
  /**
   * List paymentwebhooks
   */
  list: async (params?: { page?: string; limit?: string }): Promise<PaymentWebhook[]> => {
    const response = await handleRequest(() =>
      apiClient.paymentwebhooks().listPaymentWebhooks(params as any)
    )
    return (response as any).data ?? (response as any) as PaymentWebhook[]
  },

  /**
   * Get paymentwebhook by ID
   */
  getById: async (id: string): Promise<PaymentWebhook> => {
    const result = await handleRequest(() =>
      apiClient.paymentwebhooks().getPaymentWebhookById({ id })
    )
    return result as any as PaymentWebhook
  },

  /**
   * Create new paymentwebhook
   */
  create: async (input: CreatePaymentWebhookInput): Promise<PaymentWebhook> => {
    const result = await handleRequest(() =>
        apiClient.paymentwebhooks().createPaymentWebhook({
          createPaymentWebhookRequest: input as any
        })
    )
    return result as any as PaymentWebhook
  },

  /**
   * Update paymentwebhook
   */
  update: async (id: string, input: CreatePaymentWebhookInput): Promise<PaymentWebhook> => {
    const result = await handleRequest(() =>
        apiClient.paymentwebhooks().updatePaymentWebhook({
          id,
          updatePaymentWebhookRequest: input as any
        })
    )
    return result as any as PaymentWebhook
  },

  /**
   * Delete paymentwebhook
   */
  delete: async (id: string): Promise<void> => {
    await handleRequest(() =>
      apiClient.paymentwebhooks().deletePaymentWebhook({ id })
    )
  },
}

// ============================================
// Paymentmethods API
// ============================================
export const paymentmethods = {
  /**
   * List paymentmethods
   */
  list: async (params?: { page?: string; limit?: string }): Promise<PaymentMethod[]> => {
    const response = await handleRequest(() =>
      apiClient.paymentmethods().listPaymentMethods(params as any)
    )
    return (response as any).data ?? (response as any) as PaymentMethod[]
  },

  /**
   * Get paymentmethod by ID
   */
  getById: async (id: string): Promise<PaymentMethod> => {
    const result = await handleRequest(() =>
      apiClient.paymentmethods().getPaymentMethodById({ id })
    )
    return result as any as PaymentMethod
  },

  /**
   * Create new paymentmethod
   */
  create: async (input: CreatePaymentMethodInput): Promise<PaymentMethod> => {
    const result = await handleRequest(() =>
        apiClient.paymentmethods().createPaymentMethod({
          createPaymentMethodRequest: input as any
        })
    )
    return result as any as PaymentMethod
  },

  /**
   * Update paymentmethod
   */
  update: async (id: string, input: CreatePaymentMethodInput): Promise<PaymentMethod> => {
    const result = await handleRequest(() =>
        apiClient.paymentmethods().updatePaymentMethod({
          id,
          updatePaymentMethodRequest: input as any
        })
    )
    return result as any as PaymentMethod
  },

  /**
   * Delete paymentmethod
   */
  delete: async (id: string): Promise<void> => {
    await handleRequest(() =>
      apiClient.paymentmethods().deletePaymentMethod({ id })
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
  list: async (params?: { page?: string; limit?: string }): Promise<Promotion[]> => {
    const response = await handleRequest(() =>
      apiClient.promotions().listPromotions(params as any)
    )
    return (response as any).data ?? (response as any) as Promotion[]
  },

  /**
   * Get promotion by ID
   */
  getById: async (id: string): Promise<Promotion> => {
    const result = await handleRequest(() =>
      apiClient.promotions().getPromotionById({ id })
    )
    return result as any as Promotion
  },

  /**
   * Create new promotion
   */
  create: async (input: CreatePromotionInput): Promise<Promotion> => {
    const result = await handleRequest(() =>
        apiClient.promotions().createPromotion({
          createPromotionRequest: input as any
        })
    )
    return result as any as Promotion
  },

  /**
   * Update promotion
   */
  update: async (id: string, input: CreatePromotionInput): Promise<Promotion> => {
    const result = await handleRequest(() =>
        apiClient.promotions().updatePromotion({
          id,
          updatePromotionRequest: input as any
        })
    )
    return result as any as Promotion
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

// ============================================
// Promotionredemptions API
// ============================================
export const promotionredemptions = {
  /**
   * List promotionredemptions
   */
  list: async (params?: { page?: string; limit?: string }): Promise<PromotionRedemption[]> => {
    const response = await handleRequest(() =>
      apiClient.promotionredemptions().listPromotionRedemptions(params as any)
    )
    return (response as any).data ?? (response as any) as PromotionRedemption[]
  },

  /**
   * Get promotionredemption by ID
   */
  getById: async (id: string): Promise<PromotionRedemption> => {
    const result = await handleRequest(() =>
      apiClient.promotionredemptions().getPromotionRedemptionById({ id })
    )
    return result as any as PromotionRedemption
  },

  /**
   * Create new promotionredemption
   */
  create: async (input: CreatePromotionRedemptionInput): Promise<PromotionRedemption> => {
    const result = await handleRequest(() =>
        apiClient.promotionredemptions().createPromotionRedemption({
          createPromotionRedemptionRequest: input as any
        })
    )
    return result as any as PromotionRedemption
  },

  /**
   * Update promotionredemption
   */
  update: async (id: string, input: CreatePromotionRedemptionInput): Promise<PromotionRedemption> => {
    const result = await handleRequest(() =>
        apiClient.promotionredemptions().updatePromotionRedemption({
          id,
          updatePromotionRedemptionRequest: input as any
        })
    )
    return result as any as PromotionRedemption
  },

  /**
   * Delete promotionredemption
   */
  delete: async (id: string): Promise<void> => {
    await handleRequest(() =>
      apiClient.promotionredemptions().deletePromotionRedemption({ id })
    )
  },
}

// ============================================
// Posts API
// ============================================
export const posts = {
  /**
   * List posts
   */
  list: async (params?: { page?: string; limit?: string }): Promise<Post[]> => {
    const response = await handleRequest(() =>
      apiClient.posts().listPosts(params as any)
    )
    return (response as any).data ?? (response as any) as Post[]
  },

  /**
   * Get post by ID
   */
  getById: async (id: string): Promise<Post> => {
    const result = await handleRequest(() =>
      apiClient.posts().getPostById({ id })
    )
    return result as any as Post
  },

  /**
   * Create new post
   */
  create: async (input: CreatePostInput): Promise<Post> => {
    const result = await handleRequest(() =>
        apiClient.posts().createPost({
          createPostRequest: input as any
        })
    )
    return result as any as Post
  },

  /**
   * Update post
   */
  update: async (id: string, input: CreatePostInput): Promise<Post> => {
    const result = await handleRequest(() =>
        apiClient.posts().updatePost({
          id,
          updatePostRequest: input as any
        })
    )
    return result as any as Post
  },

  /**
   * Delete post
   */
  delete: async (id: string): Promise<void> => {
    await handleRequest(() =>
      apiClient.posts().deletePost({ id })
    )
  },
}

// ============================================
// Postlikes API
// ============================================
export const postlikes = {
  /**
   * List postlikes
   */
  list: async (params?: { page?: string; limit?: string }): Promise<PostLike[]> => {
    const response = await handleRequest(() =>
      apiClient.postlikes().listPostLikes(params as any)
    )
    return (response as any).data ?? (response as any) as PostLike[]
  },

  /**
   * Get postlike by ID
   */
  getById: async (id: string): Promise<PostLike> => {
    const result = await handleRequest(() =>
      apiClient.postlikes().getPostLikeById({ id })
    )
    return result as any as PostLike
  },

  /**
   * Create new postlike
   */
  create: async (input: CreatePostLikeInput): Promise<PostLike> => {
    const result = await handleRequest(() =>
        apiClient.postlikes().createPostLike({
          createPostLikeRequest: input as any
        })
    )
    return result as any as PostLike
  },

  /**
   * Update postlike
   */
  update: async (id: string, input: CreatePostLikeInput): Promise<PostLike> => {
    const result = await handleRequest(() =>
        apiClient.postlikes().updatePostLike({
          id,
          updatePostLikeRequest: input as any
        })
    )
    return result as any as PostLike
  },

  /**
   * Delete postlike
   */
  delete: async (id: string): Promise<void> => {
    await handleRequest(() =>
      apiClient.postlikes().deletePostLike({ id })
    )
  },
}

// ============================================
// Comments API
// ============================================
export const comments = {
  /**
   * List comments
   */
  list: async (params?: { page?: string; limit?: string }): Promise<Comment[]> => {
    const response = await handleRequest(() =>
      apiClient.comments().listComments(params as any)
    )
    return (response as any).data ?? (response as any) as Comment[]
  },

  /**
   * Get comment by ID
   */
  getById: async (id: string): Promise<Comment> => {
    const result = await handleRequest(() =>
      apiClient.comments().getCommentById({ id })
    )
    return result as any as Comment
  },

  /**
   * Create new comment
   */
  create: async (input: CreateCommentInput): Promise<Comment> => {
    const result = await handleRequest(() =>
        apiClient.comments().createComment({
          createCommentRequest: input as any
        })
    )
    return result as any as Comment
  },

  /**
   * Update comment
   */
  update: async (id: string, input: CreateCommentInput): Promise<Comment> => {
    const result = await handleRequest(() =>
        apiClient.comments().updateComment({
          id,
          updateCommentRequest: input as any
        })
    )
    return result as any as Comment
  },

  /**
   * Delete comment
   */
  delete: async (id: string): Promise<void> => {
    await handleRequest(() =>
      apiClient.comments().deleteComment({ id })
    )
  },
}

// ============================================
// Affiliates API
// ============================================
export const affiliates = {
  /**
   * List affiliates
   */
  list: async (params?: { page?: string; limit?: string }): Promise<Affiliate[]> => {
    const response = await handleRequest(() =>
      apiClient.affiliates().listAffiliates(params as any)
    )
    return (response as any).data ?? (response as any) as Affiliate[]
  },

  /**
   * Get affiliate by ID
   */
  getById: async (id: string): Promise<Affiliate> => {
    const result = await handleRequest(() =>
      apiClient.affiliates().getAffiliateById({ id })
    )
    return result as any as Affiliate
  },

  /**
   * Create new affiliate
   */
  create: async (input: CreateAffiliateInput): Promise<Affiliate> => {
    const result = await handleRequest(() =>
        apiClient.affiliates().createAffiliate({
          createAffiliateRequest: input as any
        })
    )
    return result as any as Affiliate
  },

  /**
   * Update affiliate
   */
  update: async (id: string, input: CreateAffiliateInput): Promise<Affiliate> => {
    const result = await handleRequest(() =>
        apiClient.affiliates().updateAffiliate({
          id,
          updateAffiliateRequest: input as any
        })
    )
    return result as any as Affiliate
  },

  /**
   * Delete affiliate
   */
  delete: async (id: string): Promise<void> => {
    await handleRequest(() =>
      apiClient.affiliates().deleteAffiliate({ id })
    )
  },
}

// ============================================
// Commissions API
// ============================================
export const commissions = {
  /**
   * List commissions
   */
  list: async (params?: { page?: string; limit?: string }): Promise<Commission[]> => {
    const response = await handleRequest(() =>
      apiClient.commissions().listCommissions(params as any)
    )
    return (response as any).data ?? (response as any) as Commission[]
  },

  /**
   * Get commission by ID
   */
  getById: async (id: string): Promise<Commission> => {
    const result = await handleRequest(() =>
      apiClient.commissions().getCommissionById({ id })
    )
    return result as any as Commission
  },

  /**
   * Create new commission
   */
  create: async (input: CreateCommissionInput): Promise<Commission> => {
    const result = await handleRequest(() =>
        apiClient.commissions().createCommission({
          createCommissionRequest: input as any
        })
    )
    return result as any as Commission
  },

  /**
   * Update commission
   */
  update: async (id: string, input: CreateCommissionInput): Promise<Commission> => {
    const result = await handleRequest(() =>
        apiClient.commissions().updateCommission({
          id,
          updateCommissionRequest: input as any
        })
    )
    return result as any as Commission
  },

  /**
   * Delete commission
   */
  delete: async (id: string): Promise<void> => {
    await handleRequest(() =>
      apiClient.commissions().deleteCommission({ id })
    )
  },
}

// ============================================
// Affiliatepayouts API
// ============================================
export const affiliatepayouts = {
  /**
   * List affiliatepayouts
   */
  list: async (params?: { page?: string; limit?: string }): Promise<AffiliatePayout[]> => {
    const response = await handleRequest(() =>
      apiClient.affiliatepayouts().listAffiliatePayouts(params as any)
    )
    return (response as any).data ?? (response as any) as AffiliatePayout[]
  },

  /**
   * Get affiliatepayout by ID
   */
  getById: async (id: string): Promise<AffiliatePayout> => {
    const result = await handleRequest(() =>
      apiClient.affiliatepayouts().getAffiliatePayoutById({ id })
    )
    return result as any as AffiliatePayout
  },

  /**
   * Create new affiliatepayout
   */
  create: async (input: CreateAffiliatePayoutInput): Promise<AffiliatePayout> => {
    const result = await handleRequest(() =>
        apiClient.affiliatepayouts().createAffiliatePayout({
          createAffiliatePayoutRequest: input as any
        })
    )
    return result as any as AffiliatePayout
  },

  /**
   * Update affiliatepayout
   */
  update: async (id: string, input: CreateAffiliatePayoutInput): Promise<AffiliatePayout> => {
    const result = await handleRequest(() =>
        apiClient.affiliatepayouts().updateAffiliatePayout({
          id,
          updateAffiliatePayoutRequest: input as any
        })
    )
    return result as any as AffiliatePayout
  },

  /**
   * Delete affiliatepayout
   */
  delete: async (id: string): Promise<void> => {
    await handleRequest(() =>
      apiClient.affiliatepayouts().deleteAffiliatePayout({ id })
    )
  },
}

// ============================================
// Deliveryzones API
// ============================================
export const deliveryzones = {
  /**
   * List deliveryzones
   */
  list: async (params?: { page?: string; limit?: string }): Promise<DeliveryZone[]> => {
    const response = await handleRequest(() =>
      apiClient.deliveryzones().listDeliveryZones(params as any)
    )
    return (response as any).data ?? (response as any) as DeliveryZone[]
  },

  /**
   * Get deliveryzone by ID
   */
  getById: async (id: string): Promise<DeliveryZone> => {
    const result = await handleRequest(() =>
      apiClient.deliveryzones().getDeliveryZoneById({ id })
    )
    return result as any as DeliveryZone
  },

  /**
   * Create new deliveryzone
   */
  create: async (input: CreateDeliveryZoneInput): Promise<DeliveryZone> => {
    const result = await handleRequest(() =>
        apiClient.deliveryzones().createDeliveryZone({
          createDeliveryZoneRequest: input as any
        })
    )
    return result as any as DeliveryZone
  },

  /**
   * Update deliveryzone
   */
  update: async (id: string, input: CreateDeliveryZoneInput): Promise<DeliveryZone> => {
    const result = await handleRequest(() =>
        apiClient.deliveryzones().updateDeliveryZone({
          id,
          updateDeliveryZoneRequest: input as any
        })
    )
    return result as any as DeliveryZone
  },

  /**
   * Delete deliveryzone
   */
  delete: async (id: string): Promise<void> => {
    await handleRequest(() =>
      apiClient.deliveryzones().deleteDeliveryZone({ id })
    )
  },
}

// ============================================
// Vendorverifications API
// ============================================
export const vendorverifications = {
  /**
   * List vendorverifications
   */
  list: async (params?: { page?: string; limit?: string }): Promise<VendorVerification[]> => {
    const response = await handleRequest(() =>
      apiClient.vendorverifications().listVendorVerifications(params as any)
    )
    return (response as any).data ?? (response as any) as VendorVerification[]
  },

  /**
   * Get vendorverification by ID
   */
  getById: async (id: string): Promise<VendorVerification> => {
    const result = await handleRequest(() =>
      apiClient.vendorverifications().getVendorVerificationById({ id })
    )
    return result as any as VendorVerification
  },

  /**
   * Create new vendorverification
   */
  create: async (input: CreateVendorVerificationInput): Promise<VendorVerification> => {
    const result = await handleRequest(() =>
        apiClient.vendorverifications().createVendorVerification({
          createVendorVerificationRequest: input as any
        })
    )
    return result as any as VendorVerification
  },

  /**
   * Update vendorverification
   */
  update: async (id: string, input: CreateVendorVerificationInput): Promise<VendorVerification> => {
    const result = await handleRequest(() =>
        apiClient.vendorverifications().updateVendorVerification({
          id,
          updateVendorVerificationRequest: input as any
        })
    )
    return result as any as VendorVerification
  },

  /**
   * Delete vendorverification
   */
  delete: async (id: string): Promise<void> => {
    await handleRequest(() =>
      apiClient.vendorverifications().deleteVendorVerification({ id })
    )
  },
}

// ============================================
// Teammembers API
// ============================================
export const teammembers = {
  /**
   * List teammembers
   */
  list: async (params?: { page?: string; limit?: string }): Promise<TeamMember[]> => {
    const response = await handleRequest(() =>
      apiClient.teammembers().listTeamMembers(params as any)
    )
    return (response as any).data ?? (response as any) as TeamMember[]
  },

  /**
   * Get teammember by ID
   */
  getById: async (id: string): Promise<TeamMember> => {
    const result = await handleRequest(() =>
      apiClient.teammembers().getTeamMemberById({ id })
    )
    return result as any as TeamMember
  },

  /**
   * Create new teammember
   */
  create: async (input: CreateTeamMemberInput): Promise<TeamMember> => {
    const result = await handleRequest(() =>
        apiClient.teammembers().createTeamMember({
          createTeamMemberRequest: input as any
        })
    )
    return result as any as TeamMember
  },

  /**
   * Update teammember
   */
  update: async (id: string, input: CreateTeamMemberInput): Promise<TeamMember> => {
    const result = await handleRequest(() =>
        apiClient.teammembers().updateTeamMember({
          id,
          updateTeamMemberRequest: input as any
        })
    )
    return result as any as TeamMember
  },

  /**
   * Delete teammember
   */
  delete: async (id: string): Promise<void> => {
    await handleRequest(() =>
      apiClient.teammembers().deleteTeamMember({ id })
    )
  },
}

// ============================================
// Invitations API
// ============================================
export const invitations = {
  /**
   * List invitations
   */
  list: async (params?: { page?: string; limit?: string }): Promise<Invitation[]> => {
    const response = await handleRequest(() =>
      apiClient.invitations().listInvitations(params as any)
    )
    return (response as any).data ?? (response as any) as Invitation[]
  },

  /**
   * Get invitation by ID
   */
  getById: async (id: string): Promise<Invitation> => {
    const result = await handleRequest(() =>
      apiClient.invitations().getInvitationById({ id })
    )
    return result as any as Invitation
  },

  /**
   * Create new invitation
   */
  create: async (input: CreateInvitationInput): Promise<Invitation> => {
    const result = await handleRequest(() =>
        apiClient.invitations().createInvitation({
          createInvitationRequest: input as any
        })
    )
    return result as any as Invitation
  },

  /**
   * Update invitation
   */
  update: async (id: string, input: CreateInvitationInput): Promise<Invitation> => {
    const result = await handleRequest(() =>
        apiClient.invitations().updateInvitation({
          id,
          updateInvitationRequest: input as any
        })
    )
    return result as any as Invitation
  },

  /**
   * Delete invitation
   */
  delete: async (id: string): Promise<void> => {
    await handleRequest(() =>
      apiClient.invitations().deleteInvitation({ id })
    )
  },
}

// ============================================
// Favoritestores API
// ============================================
export const favoritestores = {
  /**
   * List favoritestores
   */
  list: async (params?: { page?: string; limit?: string }): Promise<FavoriteStore[]> => {
    const response = await handleRequest(() =>
      apiClient.favoritestores().listFavoriteStores(params as any)
    )
    return (response as any).data ?? (response as any) as FavoriteStore[]
  },

  /**
   * Get favoritestore by ID
   */
  getById: async (id: string): Promise<FavoriteStore> => {
    const result = await handleRequest(() =>
      apiClient.favoritestores().getFavoriteStoreById({ id })
    )
    return result as any as FavoriteStore
  },

  /**
   * Create new favoritestore
   */
  create: async (input: CreateFavoriteStoreInput): Promise<FavoriteStore> => {
    const result = await handleRequest(() =>
        apiClient.favoritestores().createFavoriteStore({
          createFavoriteStoreRequest: input as any
        })
    )
    return result as any as FavoriteStore
  },

  /**
   * Update favoritestore
   */
  update: async (id: string, input: CreateFavoriteStoreInput): Promise<FavoriteStore> => {
    const result = await handleRequest(() =>
        apiClient.favoritestores().updateFavoriteStore({
          id,
          updateFavoriteStoreRequest: input as any
        })
    )
    return result as any as FavoriteStore
  },

  /**
   * Delete favoritestore
   */
  delete: async (id: string): Promise<void> => {
    await handleRequest(() =>
      apiClient.favoritestores().deleteFavoriteStore({ id })
    )
  },
}

// ============================================
// Favoriteitems API
// ============================================
export const favoriteitems = {
  /**
   * List favoriteitems
   */
  list: async (params?: { page?: string; limit?: string }): Promise<FavoriteItem[]> => {
    const response = await handleRequest(() =>
      apiClient.favoriteitems().listFavoriteItems(params as any)
    )
    return (response as any).data ?? (response as any) as FavoriteItem[]
  },

  /**
   * Get favoriteitem by ID
   */
  getById: async (id: string): Promise<FavoriteItem> => {
    const result = await handleRequest(() =>
      apiClient.favoriteitems().getFavoriteItemById({ id })
    )
    return result as any as FavoriteItem
  },

  /**
   * Create new favoriteitem
   */
  create: async (input: CreateFavoriteItemInput): Promise<FavoriteItem> => {
    const result = await handleRequest(() =>
        apiClient.favoriteitems().createFavoriteItem({
          createFavoriteItemRequest: input as any
        })
    )
    return result as any as FavoriteItem
  },

  /**
   * Update favoriteitem
   */
  update: async (id: string, input: CreateFavoriteItemInput): Promise<FavoriteItem> => {
    const result = await handleRequest(() =>
        apiClient.favoriteitems().updateFavoriteItem({
          id,
          updateFavoriteItemRequest: input as any
        })
    )
    return result as any as FavoriteItem
  },

  /**
   * Delete favoriteitem
   */
  delete: async (id: string): Promise<void> => {
    await handleRequest(() =>
      apiClient.favoriteitems().deleteFavoriteItem({ id })
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
// Bundleitems API
// ============================================
export const bundleitems = {
  /**
   * List bundleitems
   */
  list: async (params?: { page?: string; limit?: string }): Promise<BundleItem[]> => {
    const response = await handleRequest(() =>
      apiClient.bundleitems().listBundleItems(params as any)
    )
    return (response as any).data ?? (response as any) as BundleItem[]
  },

  /**
   * Get bundleitem by ID
   */
  getById: async (id: string): Promise<BundleItem> => {
    const result = await handleRequest(() =>
      apiClient.bundleitems().getBundleItemById({ id })
    )
    return result as any as BundleItem
  },

  /**
   * Create new bundleitem
   */
  create: async (input: CreateBundleItemInput): Promise<BundleItem> => {
    const result = await handleRequest(() =>
        apiClient.bundleitems().createBundleItem({
          createBundleItemRequest: input as any
        })
    )
    return result as any as BundleItem
  },

  /**
   * Update bundleitem
   */
  update: async (id: string, input: CreateBundleItemInput): Promise<BundleItem> => {
    const result = await handleRequest(() =>
        apiClient.bundleitems().updateBundleItem({
          id,
          updateBundleItemRequest: input as any
        })
    )
    return result as any as BundleItem
  },

  /**
   * Delete bundleitem
   */
  delete: async (id: string): Promise<void> => {
    await handleRequest(() =>
      apiClient.bundleitems().deleteBundleItem({ id })
    )
  },
}

// ============================================
// Bundlepricings API
// ============================================
export const bundlepricings = {
  /**
   * List bundlepricings
   */
  list: async (params?: { page?: string; limit?: string }): Promise<BundlePricing[]> => {
    const response = await handleRequest(() =>
      apiClient.bundlepricings().listBundlePricings(params as any)
    )
    return (response as any).data ?? (response as any) as BundlePricing[]
  },

  /**
   * Get bundlepricing by ID
   */
  getById: async (id: string): Promise<BundlePricing> => {
    const result = await handleRequest(() =>
      apiClient.bundlepricings().getBundlePricingById({ id })
    )
    return result as any as BundlePricing
  },

  /**
   * Create new bundlepricing
   */
  create: async (input: CreateBundlePricingInput): Promise<BundlePricing> => {
    const result = await handleRequest(() =>
        apiClient.bundlepricings().createBundlePricing({
          createBundlePricingRequest: input as any
        })
    )
    return result as any as BundlePricing
  },

  /**
   * Update bundlepricing
   */
  update: async (id: string, input: CreateBundlePricingInput): Promise<BundlePricing> => {
    const result = await handleRequest(() =>
        apiClient.bundlepricings().updateBundlePricing({
          id,
          updateBundlePricingRequest: input as any
        })
    )
    return result as any as BundlePricing
  },

  /**
   * Delete bundlepricing
   */
  delete: async (id: string): Promise<void> => {
    await handleRequest(() =>
      apiClient.bundlepricings().deleteBundlePricing({ id })
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
