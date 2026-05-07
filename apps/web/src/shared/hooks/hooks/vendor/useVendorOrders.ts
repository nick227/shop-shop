/**
 * useVendorOrders - Fetch orders for vendor's stores with real-time updates
 * Enhanced with generated hooks for better type safety and error handling
 */
import { useQuery } from '@tanstack/react-query'
import { stores, orders } from '@api/apiWrapper'
import { useAuth } from '@features/auth/hooks/useAuth'
import { sortOrdersByDateDesc, isOrderPending } from '@shared/lib/utils/orderHelpers'
import { mapOrder } from '@api/type-mappers'
import type { OrderResponse } from '@api/types'

export interface UseVendorOrdersOptions {
  status?: string;
  refetchInterval?: number;
  /** When set, only orders for this store (must belong to vendor). */
  storeId?: string;
}

export function useVendorOrders(options: UseVendorOrdersOptions = {}) {
  const { user } = useAuth()
  const userId = user?.id

  return useQuery<OrderResponse[]>({
    queryKey: ['vendor-orders', userId, options.status, options.storeId],
    queryFn: async () => {
      // Fetch vendor stores once, then fetch orders once. Dedupe by id.
      const vendorStores = await stores.list()
      
      if (vendorStores.length === 0) {
        return []
      }

      const storeIds = new Set(vendorStores.map((s: any) => s.id).filter(Boolean))
      if (options.storeId && !storeIds.has(options.storeId)) {
        return []
      }
      const scopeIds = options.storeId
        ? new Set<string>([options.storeId])
        : storeIds

      const rawOrders = await orders.list()
      const allOrders = rawOrders.map((row) => mapOrder(row))

      // Filter to vendor stores + optional status.
      const filtered = allOrders.filter((order) => {
        if (!scopeIds.has((order as any).storeId)) return false
        if (options.status && order.status !== options.status) return false
        return true
      })

      // Dedupe by order id (defensive against backend/joins).
      const byId = new Map<string, OrderResponse>()
      for (const order of filtered) {
        if (!order?.id) continue
        byId.set(order.id, order)
      }
      const uniqueOrders = [...byId.values()]
      
      // Sort by newest first (using consolidated helper)
      uniqueOrders.sort(sortOrdersByDateDesc)

      return uniqueOrders
    },
    enabled: Boolean(userId),
    refetchInterval: options.refetchInterval ?? 30_000, // Default: refresh every 30 sec
  })
}

/**
 * Get count of pending orders (PLACED, ACCEPTED, PREPARING, READY)
 */
export function usePendingOrderCount(storeId?: string) {
  const { user } = useAuth()
  const userId = user?.id

  return useQuery({
    queryKey: ['vendor-pending-orders-count', userId, storeId],
    queryFn: async () => {
      const vendorStores = await stores.list()
      
      if (vendorStores.length === 0) return 0

      const vendorStoreIds = new Set(vendorStores.map((s: any) => s.id).filter(Boolean))
      if (storeId && !vendorStoreIds.has(storeId)) return 0
      const scopeIds = storeId ? new Set<string>([storeId]) : vendorStoreIds

      const allOrders = (await orders.list()) as unknown as OrderResponse[]
      const filtered = allOrders.filter((order) => scopeIds.has((order as any).storeId))
      
      // Count pending orders (using consolidated helper)
      const byId = new Set<string>()
      let count = 0
      for (const order of filtered) {
        if (!order?.id || byId.has(order.id)) continue
        byId.add(order.id)
        if (isOrderPending(order.status)) count += 1
      }
      return count
    },
    enabled: Boolean(userId),
    refetchInterval: 15_000, // Refresh every 15 sec for widget
  })
}

