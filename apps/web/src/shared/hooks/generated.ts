// @ts-nocheck
/**
 * Auto-Generated Resource Hooks
 * ⚠️  DO NOT EDIT MANUALLY
 * Generated from: api wrapper using generic hook factory
 * 
 * 🚫 DEPRECATED: DO NOT USE DIRECTLY IN UI
 * Use canonical hooks from @shared/hooks/hooks/useStores.ts instead
 * 
 * To regenerate: pnpm gen:hooks
 */
import { createResourceHooks } from './hooks/createResourceHooks'
import * as apiWrapper from '@api/apiWrapper'
import type { 
  User, StoreResponse as Store, GeocodingCache, ItemResponse as Item, MediaAsset, Cart, CartItem, OrderResponse as Order, OrderItem, OrderEvent, Tip, AddressResponse as Address, SystemSetting, PaymentWebhook, PaymentMethod, Promotion, PromotionRedemption, Post, PostLike, Comment, Affiliate, Commission, AffiliatePayout, DeliveryZone, VendorVerification, TeamMember, Invitation, FavoriteStore, FavoriteItem, Bundle, BundleItem, BundlePricing,
} from '@api/types'
import type { 
  CreateUserInput, CreateStoreInput, CreateGeocodingCacheInput, CreateItemInput, CreateMediaAssetInput, CreateCartInput, CreateCartItemInput, CreateOrderInput, CreateOrderItemInput, CreateOrderEventInput, CreateTipInput, CreateAddressInput, CreateSystemSettingInput, CreatePaymentWebhookInput, CreatePaymentMethodInput, CreatePromotionInput, CreatePromotionRedemptionInput, CreatePostInput, CreatePostLikeInput, CreateCommentInput, CreateAffiliateInput, CreateCommissionInput, CreateAffiliatePayoutInput, CreateDeliveryZoneInput, CreateVendorVerificationInput, CreateTeamMemberInput, CreateInvitationInput, CreateFavoriteStoreInput, CreateFavoriteItemInput, CreateBundleInput, CreateBundleItemInput, CreateBundlePricingInput,
} from '@api/types'

// ============================================
// Users Hooks
// ============================================
const usersHooks = createResourceHooks<User, CreateUserInput>('users', apiWrapper.users)

/**
 * Fetch list of users
 * @param Query parameters for filtering and pagination
 * @returns React Query result with users data
 * @example const { data: users } = useUsers(params)
 */
export const useUsers = usersHooks.useList

/**
 * Fetch single user by ID
 * @param id User ID
 * @returns React Query result with user data
 * @example const { data: user } = useUser('user-123')
 */
export const useUser = usersHooks.useGet

/**
 * Create new user
 * @returns React Query mutation for creating user
 * @example const createUser = useCreateUser(); createUser.mutate(userData)
 */
export const useCreateUser = usersHooks.useCreate

/**
 * Update existing user
 * @returns React Query mutation for updating user
 * @example const updateUser = useUpdateUser(); updateUser.mutate({ id, ...userData })
 */
export const useUpdateUser = usersHooks.useUpdate

/**
 * Delete user
 * @returns React Query mutation for deleting user
 * @example const deleteUser = useDeleteUser(); deleteUser.mutate('user-123')
 */
export const useDeleteUser = usersHooks.useDelete

// ============================================
// Stores Hooks
// ============================================
const storesHooks = createResourceHooks<Store, CreateStoreInput>('stores', apiWrapper.stores)

/**
 * Fetch list of stores
 * @param Query parameters for filtering and pagination
 * @returns React Query result with stores data
 * @example const { data: stores } = useStores(params)
 */
export const useStores = storesHooks.useList

/**
 * Fetch single store by ID
 * @param id Store ID
 * @returns React Query result with store data
 * @example const { data: store } = useStore('store-123')
 */
export const useStore = storesHooks.useGet

/**
 * Create new store
 * @returns React Query mutation for creating store
 * @example const createStore = useCreateStore(); createStore.mutate(storeData)
 */
export const useCreateStore = storesHooks.useCreate

/**
 * Update existing store
 * @returns React Query mutation for updating store
 * @example const updateStore = useUpdateStore(); updateStore.mutate({ id, ...storeData })
 */
export const useUpdateStore = storesHooks.useUpdate

/**
 * Delete store
 * @returns React Query mutation for deleting store
 * @example const deleteStore = useDeleteStore(); deleteStore.mutate('store-123')
 */
export const useDeleteStore = storesHooks.useDelete

// ============================================
// Items Hooks
// ============================================
const itemsHooks = createResourceHooks<Item, CreateItemInput>('items', apiWrapper.items)

/**
 * Fetch list of items
 * @param Query parameters for filtering and pagination
 * @returns React Query result with items data
 * @example const { data: items } = useItems(params)
 */
export const useItems = itemsHooks.useList

/**
 * Fetch single item by ID
 * @param id Item ID
 * @returns React Query result with item data
 * @example const { data: item } = useItem('item-123')
 */
export const useItem = itemsHooks.useGet

/**
 * Create new item
 * @returns React Query mutation for creating item
 * @example const createItem = useCreateItem(); createItem.mutate(itemData)
 */
export const useCreateItem = itemsHooks.useCreate

/**
 * Update existing item
 * @returns React Query mutation for updating item
 * @example const updateItem = useUpdateItem(); updateItem.mutate({ id, ...itemData })
 */
export const useUpdateItem = itemsHooks.useUpdate

/**
 * Delete item
 * @returns React Query mutation for deleting item
 * @example const deleteItem = useDeleteItem(); deleteItem.mutate('item-123')
 */
export const useDeleteItem = itemsHooks.useDelete

// ============================================
// Orders Hooks
// ============================================
const ordersHooks = createResourceHooks<Order, CreateOrderInput>('orders', apiWrapper.orders)

/**
 * Fetch list of orders
 * @param Query parameters for filtering and pagination
 * @returns React Query result with orders data
 * @example const { data: orders } = useOrders(params)
 */
export const useOrders = ordersHooks.useList

/**
 * Fetch single order by ID
 * @param id Order ID
 * @returns React Query result with order data
 * @example const { data: order } = useOrder('order-123')
 */
export const useOrder = ordersHooks.useGet

/**
 * Create new order
 * @returns React Query mutation for creating order
 * @example const createOrder = useCreateOrder(); createOrder.mutate(orderData)
 */
export const useCreateOrder = ordersHooks.useCreate

/**
 * Update existing order
 * @returns React Query mutation for updating order
 * @example const updateOrder = useUpdateOrder(); updateOrder.mutate({ id, ...orderData })
 */
export const useUpdateOrder = ordersHooks.useUpdate

/**
 * Delete order
 * @returns React Query mutation for deleting order
 * @example const deleteOrder = useDeleteOrder(); deleteOrder.mutate('order-123')
 */
export const useDeleteOrder = ordersHooks.useDelete

// ============================================
// Bundles Hooks
// ============================================
const bundlesHooks = createResourceHooks<Bundle, CreateBundleInput>('bundles', apiWrapper.bundles)

/**
 * Fetch list of bundles
 * @param Query parameters for filtering and pagination
 * @returns React Query result with bundles data
 * @example const { data: bundles } = useBundles(params)
 */
export const useBundles = bundlesHooks.useList

/**
 * Fetch single bundle by ID
 * @param id Bundle ID
 * @returns React Query result with bundle data
 * @example const { data: bundle } = useBundle('bundle-123')
 */
export const useBundle = bundlesHooks.useGet

/**
 * Create new bundle
 * @returns React Query mutation for creating bundle
 * @example const createBundle = useCreateBundle(); createBundle.mutate(bundleData)
 */
export const useCreateBundle = bundlesHooks.useCreate

/**
 * Update existing bundle
 * @returns React Query mutation for updating bundle
 * @example const updateBundle = useUpdateBundle(); updateBundle.mutate({ id, ...bundleData })
 */
export const useUpdateBundle = bundlesHooks.useUpdate

/**
 * Delete bundle
 * @returns React Query mutation for deleting bundle
 * @example const deleteBundle = useDeleteBundle(); deleteBundle.mutate('bundle-123')
 */
export const useDeleteBundle = bundlesHooks.useDelete

// ============================================
// Media Assets Hooks
// ============================================
const mediaAssetsHooks = createResourceHooks<MediaAsset, CreateMediaAssetInput>('mediaAssets', apiWrapper.mediaAssets)

/**
 * Fetch list of media assets
 * @param Query parameters for filtering and pagination
 * @returns React Query result with media assets data
 * @example const { data: mediaAssets } = useMediaAssets(params)
 */
export const useMediaAssets = mediaAssetsHooks.useList

/**
 * Fetch single media asset by ID
 * @param id Media Asset ID
 * @returns React Query result with media asset data
 * @example const { data: mediaAsset } = useMediaAsset('media-123')
 */
export const useMediaAsset = mediaAssetsHooks.useGet

/**
 * Create new media asset
 * @returns React Query mutation for creating media asset
 * @example const createMediaAsset = useCreateMediaAsset(); createMediaAsset.mutate(mediaAssetData)
 */
export const useCreateMediaAsset = mediaAssetsHooks.useCreate

/**
 * Update existing media asset
 * @returns React Query mutation for updating media asset
 * @example const updateMediaAsset = useUpdateMediaAsset(); updateMediaAsset.mutate({ id, ...mediaAssetData })
 */
export const useUpdateMediaAsset = mediaAssetsHooks.useUpdate

/**
 * Delete media asset
 * @returns React Query mutation for deleting media asset
 * @example const deleteMediaAsset = useDeleteMediaAsset(); deleteMediaAsset.mutate('media-123')
 */
export const useDeleteMediaAsset = mediaAssetsHooks.useDelete

// ============================================
// Cart Hooks
// ============================================
const cartsHooks = createResourceHooks<Cart, CreateCartInput>('carts', apiWrapper.carts)

/**
 * Fetch list of carts
 * @param Query parameters for filtering and pagination
 * @returns React Query result with carts data
 * @example const { data: carts } = useCarts(params)
 */
export const useCarts = cartsHooks.useList

/**
 * Fetch single cart by ID
 * @param id Cart ID
 * @returns React Query result with cart data
 * @example const { data: cart } = useCart('cart-123')
 */
export const useCart = cartsHooks.useGet

/**
 * Create new cart
 * @returns React Query mutation for creating cart
 * @example const createCart = useCreateCart(); createCart.mutate(cartData)
 */
export const useCreateCart = cartsHooks.useCreate

/**
 * Update existing cart
 * @returns React Query mutation for updating cart
 * @example const updateCart = useUpdateCart(); updateCart.mutate({ id, ...cartData })
 */
export const useUpdateCart = cartsHooks.useUpdate

/**
 * Delete cart
 * @returns React Query mutation for deleting cart
 * @example const deleteCart = useDeleteCart(); deleteCart.mutate('cart-123')
 */
export const useDeleteCart = cartsHooks.useDelete

// ============================================
// Addresses Hooks
// ============================================
const addressesHooks = createResourceHooks<Address, CreateAddressInput>('addresses', apiWrapper.addresses)

/**
 * Fetch list of addresses
 * @param Query parameters for filtering and pagination
 * @returns React Query result with addresses data
 * @example const { data: addresses } = useAddresses(params)
 */
export const useAddresses = addressesHooks.useList

/**
 * Fetch single address by ID
 * @param id Address ID
 * @returns React Query result with address data
 * @example const { data: address } = useAddress('address-123')
 */
export const useAddress = addressesHooks.useGet

/**
 * Create new address
 * @returns React Query mutation for creating address
 * @example const createAddress = useCreateAddress(); createAddress.mutate(addressData)
 */
export const useCreateAddress = addressesHooks.useCreate

/**
 * Update existing address
 * @returns React Query mutation for updating address
 * @example const updateAddress = useUpdateAddress(); updateAddress.mutate({ id, ...addressData })
 */
export const useUpdateAddress = addressesHooks.useUpdate

/**
 * Delete address
 * @returns React Query mutation for deleting address
 * @example const deleteAddress = useDeleteAddress(); deleteAddress.mutate('address-123')
 */
export const useDeleteAddress = addressesHooks.useDelete

// ============================================
// Posts Hooks
// ============================================
const postsHooks = createResourceHooks<Post, CreatePostInput>('posts', apiWrapper.posts)

/**
 * Fetch list of posts
 * @param Query parameters for filtering and pagination
 * @returns React Query result with posts data
 * @example const { data: posts } = usePosts(params)
 */
export const usePosts = postsHooks.useList

/**
 * Fetch single post by ID
 * @param id Post ID
 * @returns React Query result with post data
 * @example const { data: post } = usePost('post-123')
 */
export const usePost = postsHooks.useGet

/**
 * Create new post
 * @returns React Query mutation for creating post
 * @example const createPost = useCreatePost(); createPost.mutate(postData)
 */
export const useCreatePost = postsHooks.useCreate

/**
 * Update existing post
 * @returns React Query mutation for updating post
 * @example const updatePost = useUpdatePost(); updatePost.mutate({ id, ...postData })
 */
export const useUpdatePost = postsHooks.useUpdate

/**
 * Delete post
 * @returns React Query mutation for deleting post
 * @example const deletePost = useDeletePost(); deletePost.mutate('post-123')
 */
export const useDeletePost = postsHooks.useDelete
