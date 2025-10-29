/**
 * Cart Hooks
 * 
 * React Query hooks for cart operations.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queries } from '../queries/carts'
import { mutations } from '../mutations/carts'
import type { AddCartItemInput, UpdateCartItemInput } from '../adapters/validation'

/**
 * Hook for getting active cart
 */
export function useActiveCart() {
  return useQuery({
    queryKey: ['cart', 'active'],
    queryFn: queries.getActiveCart,
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}

/**
 * Hook for getting cart by ID
 */
export function useCart(id: string) {
  return useQuery({
    queryKey: ['cart', id],
    queryFn: () => queries.getCartById(id),
    enabled: !!id,
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}

/**
 * Hook for adding item to cart
 */
export function useAddToCart() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: mutations.addItemToCart,
    onSuccess: (cart) => {
      // Update cart cache
      queryClient.setQueryData(['cart', cart.id], cart)
      queryClient.setQueryData(['cart', 'active'], cart)
      // Invalidate cart queries
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
  })
}

/**
 * Hook for updating cart item
 */
export function useUpdateCartItem() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ cartId, itemId, input }: { cartId: string; itemId: string; input: UpdateCartItemInput }) =>
      mutations.updateCartItem(cartId, itemId, input),
    onSuccess: (cart) => {
      // Update cart cache
      queryClient.setQueryData(['cart', cart.id], cart)
      queryClient.setQueryData(['cart', 'active'], cart)
      // Invalidate cart queries
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
  })
}

/**
 * Hook for removing item from cart
 */
export function useRemoveFromCart() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ cartId, itemId }: { cartId: string; itemId: string }) =>
      mutations.removeItemFromCart(cartId, itemId),
    onSuccess: (cart) => {
      // Update cart cache
      queryClient.setQueryData(['cart', cart.id], cart)
      queryClient.setQueryData(['cart', 'active'], cart)
      // Invalidate cart queries
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
  })
}

/**
 * Hook for clearing cart
 */
export function useClearCart() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: mutations.clearCart,
    onSuccess: (cart) => {
      // Update cart cache
      queryClient.setQueryData(['cart', cart.id], cart)
      queryClient.setQueryData(['cart', 'active'], cart)
      // Invalidate cart queries
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
  })
}
