/**
 * Order Hooks
 * 
 * React Query hooks for order operations.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queries } from '../queries/orders'
import { mutations } from '../mutations/orders'
import type { CreateOrderInput, UpdateOrderInput } from '../adapters/validation'

/**
 * Hook for getting all orders
 */
export function useOrders() {
  return useQuery({
    queryKey: ['orders'],
    queryFn: queries.getAllOrders,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Hook for getting order by ID
 */
export function useOrder(id: string) {
  return useQuery({
    queryKey: ['orders', id],
    queryFn: () => queries.getOrderById(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Hook for getting orders by user ID
 */
export function useOrdersByUser(userId: string) {
  return useQuery({
    queryKey: ['orders', 'user', userId],
    queryFn: () => queries.getOrdersByUserId(userId),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Hook for getting orders by store ID
 */
export function useOrdersByStore(storeId: string) {
  return useQuery({
    queryKey: ['orders', 'store', storeId],
    queryFn: () => queries.getOrdersByStoreId(storeId),
    enabled: !!storeId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Hook for creating order
 */
export function useCreateOrder() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: mutations.createOrder,
    onSuccess: (order) => {
      // Invalidate orders list and user-specific orders
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['orders', 'user', order.userId] })
      // Clear cart after successful order
      queryClient.setQueryData(['cart', 'active'], null)
    },
  })
}

/**
 * Hook for updating order
 */
export function useUpdateOrder() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateOrderInput }) =>
      mutations.updateOrder(id, input),
    onSuccess: (order, { id }) => {
      // Invalidate specific order and orders list
      queryClient.invalidateQueries({ queryKey: ['orders', id] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

/**
 * Hook for canceling order
 */
export function useCancelOrder() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: mutations.cancelOrder,
    onSuccess: (order, id) => {
      // Invalidate specific order and orders list
      queryClient.invalidateQueries({ queryKey: ['orders', id] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}
