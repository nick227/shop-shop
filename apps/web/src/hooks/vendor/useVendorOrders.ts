/**
 * useVendorOrders - Fetch orders for vendor's stores with real-time updates
 * Enhanced with generated hooks for better type safety and error handling
 */
import { useQuery } from '@tanstack/react-query'
import { stores, orders } from '@api/apiWrapper'
import { useAuth } from '../useAuth'
import { sortOrdersByDateDesc, isOrderPending } from '@utils/orderHelpers'
import type { OrderResponse } from '@api/backend-types'

export interface UseVendorOrdersOptions {
  status?: string;
  refetchInterval?: number;
}

export function useVendorOrders(options: UseVendorOrdersOptions = {}) {
  const { user } = useAuth()

  return useQuery<OrderResponse[]>({
    queryKey: ['vendor-orders', (user as unknown as { id: string }).id, options.status],
    queryFn: async () => {
      // Fetch orders for all vendor's stores
      // First get vendor's stores, then fetch orders for each
      const vendorStores = await stores.list()
      
      if (vendorStores.length === 0) {
        return []
      }

      // Fetch orders for all stores
      const ordersPromises = vendorStores.map(async () => {
        const allOrders = await orders.list() as OrderResponse[]
        // Filter by status if provided
        if (options.status) {
          return allOrders.filter((order: OrderResponse) => order.status === options.status)
        }
        return allOrders
      })

      const ordersResponses = await Promise.all(ordersPromises)
      
      // Combine all orders
      const allOrders = ordersResponses.flat()
      
      // Sort by newest first (using consolidated helper)
      allOrders.sort(sortOrdersByDateDesc)

      return allOrders
    },
    enabled: !!user,
    refetchInterval: options.refetchInterval ?? 30_000, // Default: refresh every 30 sec
  })
}

/**
 * Get count of pending orders (PLACED, ACCEPTED, PREPARING, READY)
 */
export function usePendingOrderCount() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['vendor-pending-orders-count', (user as unknown as { id: string }).id],
    queryFn: async () => {
      const vendorStores = await stores.list()
      
      if (vendorStores.length === 0) return 0
      
      // Fetch orders for all stores
      const ordersPromises = vendorStores.map(async () => {
        return await orders.list() as OrderResponse[]
      })

      const ordersResponses = await Promise.all(ordersPromises)
      const allOrders = ordersResponses.flat()
      
      // Count pending orders (using consolidated helper)
      return allOrders.filter((order: OrderResponse) => isOrderPending(order.status)).length
    },
    enabled: !!user,
    refetchInterval: 15_000, // Refresh every 15 sec for widget
  })
}

