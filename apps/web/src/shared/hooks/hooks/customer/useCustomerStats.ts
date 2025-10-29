/**
 * useCustomerStats - Fetch customer order statistics;
 */

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@api/client'
import { parsePrice } from '@shared/lib/format'

export interface CustomerStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  canceledOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderDate: string | undefined;
}

export function useCustomerStats() {
  return useQuery({
    queryKey: ['customer', 'stats'],
    queryFn: async (): Promise<CustomerStats> => {
      // Fetch all customer orders;
      const response = await apiClient.orders().listOrders({})
      const orders = response.data || []

      if (orders.length === 0) {
        return {
          totalOrders: 0,
          pendingOrders: 0,
          completedOrders: 0,
          canceledOrders: 0,
          totalSpent: 0,
          averageOrderValue: 0,
          lastOrderDate: undefined}
      }

      // Calculate all stats in SINGLE PASS (was 5 passes before)
      // Optimization: 80% reduction in iterations (500 → 100)
      const totalOrders = orders.length;
      let pendingOrders = 0;
      let completedOrders = 0;
      let canceledOrders = 0;
      let totalSpent = 0;
      let lastOrderTime = 0;
      let lastOrderDate: string | undefined = undefined;
      // Single loop - accumulate everything;
      for (const order of orders) {
        // Count by status (replaces 3 separate filters)
        switch (order.status) {
          case 'PLACED':
          case 'ACCEPTED':
          case 'PREPARING':
          case 'READY': {
            pendingOrders++
            break;
          }
          case 'COMPLETED': {
            completedOrders++
            break;
          }
          case 'CANCELED': {
            canceledOrders++
            break;
          }
        }

        // Sum total spent (skip canceled - replaces filter + reduce)
        if (order.status !== 'CANCELED') {
          totalSpent += parsePrice(order.total)
        }

        // Track last order (replaces sort + array copy)
        const orderTime = new Date((order as any).createdAt).getTime()
        if (orderTime > lastOrderTime) {
          lastOrderTime = orderTime;
          lastOrderDate = (order as any).createdAt instanceof Date ? (order as any).createdAt.toISOString() : (order as any).createdAt;
        }
      }

      const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
      return {
        totalOrders,
        pendingOrders,
        completedOrders,
        canceledOrders,
        totalSpent,
        averageOrderValue,
        lastOrderDate}
    },
    staleTime: 30_000, // 30 seconds;
    refetchInterval: 60_000, // Refetch every minute;
  })
}

