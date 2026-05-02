/**
 * Auto-Generated Resource Hooks
 * ⚠️  DO NOT EDIT MANUALLY
 * Generated from: api wrapper using generic hook factory
 * 
 * To regenerate: pnpm gen:hooks
 */
import { createResourceHooks } from './createResourceHooks'
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
 * @param Unique identifier for the user
 * @returns React Query result with user data
 * @example const { data: user } = useUser(id)
 */
export const useUser = usersHooks.useOne

/**
 * Create new user
 * @param Input data for creating the user
 * @returns React Query result with user data
 * @example const { mutate: create } = useCreateUser()
 */
export const useCreateUser = usersHooks.useCreate

/**
 * Update user
 * @param Input data for updating the user
 * @returns React Query result with user data
 * @example const { mutate: update } = useUpdateUser()
 */
export const useUpdateUser = usersHooks.useUpdate

/**
 * Delete user
 * @param ID of the user to delete
 * @returns React Query result with user data
 * @example const { mutate: deleteItem } = useDeleteUser()
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
 * @param Unique identifier for the store
 * @returns React Query result with store data
 * @example const { data: store } = useStore(id)
 */
export const useStore = storesHooks.useOne

/**
 * Create new store
 * @param Input data for creating the store
 * @returns React Query result with store data
 * @example const { mutate: create } = useCreateStore()
 */
export const useCreateStore = storesHooks.useCreate

/**
 * Update store
 * @param Input data for updating the store
 * @returns React Query result with store data
 * @example const { mutate: update } = useUpdateStore()
 */
export const useUpdateStore = storesHooks.useUpdate

/**
 * Delete store
 * @param ID of the store to delete
 * @returns React Query result with store data
 * @example const { mutate: deleteItem } = useDeleteStore()
 */
export const useDeleteStore = storesHooks.useDelete

// ============================================
// Geocodingcaches Hooks
// ============================================
const geocodingcachesHooks = createResourceHooks<GeocodingCache, CreateGeocodingCacheInput>('geocodingcaches', apiWrapper.geocodingcaches)

/**
 * Fetch list of geocodingcaches
 * @param Query parameters for filtering and pagination
 * @returns React Query result with geocodingcaches data
 * @example const { data: geocodingcaches } = useGeocodingCaches(params)
 */
export const useGeocodingCaches = geocodingcachesHooks.useList

/**
 * Fetch single geocodingcache by ID
 * @param Unique identifier for the geocodingcache
 * @returns React Query result with geocodingcache data
 * @example const { data: geocodingcache } = useGeocodingCache(id)
 */
export const useGeocodingCache = geocodingcachesHooks.useOne

/**
 * Create new geocodingcache
 * @param Input data for creating the geocodingcache
 * @returns React Query result with geocodingcache data
 * @example const { mutate: create } = useCreateGeocodingCache()
 */
export const useCreateGeocodingCache = geocodingcachesHooks.useCreate

/**
 * Update geocodingcache
 * @param Input data for updating the geocodingcache
 * @returns React Query result with geocodingcache data
 * @example const { mutate: update } = useUpdateGeocodingCache()
 */
export const useUpdateGeocodingCache = geocodingcachesHooks.useUpdate

/**
 * Delete geocodingcache
 * @param ID of the geocodingcache to delete
 * @returns React Query result with geocodingcache data
 * @example const { mutate: deleteItem } = useDeleteGeocodingCache()
 */
export const useDeleteGeocodingCache = geocodingcachesHooks.useDelete

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
 * @param Unique identifier for the item
 * @returns React Query result with item data
 * @example const { data: item } = useItem(id)
 */
export const useItem = itemsHooks.useOne

/**
 * Create new item
 * @param Input data for creating the item
 * @returns React Query result with item data
 * @example const { mutate: create } = useCreateItem()
 */
export const useCreateItem = itemsHooks.useCreate

/**
 * Update item
 * @param Input data for updating the item
 * @returns React Query result with item data
 * @example const { mutate: update } = useUpdateItem()
 */
export const useUpdateItem = itemsHooks.useUpdate

/**
 * Delete item
 * @param ID of the item to delete
 * @returns React Query result with item data
 * @example const { mutate: deleteItem } = useDeleteItem()
 */
export const useDeleteItem = itemsHooks.useDelete

// ============================================
// Mediaassets Hooks
// ============================================
const mediaassetsHooks = createResourceHooks<MediaAsset, CreateMediaAssetInput>('mediaassets', apiWrapper.mediaassets)

/**
 * Fetch list of mediaassets
 * @param Query parameters for filtering and pagination
 * @returns React Query result with mediaassets data
 * @example const { data: mediaassets } = useMediaAssets(params)
 */
export const useMediaAssets = mediaassetsHooks.useList

/**
 * Fetch single mediaasset by ID
 * @param Unique identifier for the mediaasset
 * @returns React Query result with mediaasset data
 * @example const { data: mediaasset } = useMediaAsset(id)
 */
export const useMediaAsset = mediaassetsHooks.useOne

/**
 * Create new mediaasset
 * @param Input data for creating the mediaasset
 * @returns React Query result with mediaasset data
 * @example const { mutate: create } = useCreateMediaAsset()
 */
export const useCreateMediaAsset = mediaassetsHooks.useCreate

/**
 * Update mediaasset
 * @param Input data for updating the mediaasset
 * @returns React Query result with mediaasset data
 * @example const { mutate: update } = useUpdateMediaAsset()
 */
export const useUpdateMediaAsset = mediaassetsHooks.useUpdate

/**
 * Delete mediaasset
 * @param ID of the mediaasset to delete
 * @returns React Query result with mediaasset data
 * @example const { mutate: deleteItem } = useDeleteMediaAsset()
 */
export const useDeleteMediaAsset = mediaassetsHooks.useDelete

// ============================================
// Carts Hooks
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
 * @param Unique identifier for the cart
 * @returns React Query result with cart data
 * @example const { data: cart } = useCart(id)
 */
export const useCart = cartsHooks.useOne

/**
 * Create new cart
 * @param Input data for creating the cart
 * @returns React Query result with cart data
 * @example const { mutate: create } = useCreateCart()
 */
export const useCreateCart = cartsHooks.useCreate

/**
 * Update cart
 * @param Input data for updating the cart
 * @returns React Query result with cart data
 * @example const { mutate: update } = useUpdateCart()
 */
export const useUpdateCart = cartsHooks.useUpdate

/**
 * Delete cart
 * @param ID of the cart to delete
 * @returns React Query result with cart data
 * @example const { mutate: deleteItem } = useDeleteCart()
 */
export const useDeleteCart = cartsHooks.useDelete

// ============================================
// Cartitems Hooks
// ============================================
const cartitemsHooks = createResourceHooks<CartItem, CreateCartItemInput>('cartitems', apiWrapper.cartitems)

/**
 * Fetch list of cartitems
 * @param Query parameters for filtering and pagination
 * @returns React Query result with cartitems data
 * @example const { data: cartitems } = useCartItems(params)
 */
export const useCartItems = cartitemsHooks.useList

/**
 * Fetch single cartitem by ID
 * @param Unique identifier for the cartitem
 * @returns React Query result with cartitem data
 * @example const { data: cartitem } = useCartItem(id)
 */
export const useCartItem = cartitemsHooks.useOne

/**
 * Create new cartitem
 * @param Input data for creating the cartitem
 * @returns React Query result with cartitem data
 * @example const { mutate: create } = useCreateCartItem()
 */
export const useCreateCartItem = cartitemsHooks.useCreate

/**
 * Update cartitem
 * @param Input data for updating the cartitem
 * @returns React Query result with cartitem data
 * @example const { mutate: update } = useUpdateCartItem()
 */
export const useUpdateCartItem = cartitemsHooks.useUpdate

/**
 * Delete cartitem
 * @param ID of the cartitem to delete
 * @returns React Query result with cartitem data
 * @example const { mutate: deleteItem } = useDeleteCartItem()
 */
export const useDeleteCartItem = cartitemsHooks.useDelete

// ============================================
// Orders Hooks
// ============================================
// @ts-expect-error - Custom update signature, acceptable (works at runtime)
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
 * @param Unique identifier for the order
 * @returns React Query result with order data
 * @example const { data: order } = useOrder(id)
 */
export const useOrder = ordersHooks.useOne

/**
 * Create new order
 * @param Input data for creating the order
 * @returns React Query result with order data
 * @example const { mutate: create } = useCreateOrder()
 */
export const useCreateOrder = ordersHooks.useCreate

/**
 * Update order
 * @param Input data for updating the order
 * @returns React Query result with order data
 * @example const { mutate: update } = useUpdateOrder()
 */
export const useUpdateOrder = ordersHooks.useUpdate

/**
 * Delete order
 * @param ID of the order to delete
 * @returns React Query result with order data
 * @example const { mutate: deleteItem } = useDeleteOrder()
 */
export const useDeleteOrder = ordersHooks.useDelete

// ============================================
// Orderitems Hooks
// ============================================
const orderitemsHooks = createResourceHooks<OrderItem, CreateOrderItemInput>('orderitems', apiWrapper.orderitems)

/**
 * Fetch list of orderitems
 * @param Query parameters for filtering and pagination
 * @returns React Query result with orderitems data
 * @example const { data: orderitems } = useOrderItems(params)
 */
export const useOrderItems = orderitemsHooks.useList

/**
 * Fetch single orderitem by ID
 * @param Unique identifier for the orderitem
 * @returns React Query result with orderitem data
 * @example const { data: orderitem } = useOrderItem(id)
 */
export const useOrderItem = orderitemsHooks.useOne

/**
 * Create new orderitem
 * @param Input data for creating the orderitem
 * @returns React Query result with orderitem data
 * @example const { mutate: create } = useCreateOrderItem()
 */
export const useCreateOrderItem = orderitemsHooks.useCreate

/**
 * Update orderitem
 * @param Input data for updating the orderitem
 * @returns React Query result with orderitem data
 * @example const { mutate: update } = useUpdateOrderItem()
 */
export const useUpdateOrderItem = orderitemsHooks.useUpdate

/**
 * Delete orderitem
 * @param ID of the orderitem to delete
 * @returns React Query result with orderitem data
 * @example const { mutate: deleteItem } = useDeleteOrderItem()
 */
export const useDeleteOrderItem = orderitemsHooks.useDelete

// ============================================
// Orderevents Hooks
// ============================================
const ordereventsHooks = createResourceHooks<OrderEvent, CreateOrderEventInput>('orderevents', apiWrapper.orderevents)

/**
 * Fetch list of orderevents
 * @param Query parameters for filtering and pagination
 * @returns React Query result with orderevents data
 * @example const { data: orderevents } = useOrderEvents(params)
 */
export const useOrderEvents = ordereventsHooks.useList

/**
 * Fetch single orderevent by ID
 * @param Unique identifier for the orderevent
 * @returns React Query result with orderevent data
 * @example const { data: orderevent } = useOrderEvent(id)
 */
export const useOrderEvent = ordereventsHooks.useOne

/**
 * Create new orderevent
 * @param Input data for creating the orderevent
 * @returns React Query result with orderevent data
 * @example const { mutate: create } = useCreateOrderEvent()
 */
export const useCreateOrderEvent = ordereventsHooks.useCreate

/**
 * Update orderevent
 * @param Input data for updating the orderevent
 * @returns React Query result with orderevent data
 * @example const { mutate: update } = useUpdateOrderEvent()
 */
export const useUpdateOrderEvent = ordereventsHooks.useUpdate

/**
 * Delete orderevent
 * @param ID of the orderevent to delete
 * @returns React Query result with orderevent data
 * @example const { mutate: deleteItem } = useDeleteOrderEvent()
 */
export const useDeleteOrderEvent = ordereventsHooks.useDelete

// ============================================
// Tips Hooks
// ============================================
const tipsHooks = createResourceHooks<Tip, CreateTipInput>('tips', apiWrapper.tips)

/**
 * Fetch list of tips
 * @param Query parameters for filtering and pagination
 * @returns React Query result with tips data
 * @example const { data: tips } = useTips(params)
 */
export const useTips = tipsHooks.useList

/**
 * Fetch single tip by ID
 * @param Unique identifier for the tip
 * @returns React Query result with tip data
 * @example const { data: tip } = useTip(id)
 */
export const useTip = tipsHooks.useOne

/**
 * Create new tip
 * @param Input data for creating the tip
 * @returns React Query result with tip data
 * @example const { mutate: create } = useCreateTip()
 */
export const useCreateTip = tipsHooks.useCreate

/**
 * Update tip
 * @param Input data for updating the tip
 * @returns React Query result with tip data
 * @example const { mutate: update } = useUpdateTip()
 */
export const useUpdateTip = tipsHooks.useUpdate

/**
 * Delete tip
 * @param ID of the tip to delete
 * @returns React Query result with tip data
 * @example const { mutate: deleteItem } = useDeleteTip()
 */
export const useDeleteTip = tipsHooks.useDelete

// ============================================
// Addresses hooks
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
 * @param Unique identifier for the address
 * @returns React Query result with address data
 * @example const { data: address } = useAddress(id)
 */
export const useAddress = addressesHooks.useOne

/**
 * Create new address
 * @param Input data for creating the address
 * @returns React Query result with address data
 * @example const { mutate: create } = useCreateAddress()
 */
export const useCreateAddress = addressesHooks.useCreate

/**
 * Update address
 * @param Input data for updating the address
 * @returns React Query result with address data
 * @example const { mutate: update } = useUpdateAddress()
 */
export const useUpdateAddress = addressesHooks.useUpdate

/**
 * Delete address
 * @param ID of the address to delete
 * @returns React Query result with address data
 * @example const { mutate: deleteItem } = useDeleteAddress()
 */
export const useDeleteAddress = addressesHooks.useDelete

// ============================================
// Systemsettings Hooks
// ============================================
const systemsettingsHooks = createResourceHooks<SystemSetting, CreateSystemSettingInput>('systemsettings', apiWrapper.systemsettings)

/**
 * Fetch list of systemsettings
 * @param Query parameters for filtering and pagination
 * @returns React Query result with systemsettings data
 * @example const { data: systemsettings } = useSystemSettings(params)
 */
export const useSystemSettings = systemsettingsHooks.useList

/**
 * Fetch single systemsetting by ID
 * @param Unique identifier for the systemsetting
 * @returns React Query result with systemsetting data
 * @example const { data: systemsetting } = useSystemSetting(id)
 */
export const useSystemSetting = systemsettingsHooks.useOne

/**
 * Create new systemsetting
 * @param Input data for creating the systemsetting
 * @returns React Query result with systemsetting data
 * @example const { mutate: create } = useCreateSystemSetting()
 */
export const useCreateSystemSetting = systemsettingsHooks.useCreate

/**
 * Update systemsetting
 * @param Input data for updating the systemsetting
 * @returns React Query result with systemsetting data
 * @example const { mutate: update } = useUpdateSystemSetting()
 */
export const useUpdateSystemSetting = systemsettingsHooks.useUpdate

/**
 * Delete systemsetting
 * @param ID of the systemsetting to delete
 * @returns React Query result with systemsetting data
 * @example const { mutate: deleteItem } = useDeleteSystemSetting()
 */
export const useDeleteSystemSetting = systemsettingsHooks.useDelete

// ============================================
// Paymentwebhooks Hooks
// ============================================
const paymentwebhooksHooks = createResourceHooks<PaymentWebhook, CreatePaymentWebhookInput>('paymentwebhooks', apiWrapper.paymentwebhooks)

/**
 * Fetch list of paymentwebhooks
 * @param Query parameters for filtering and pagination
 * @returns React Query result with paymentwebhooks data
 * @example const { data: paymentwebhooks } = usePaymentWebhooks(params)
 */
export const usePaymentWebhooks = paymentwebhooksHooks.useList

/**
 * Fetch single paymentwebhook by ID
 * @param Unique identifier for the paymentwebhook
 * @returns React Query result with paymentwebhook data
 * @example const { data: paymentwebhook } = usePaymentWebhook(id)
 */
export const usePaymentWebhook = paymentwebhooksHooks.useOne

/**
 * Create new paymentwebhook
 * @param Input data for creating the paymentwebhook
 * @returns React Query result with paymentwebhook data
 * @example const { mutate: create } = useCreatePaymentWebhook()
 */
export const useCreatePaymentWebhook = paymentwebhooksHooks.useCreate

/**
 * Update paymentwebhook
 * @param Input data for updating the paymentwebhook
 * @returns React Query result with paymentwebhook data
 * @example const { mutate: update } = useUpdatePaymentWebhook()
 */
export const useUpdatePaymentWebhook = paymentwebhooksHooks.useUpdate

/**
 * Delete paymentwebhook
 * @param ID of the paymentwebhook to delete
 * @returns React Query result with paymentwebhook data
 * @example const { mutate: deleteItem } = useDeletePaymentWebhook()
 */
export const useDeletePaymentWebhook = paymentwebhooksHooks.useDelete

// ============================================
// Paymentmethods Hooks
// ============================================
const paymentmethodsHooks = createResourceHooks<PaymentMethod, CreatePaymentMethodInput>('paymentmethods', apiWrapper.paymentmethods)

/**
 * Fetch list of paymentmethods
 * @param Query parameters for filtering and pagination
 * @returns React Query result with paymentmethods data
 * @example const { data: paymentmethods } = usePaymentMethods(params)
 */
export const usePaymentMethods = paymentmethodsHooks.useList

/**
 * Fetch single paymentmethod by ID
 * @param Unique identifier for the paymentmethod
 * @returns React Query result with paymentmethod data
 * @example const { data: paymentmethod } = usePaymentMethod(id)
 */
export const usePaymentMethod = paymentmethodsHooks.useOne

/**
 * Create new paymentmethod
 * @param Input data for creating the paymentmethod
 * @returns React Query result with paymentmethod data
 * @example const { mutate: create } = useCreatePaymentMethod()
 */
export const useCreatePaymentMethod = paymentmethodsHooks.useCreate

/**
 * Update paymentmethod
 * @param Input data for updating the paymentmethod
 * @returns React Query result with paymentmethod data
 * @example const { mutate: update } = useUpdatePaymentMethod()
 */
export const useUpdatePaymentMethod = paymentmethodsHooks.useUpdate

/**
 * Delete paymentmethod
 * @param ID of the paymentmethod to delete
 * @returns React Query result with paymentmethod data
 * @example const { mutate: deleteItem } = useDeletePaymentMethod()
 */
export const useDeletePaymentMethod = paymentmethodsHooks.useDelete

// ============================================
// Promotions Hooks
// ============================================
const promotionsHooks = createResourceHooks<Promotion, CreatePromotionInput>('promotions', apiWrapper.promotions)

/**
 * Fetch list of promotions
 * @param Query parameters for filtering and pagination
 * @returns React Query result with promotions data
 * @example const { data: promotions } = usePromotions(params)
 */
export const usePromotions = promotionsHooks.useList

/**
 * Fetch single promotion by ID
 * @param Unique identifier for the promotion
 * @returns React Query result with promotion data
 * @example const { data: promotion } = usePromotion(id)
 */
export const usePromotion = promotionsHooks.useOne

/**
 * Create new promotion
 * @param Input data for creating the promotion
 * @returns React Query result with promotion data
 * @example const { mutate: create } = useCreatePromotion()
 */
export const useCreatePromotion = promotionsHooks.useCreate

/**
 * Update promotion
 * @param Input data for updating the promotion
 * @returns React Query result with promotion data
 * @example const { mutate: update } = useUpdatePromotion()
 */
export const useUpdatePromotion = promotionsHooks.useUpdate

/**
 * Delete promotion
 * @param ID of the promotion to delete
 * @returns React Query result with promotion data
 * @example const { mutate: deleteItem } = useDeletePromotion()
 */
export const useDeletePromotion = promotionsHooks.useDelete

// ============================================
// Promotionredemptions Hooks
// ============================================
const promotionredemptionsHooks = createResourceHooks<PromotionRedemption, CreatePromotionRedemptionInput>('promotionredemptions', apiWrapper.promotionredemptions)

/**
 * Fetch list of promotionredemptions
 * @param Query parameters for filtering and pagination
 * @returns React Query result with promotionredemptions data
 * @example const { data: promotionredemptions } = usePromotionRedemptions(params)
 */
export const usePromotionRedemptions = promotionredemptionsHooks.useList

/**
 * Fetch single promotionredemption by ID
 * @param Unique identifier for the promotionredemption
 * @returns React Query result with promotionredemption data
 * @example const { data: promotionredemption } = usePromotionRedemption(id)
 */
export const usePromotionRedemption = promotionredemptionsHooks.useOne

/**
 * Create new promotionredemption
 * @param Input data for creating the promotionredemption
 * @returns React Query result with promotionredemption data
 * @example const { mutate: create } = useCreatePromotionRedemption()
 */
export const useCreatePromotionRedemption = promotionredemptionsHooks.useCreate

/**
 * Update promotionredemption
 * @param Input data for updating the promotionredemption
 * @returns React Query result with promotionredemption data
 * @example const { mutate: update } = useUpdatePromotionRedemption()
 */
export const useUpdatePromotionRedemption = promotionredemptionsHooks.useUpdate

/**
 * Delete promotionredemption
 * @param ID of the promotionredemption to delete
 * @returns React Query result with promotionredemption data
 * @example const { mutate: deleteItem } = useDeletePromotionRedemption()
 */
export const useDeletePromotionRedemption = promotionredemptionsHooks.useDelete

// ============================================
// Posts Hooks
// ============================================
// @ts-expect-error - Custom update signature, acceptable (works at runtime)
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
 * @param Unique identifier for the post
 * @returns React Query result with post data
 * @example const { data: post } = usePost(id)
 */
export const usePost = postsHooks.useOne

/**
 * Create new post
 * @param Input data for creating the post
 * @returns React Query result with post data
 * @example const { mutate: create } = useCreatePost()
 */
export const useCreatePost = postsHooks.useCreate

/**
 * Update post
 * @param Input data for updating the post
 * @returns React Query result with post data
 * @example const { mutate: update } = useUpdatePost()
 */
export const useUpdatePost = postsHooks.useUpdate

/**
 * Delete post
 * @param ID of the post to delete
 * @returns React Query result with post data
 * @example const { mutate: deleteItem } = useDeletePost()
 */
export const useDeletePost = postsHooks.useDelete

// ============================================
// Postlikes Hooks
// ============================================
const postlikesHooks = createResourceHooks<PostLike, CreatePostLikeInput>('postlikes', apiWrapper.postlikes)

/**
 * Fetch list of postlikes
 * @param Query parameters for filtering and pagination
 * @returns React Query result with postlikes data
 * @example const { data: postlikes } = usePostLikes(params)
 */
export const usePostLikes = postlikesHooks.useList

/**
 * Fetch single postlike by ID
 * @param Unique identifier for the postlike
 * @returns React Query result with postlike data
 * @example const { data: postlike } = usePostLike(id)
 */
export const usePostLike = postlikesHooks.useOne

/**
 * Create new postlike
 * @param Input data for creating the postlike
 * @returns React Query result with postlike data
 * @example const { mutate: create } = useCreatePostLike()
 */
export const useCreatePostLike = postlikesHooks.useCreate

/**
 * Update postlike
 * @param Input data for updating the postlike
 * @returns React Query result with postlike data
 * @example const { mutate: update } = useUpdatePostLike()
 */
export const useUpdatePostLike = postlikesHooks.useUpdate

/**
 * Delete postlike
 * @param ID of the postlike to delete
 * @returns React Query result with postlike data
 * @example const { mutate: deleteItem } = useDeletePostLike()
 */
export const useDeletePostLike = postlikesHooks.useDelete

// ============================================
// Comments Hooks
// ============================================
const commentsHooks = createResourceHooks<Comment, CreateCommentInput>('comments', apiWrapper.comments)

/**
 * Fetch list of comments
 * @param Query parameters for filtering and pagination
 * @returns React Query result with comments data
 * @example const { data: comments } = useComments(params)
 */
export const useComments = commentsHooks.useList

/**
 * Fetch single comment by ID
 * @param Unique identifier for the comment
 * @returns React Query result with comment data
 * @example const { data: comment } = useComment(id)
 */
export const useComment = commentsHooks.useOne

/**
 * Create new comment
 * @param Input data for creating the comment
 * @returns React Query result with comment data
 * @example const { mutate: create } = useCreateComment()
 */
export const useCreateComment = commentsHooks.useCreate

/**
 * Update comment
 * @param Input data for updating the comment
 * @returns React Query result with comment data
 * @example const { mutate: update } = useUpdateComment()
 */
export const useUpdateComment = commentsHooks.useUpdate

/**
 * Delete comment
 * @param ID of the comment to delete
 * @returns React Query result with comment data
 * @example const { mutate: deleteItem } = useDeleteComment()
 */
export const useDeleteComment = commentsHooks.useDelete

// ============================================
// Affiliates Hooks
// ============================================
const affiliatesHooks = createResourceHooks<Affiliate, CreateAffiliateInput>('affiliates', apiWrapper.affiliates)

/**
 * Fetch list of affiliates
 * @param Query parameters for filtering and pagination
 * @returns React Query result with affiliates data
 * @example const { data: affiliates } = useAffiliates(params)
 */
export const useAffiliates = affiliatesHooks.useList

/**
 * Fetch single affiliate by ID
 * @param Unique identifier for the affiliate
 * @returns React Query result with affiliate data
 * @example const { data: affiliate } = useAffiliate(id)
 */
export const useAffiliate = affiliatesHooks.useOne

/**
 * Create new affiliate
 * @param Input data for creating the affiliate
 * @returns React Query result with affiliate data
 * @example const { mutate: create } = useCreateAffiliate()
 */
export const useCreateAffiliate = affiliatesHooks.useCreate

/**
 * Update affiliate
 * @param Input data for updating the affiliate
 * @returns React Query result with affiliate data
 * @example const { mutate: update } = useUpdateAffiliate()
 */
export const useUpdateAffiliate = affiliatesHooks.useUpdate

/**
 * Delete affiliate
 * @param ID of the affiliate to delete
 * @returns React Query result with affiliate data
 * @example const { mutate: deleteItem } = useDeleteAffiliate()
 */
export const useDeleteAffiliate = affiliatesHooks.useDelete

// ============================================
// Commissions Hooks
// ============================================
const commissionsHooks = createResourceHooks<Commission, CreateCommissionInput>('commissions', apiWrapper.commissions)

/**
 * Fetch list of commissions
 * @param Query parameters for filtering and pagination
 * @returns React Query result with commissions data
 * @example const { data: commissions } = useCommissions(params)
 */
export const useCommissions = commissionsHooks.useList

/**
 * Fetch single commission by ID
 * @param Unique identifier for the commission
 * @returns React Query result with commission data
 * @example const { data: commission } = useCommission(id)
 */
export const useCommission = commissionsHooks.useOne

/**
 * Create new commission
 * @param Input data for creating the commission
 * @returns React Query result with commission data
 * @example const { mutate: create } = useCreateCommission()
 */
export const useCreateCommission = commissionsHooks.useCreate

/**
 * Update commission
 * @param Input data for updating the commission
 * @returns React Query result with commission data
 * @example const { mutate: update } = useUpdateCommission()
 */
export const useUpdateCommission = commissionsHooks.useUpdate

/**
 * Delete commission
 * @param ID of the commission to delete
 * @returns React Query result with commission data
 * @example const { mutate: deleteItem } = useDeleteCommission()
 */
export const useDeleteCommission = commissionsHooks.useDelete

// ============================================
// Affiliatepayouts Hooks
// ============================================
const affiliatepayoutsHooks = createResourceHooks<AffiliatePayout, CreateAffiliatePayoutInput>('affiliatepayouts', apiWrapper.affiliatepayouts)

/**
 * Fetch list of affiliatepayouts
 * @param Query parameters for filtering and pagination
 * @returns React Query result with affiliatepayouts data
 * @example const { data: affiliatepayouts } = useAffiliatePayouts(params)
 */
export const useAffiliatePayouts = affiliatepayoutsHooks.useList

/**
 * Fetch single affiliatepayout by ID
 * @param Unique identifier for the affiliatepayout
 * @returns React Query result with affiliatepayout data
 * @example const { data: affiliatepayout } = useAffiliatePayout(id)
 */
export const useAffiliatePayout = affiliatepayoutsHooks.useOne

/**
 * Create new affiliatepayout
 * @param Input data for creating the affiliatepayout
 * @returns React Query result with affiliatepayout data
 * @example const { mutate: create } = useCreateAffiliatePayout()
 */
export const useCreateAffiliatePayout = affiliatepayoutsHooks.useCreate

/**
 * Update affiliatepayout
 * @param Input data for updating the affiliatepayout
 * @returns React Query result with affiliatepayout data
 * @example const { mutate: update } = useUpdateAffiliatePayout()
 */
export const useUpdateAffiliatePayout = affiliatepayoutsHooks.useUpdate

/**
 * Delete affiliatepayout
 * @param ID of the affiliatepayout to delete
 * @returns React Query result with affiliatepayout data
 * @example const { mutate: deleteItem } = useDeleteAffiliatePayout()
 */
export const useDeleteAffiliatePayout = affiliatepayoutsHooks.useDelete

// ============================================
// Deliveryzones Hooks
// ============================================
const deliveryzonesHooks = createResourceHooks<DeliveryZone, CreateDeliveryZoneInput>('deliveryzones', apiWrapper.deliveryzones)

/**
 * Fetch list of deliveryzones
 * @param Query parameters for filtering and pagination
 * @returns React Query result with deliveryzones data
 * @example const { data: deliveryzones } = useDeliveryZones(params)
 */
export const useDeliveryZones = deliveryzonesHooks.useList

/**
 * Fetch single deliveryzone by ID
 * @param Unique identifier for the deliveryzone
 * @returns React Query result with deliveryzone data
 * @example const { data: deliveryzone } = useDeliveryZone(id)
 */
export const useDeliveryZone = deliveryzonesHooks.useOne

/**
 * Create new deliveryzone
 * @param Input data for creating the deliveryzone
 * @returns React Query result with deliveryzone data
 * @example const { mutate: create } = useCreateDeliveryZone()
 */
export const useCreateDeliveryZone = deliveryzonesHooks.useCreate

/**
 * Update deliveryzone
 * @param Input data for updating the deliveryzone
 * @returns React Query result with deliveryzone data
 * @example const { mutate: update } = useUpdateDeliveryZone()
 */
export const useUpdateDeliveryZone = deliveryzonesHooks.useUpdate

/**
 * Delete deliveryzone
 * @param ID of the deliveryzone to delete
 * @returns React Query result with deliveryzone data
 * @example const { mutate: deleteItem } = useDeleteDeliveryZone()
 */
export const useDeleteDeliveryZone = deliveryzonesHooks.useDelete

// ============================================
// Vendorverifications Hooks
// ============================================
const vendorverificationsHooks = createResourceHooks<VendorVerification, CreateVendorVerificationInput>('vendorverifications', apiWrapper.vendorverifications)

/**
 * Fetch list of vendorverifications
 * @param Query parameters for filtering and pagination
 * @returns React Query result with vendorverifications data
 * @example const { data: vendorverifications } = useVendorVerifications(params)
 */
export const useVendorVerifications = vendorverificationsHooks.useList

/**
 * Fetch single vendorverification by ID
 * @param Unique identifier for the vendorverification
 * @returns React Query result with vendorverification data
 * @example const { data: vendorverification } = useVendorVerification(id)
 */
export const useVendorVerification = vendorverificationsHooks.useOne

/**
 * Create new vendorverification
 * @param Input data for creating the vendorverification
 * @returns React Query result with vendorverification data
 * @example const { mutate: create } = useCreateVendorVerification()
 */
export const useCreateVendorVerification = vendorverificationsHooks.useCreate

/**
 * Update vendorverification
 * @param Input data for updating the vendorverification
 * @returns React Query result with vendorverification data
 * @example const { mutate: update } = useUpdateVendorVerification()
 */
export const useUpdateVendorVerification = vendorverificationsHooks.useUpdate

/**
 * Delete vendorverification
 * @param ID of the vendorverification to delete
 * @returns React Query result with vendorverification data
 * @example const { mutate: deleteItem } = useDeleteVendorVerification()
 */
export const useDeleteVendorVerification = vendorverificationsHooks.useDelete

// ============================================
// Teammembers Hooks
// ============================================
const teammembersHooks = createResourceHooks<TeamMember, CreateTeamMemberInput>('teammembers', apiWrapper.teammembers)

/**
 * Fetch list of teammembers
 * @param Query parameters for filtering and pagination
 * @returns React Query result with teammembers data
 * @example const { data: teammembers } = useTeamMembers(params)
 */
export const useTeamMembers = teammembersHooks.useList

/**
 * Fetch single teammember by ID
 * @param Unique identifier for the teammember
 * @returns React Query result with teammember data
 * @example const { data: teammember } = useTeamMember(id)
 */
export const useTeamMember = teammembersHooks.useOne

/**
 * Create new teammember
 * @param Input data for creating the teammember
 * @returns React Query result with teammember data
 * @example const { mutate: create } = useCreateTeamMember()
 */
export const useCreateTeamMember = teammembersHooks.useCreate

/**
 * Update teammember
 * @param Input data for updating the teammember
 * @returns React Query result with teammember data
 * @example const { mutate: update } = useUpdateTeamMember()
 */
export const useUpdateTeamMember = teammembersHooks.useUpdate

/**
 * Delete teammember
 * @param ID of the teammember to delete
 * @returns React Query result with teammember data
 * @example const { mutate: deleteItem } = useDeleteTeamMember()
 */
export const useDeleteTeamMember = teammembersHooks.useDelete

// ============================================
// Invitations Hooks
// ============================================
const invitationsHooks = createResourceHooks<Invitation, CreateInvitationInput>('invitations', apiWrapper.invitations)

/**
 * Fetch list of invitations
 * @param Query parameters for filtering and pagination
 * @returns React Query result with invitations data
 * @example const { data: invitations } = useInvitations(params)
 */
export const useInvitations = invitationsHooks.useList

/**
 * Fetch single invitation by ID
 * @param Unique identifier for the invitation
 * @returns React Query result with invitation data
 * @example const { data: invitation } = useInvitation(id)
 */
export const useInvitation = invitationsHooks.useOne

/**
 * Create new invitation
 * @param Input data for creating the invitation
 * @returns React Query result with invitation data
 * @example const { mutate: create } = useCreateInvitation()
 */
export const useCreateInvitation = invitationsHooks.useCreate

/**
 * Update invitation
 * @param Input data for updating the invitation
 * @returns React Query result with invitation data
 * @example const { mutate: update } = useUpdateInvitation()
 */
export const useUpdateInvitation = invitationsHooks.useUpdate

/**
 * Delete invitation
 * @param ID of the invitation to delete
 * @returns React Query result with invitation data
 * @example const { mutate: deleteItem } = useDeleteInvitation()
 */
export const useDeleteInvitation = invitationsHooks.useDelete

// ============================================
// Favoritestores Hooks
// ============================================
const favoritestoresHooks = createResourceHooks<FavoriteStore, CreateFavoriteStoreInput>('favoritestores', apiWrapper.favoritestores)

/**
 * Fetch list of favoritestores
 * @param Query parameters for filtering and pagination
 * @returns React Query result with favoritestores data
 * @example const { data: favoritestores } = useFavoriteStores(params)
 */
export const useFavoriteStores = favoritestoresHooks.useList

/**
 * Fetch single favoritestore by ID
 * @param Unique identifier for the favoritestore
 * @returns React Query result with favoritestore data
 * @example const { data: favoritestore } = useFavoriteStore(id)
 */
export const useFavoriteStore = favoritestoresHooks.useOne

/**
 * Create new favoritestore
 * @param Input data for creating the favoritestore
 * @returns React Query result with favoritestore data
 * @example const { mutate: create } = useCreateFavoriteStore()
 */
export const useCreateFavoriteStore = favoritestoresHooks.useCreate

/**
 * Update favoritestore
 * @param Input data for updating the favoritestore
 * @returns React Query result with favoritestore data
 * @example const { mutate: update } = useUpdateFavoriteStore()
 */
export const useUpdateFavoriteStore = favoritestoresHooks.useUpdate

/**
 * Delete favoritestore
 * @param ID of the favoritestore to delete
 * @returns React Query result with favoritestore data
 * @example const { mutate: deleteItem } = useDeleteFavoriteStore()
 */
export const useDeleteFavoriteStore = favoritestoresHooks.useDelete

// ============================================
// Favoriteitems Hooks
// ============================================
const favoriteitemsHooks = createResourceHooks<FavoriteItem, CreateFavoriteItemInput>('favoriteitems', apiWrapper.favoriteitems)

/**
 * Fetch list of favoriteitems
 * @param Query parameters for filtering and pagination
 * @returns React Query result with favoriteitems data
 * @example const { data: favoriteitems } = useFavoriteItems(params)
 */
export const useFavoriteItems = favoriteitemsHooks.useList

/**
 * Fetch single favoriteitem by ID
 * @param Unique identifier for the favoriteitem
 * @returns React Query result with favoriteitem data
 * @example const { data: favoriteitem } = useFavoriteItem(id)
 */
export const useFavoriteItem = favoriteitemsHooks.useOne

/**
 * Create new favoriteitem
 * @param Input data for creating the favoriteitem
 * @returns React Query result with favoriteitem data
 * @example const { mutate: create } = useCreateFavoriteItem()
 */
export const useCreateFavoriteItem = favoriteitemsHooks.useCreate

/**
 * Update favoriteitem
 * @param Input data for updating the favoriteitem
 * @returns React Query result with favoriteitem data
 * @example const { mutate: update } = useUpdateFavoriteItem()
 */
export const useUpdateFavoriteItem = favoriteitemsHooks.useUpdate

/**
 * Delete favoriteitem
 * @param ID of the favoriteitem to delete
 * @returns React Query result with favoriteitem data
 * @example const { mutate: deleteItem } = useDeleteFavoriteItem()
 */
export const useDeleteFavoriteItem = favoriteitemsHooks.useDelete

// ============================================
// Bundles Hooks
// ============================================
// @ts-expect-error - Custom update signature, acceptable (works at runtime)
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
 * @param Unique identifier for the bundle
 * @returns React Query result with bundle data
 * @example const { data: bundle } = useBundle(id)
 */
export const useBundle = bundlesHooks.useOne

/**
 * Create new bundle
 * @param Input data for creating the bundle
 * @returns React Query result with bundle data
 * @example const { mutate: create } = useCreateBundle()
 */
export const useCreateBundle = bundlesHooks.useCreate

/**
 * Update bundle
 * @param Input data for updating the bundle
 * @returns React Query result with bundle data
 * @example const { mutate: update } = useUpdateBundle()
 */
export const useUpdateBundle = bundlesHooks.useUpdate

/**
 * Delete bundle
 * @param ID of the bundle to delete
 * @returns React Query result with bundle data
 * @example const { mutate: deleteItem } = useDeleteBundle()
 */
export const useDeleteBundle = bundlesHooks.useDelete

// ============================================
// Bundleitems Hooks
// ============================================
const bundleitemsHooks = createResourceHooks<BundleItem, CreateBundleItemInput>('bundleitems', apiWrapper.bundleitems)

/**
 * Fetch list of bundleitems
 * @param Query parameters for filtering and pagination
 * @returns React Query result with bundleitems data
 * @example const { data: bundleitems } = useBundleItems(params)
 */
export const useBundleItems = bundleitemsHooks.useList

/**
 * Fetch single bundleitem by ID
 * @param Unique identifier for the bundleitem
 * @returns React Query result with bundleitem data
 * @example const { data: bundleitem } = useBundleItem(id)
 */
export const useBundleItem = bundleitemsHooks.useOne

/**
 * Create new bundleitem
 * @param Input data for creating the bundleitem
 * @returns React Query result with bundleitem data
 * @example const { mutate: create } = useCreateBundleItem()
 */
export const useCreateBundleItem = bundleitemsHooks.useCreate

/**
 * Update bundleitem
 * @param Input data for updating the bundleitem
 * @returns React Query result with bundleitem data
 * @example const { mutate: update } = useUpdateBundleItem()
 */
export const useUpdateBundleItem = bundleitemsHooks.useUpdate

/**
 * Delete bundleitem
 * @param ID of the bundleitem to delete
 * @returns React Query result with bundleitem data
 * @example const { mutate: deleteItem } = useDeleteBundleItem()
 */
export const useDeleteBundleItem = bundleitemsHooks.useDelete

// ============================================
// Bundlepricings Hooks
// ============================================
const bundlepricingsHooks = createResourceHooks<BundlePricing, CreateBundlePricingInput>('bundlepricings', apiWrapper.bundlepricings)

/**
 * Fetch list of bundlepricings
 * @param Query parameters for filtering and pagination
 * @returns React Query result with bundlepricings data
 * @example const { data: bundlepricings } = useBundlePricings(params)
 */
export const useBundlePricings = bundlepricingsHooks.useList

/**
 * Fetch single bundlepricing by ID
 * @param Unique identifier for the bundlepricing
 * @returns React Query result with bundlepricing data
 * @example const { data: bundlepricing } = useBundlePricing(id)
 */
export const useBundlePricing = bundlepricingsHooks.useOne

/**
 * Create new bundlepricing
 * @param Input data for creating the bundlepricing
 * @returns React Query result with bundlepricing data
 * @example const { mutate: create } = useCreateBundlePricing()
 */
export const useCreateBundlePricing = bundlepricingsHooks.useCreate

/**
 * Update bundlepricing
 * @param Input data for updating the bundlepricing
 * @returns React Query result with bundlepricing data
 * @example const { mutate: update } = useUpdateBundlePricing()
 */
export const useUpdateBundlePricing = bundlepricingsHooks.useUpdate

/**
 * Delete bundlepricing
 * @param ID of the bundlepricing to delete
 * @returns React Query result with bundlepricing data
 * @example const { mutate: deleteItem } = useDeleteBundlePricing()
 */
export const useDeleteBundlePricing = bundlepricingsHooks.useDelete
