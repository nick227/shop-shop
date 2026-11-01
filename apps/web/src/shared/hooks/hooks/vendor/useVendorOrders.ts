/**
 * useVendorOrders - Orders for the stores you work in, refreshed on an interval.
 * The API lists one store at a time for store staff, so every request names its store.
 */
import { useQuery } from '@tanstack/react-query'
import type { OrderListItem } from '@api/types'
import { useAuth } from '@features/auth/hooks/useAuth'
import { authGet } from '@shared/lib/auth/authFetch'
import { sortOrdersByDateDesc, isOrderPending } from '@shared/lib/utils/orderHelpers'
import { mapOrder } from '@api/type-mappers'
import type { OrderResponse } from '@api/types'
import { fetchTeamMeStores, getVendorApiBase, type VendorStore } from './vendorTeamApi'

export interface UseVendorOrdersOptions {
  status?: string;
  refetchInterval?: number;
  /** When set, only orders for this store (must be one you work in). */
  storeId?: string;
}

const PAGE_LIMIT = '100'

async function fetchStoreOrders(storeId: string, status?: string): Promise<OrderResponse[]> {
  const params = new URLSearchParams({ storeId, limit: PAGE_LIMIT })
  if (status) params.set('status', status)
  const response = await authGet(`${getVendorApiBase()}/orders?${params.toString()}`)
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string; message?: string }
    throw new Error(body.error || body.message || 'Orders could not be loaded')
  }
  const body = (await response.json()) as { data?: OrderListItem[] } | OrderListItem[]
  const rows = Array.isArray(body) ? body : (body.data ?? [])
  return rows.map((row) => mapOrder(row))
}

function canSeeOrders(store: VendorStore): boolean {
  return store.isOwner || store.permissions.includes('FULL_ACCESS') || store.permissions.includes('VIEW_ORDERS')
}

async function orderStoreIds(storeId?: string): Promise<string[]> {
  if (storeId) return [storeId]
  const stores = await fetchTeamMeStores()
  return stores.filter(canSeeOrders).map((store) => store.id)
}

async function fetchOrders(storeIds: readonly string[], status?: string): Promise<OrderResponse[]> {
  const lists = await Promise.all(storeIds.map((id) => fetchStoreOrders(id, status)))
  const byId = new Map<string, OrderResponse>()
  for (const order of lists.flat()) {
    if (order?.id) byId.set(order.id, order)
  }
  return [...byId.values()].sort(sortOrdersByDateDesc)
}

export function useVendorOrders(options: UseVendorOrdersOptions = {}) {
  const { user } = useAuth()
  const userId = user?.id

  return useQuery<OrderResponse[]>({
    queryKey: ['vendor-orders', userId, options.status, options.storeId],
    queryFn: async () => fetchOrders(await orderStoreIds(options.storeId), options.status),
    enabled: Boolean(userId),
    refetchInterval: options.refetchInterval ?? 30_000,
  })
}

function countPending(orders: readonly OrderResponse[]): number {
  return orders.filter((order) => isOrderPending(order.status)).length
}

/**
 * Get count of pending orders (PLACED, ACCEPTED, PREPARING, READY)
 */
export function usePendingOrderCount(storeId?: string) {
  const { user } = useAuth()
  const userId = user?.id

  return useQuery({
    queryKey: ['vendor-pending-orders-count', userId, storeId],
    queryFn: async () => countPending(await fetchOrders(await orderStoreIds(storeId))),
    enabled: Boolean(userId),
    refetchInterval: 15_000,
  })
}

/**
 * Pending order counts keyed by store, for every store whose orders you can see.
 * A store that fails to load is left out rather than failing every badge.
 */
export function usePendingOrderCounts() {
  const { user } = useAuth()
  const userId = user?.id

  return useQuery({
    queryKey: ['vendor-pending-orders-counts', userId],
    queryFn: async () => {
      const ids = await orderStoreIds()
      const results = await Promise.allSettled(ids.map((id) => fetchStoreOrders(id)))
      const counts: Record<string, number> = {}
      for (const [index, result] of results.entries()) {
        if (result.status === 'fulfilled') counts[ids[index]] = countPending(result.value)
      }
      return counts
    },
    enabled: Boolean(userId),
    refetchInterval: 15_000,
  })
}
