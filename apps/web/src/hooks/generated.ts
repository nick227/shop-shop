/**
 * Auto-Generated Resource Hooks
 * ⚠️  DO NOT EDIT MANUALLY
 * Generated from: api wrapper using generic hook factory
 * 
 * To regenerate: pnpm gen:hooks
 */
import { createResourceHooks } from './createResourceHooks'
import * as apiWrapper from '../api/apiWrapper'
import type { 
  StoreResponse as Store, ItemResponse as Item, CartWithTotals, OrderResponse as Order, AddressResponse as Address, Bundle,
} from '../api/backend-types'
import type { 
  AddCartItemInput, CreateOrderInput, CreateAddressInput, CreateBundleInput,
} from '../api/apiWrapper'

// ============================================
// Stores Hooks
// ============================================
const storesHooks = createResourceHooks<Store>('stores', apiWrapper.stores)

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

// ============================================
// Items Hooks
// ============================================
const itemsHooks = createResourceHooks<Item>('items', apiWrapper.items)

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

// ============================================
// Carts Hooks
// ============================================
const cartsHooks = createResourceHooks<CartWithTotals, AddCartItemInput>('carts', apiWrapper.carts)

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
 * Delete cart
 * @param ID of the cart to delete
 * @returns React Query result with cart data
 * @example const { mutate: deleteItem } = useDeleteCart()
 */
export const useDeleteCart = cartsHooks.useDelete

// ============================================
// Orders Hooks
// ============================================
// @ts-expect-error - Custom update signature, acceptable (works at runtime)
const ordersHooks = createResourceHooks<Order, CreateOrderInput>('orders', apiWrapper.orders,
  { invalidates: ['orders', 'cart'] })

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

// ============================================
// Addresses Hooks
// ============================================
// @ts-expect-error - Custom update signature, acceptable (works at runtime)
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
