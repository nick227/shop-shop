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
  Store, Item, Order, Address, RiverPost, Bundle,
  CreateOrderInput, CreateAddressInput, CreatePostInput, CreateBundleInput,
} from '@api/types'

// ============================================
// Stores Hooks
// ============================================
const storesHooks = createResourceHooks<Store>('stores', apiWrapper.stores)

/**
 * Fetch list of stores
 * @example const { data: stores } = useStores(params)
 */
export const useStores = storesHooks.useList

/**
 * Fetch single store by ID
 * @example const { data: item } = useStore(id)
 */
export const useStore = storesHooks.useOne

// ============================================
// Items Hooks
// ============================================
const itemsHooks = createResourceHooks<Item>('items', apiWrapper.items)

/**
 * Fetch list of items
 * @example const { data: items } = useItems(params)
 */
export const useItems = itemsHooks.useList

/**
 * Fetch single item by ID
 * @example const { data: item } = useItem(id)
 */
export const useItem = itemsHooks.useOne

// ============================================
// Orders Hooks
// ============================================
// @ts-expect-error - Custom update signature, acceptable (works at runtime)
const ordersHooks = createResourceHooks<Order, CreateOrderInput>('orders', apiWrapper.orders,
  { invalidates: ['orders', 'cart'] })

/**
 * Fetch list of orders
 * @example const { data: orders } = useOrders(params)
 */
export const useOrders = ordersHooks.useList

/**
 * Fetch single order by ID
 * @example const { data: item } = useOrder(id)
 */
export const useOrder = ordersHooks.useOne

/**
 * Create new order
 * @example const { mutate: create } = useCreateOrder()
 */
export const useCreateOrder = ordersHooks.useCreate

/**
 * Update order
 * @example const { mutate: update } = useUpdateOrder()
 */
export const useUpdateOrder = ordersHooks.useUpdate

// ============================================
// Addresses Hooks
// ============================================
// @ts-expect-error - Custom update signature, acceptable (works at runtime)
const addressesHooks = createResourceHooks<Address, CreateAddressInput>('addresses', apiWrapper.addresses)

/**
 * Fetch list of addresses
 * @example const { data: addresses } = useAddresses(params)
 */
export const useAddresses = addressesHooks.useList

/**
 * Fetch list of addresses
 * @example const { data: addresses } = useAddress(params)
 */
export const useAddress = addressesHooks.useOne

/**
 * Fetch list of addresses
 * @example const { data: addresses } = useCreateAddress(params)
 */
export const useCreateAddress = addressesHooks.useCreate

/**
 * Fetch list of addresses
 * @example const { data: addresses } = useUpdateAddress(params)
 */
export const useUpdateAddress = addressesHooks.useUpdate

/**
 * Fetch list of addresses
 * @example const { data: addresses } = useDeleteAddress(params)
 */
export const useDeleteAddress = addressesHooks.useDelete

// ============================================
// Posts Hooks
// ============================================
// @ts-expect-error - Custom update signature, acceptable (works at runtime)
const postsHooks = createResourceHooks<RiverPost, CreatePostInput>('posts', apiWrapper.posts)

/**
 * Fetch list of posts
 * @example const { data: posts } = usePosts(params)
 */
export const usePosts = postsHooks.useList

/**
 * Fetch single post by ID
 * @example const { data: item } = usePost(id)
 */
export const usePost = postsHooks.useOne

/**
 * Create new post
 * @example const { mutate: create } = useCreatePost()
 */
export const useCreatePost = postsHooks.useCreate

/**
 * Update post
 * @example const { mutate: update } = useUpdatePost()
 */
export const useUpdatePost = postsHooks.useUpdate

/**
 * Delete post
 * @example const { mutate: deleteItem } = useDeletePost()
 */
export const useDeletePost = postsHooks.useDelete

// ============================================
// Bundles Hooks
// ============================================
const bundlesHooks = createResourceHooks<Bundle, CreateBundleInput>('bundles', apiWrapper.bundles)

/**
 * Fetch list of bundles
 * @example const { data: bundles } = useBundles(params)
 */
export const useBundles = bundlesHooks.useList

/**
 * Fetch single bundle by ID
 * @example const { data: item } = useBundle(id)
 */
export const useBundle = bundlesHooks.useOne

/**
 * Create new bundle
 * @example const { mutate: create } = useCreateBundle()
 */
export const useCreateBundle = bundlesHooks.useCreate

/**
 * Update bundle
 * @example const { mutate: update } = useUpdateBundle()
 */
export const useUpdateBundle = bundlesHooks.useUpdate

/**
 * Delete bundle
 * @example const { mutate: deleteItem } = useDeleteBundle()
 */
export const useDeleteBundle = bundlesHooks.useDelete
