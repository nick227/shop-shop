/**
 * useCart Hook - Cart CRUD with optimistic updates
 * Now using generated hooks for better type safety and consistency
 */
import { useMemo } from 'react'
import { useCarts, useCreateCart, useDeleteCart } from './generated'
import type { CartWithTotals } from '@api/backend-types'
import { calculateCartTotals } from '@api/types/helpers'
import { useAuth } from '@shared/hooks/useAuth'

export function useCart() {
  const { isAuthenticated } = useAuth()
  
  // Use generated hooks for cart operations
  const { data: carts, isLoading, error } = useCarts({
    enabled: isAuthenticated // Only run when authenticated
  })
  
  const createCartMutation = useCreateCart()
  const deleteCartMutation = useDeleteCart()

  // Find active cart from the list
  const activeCart = useMemo(() => {
    if (!carts || carts.length === 0) return
    return carts.find(cart => cart.status === 'ACTIVE') || undefined
  }, [carts])

  // Calculate totals for the active cart
  const cartWithTotals: CartWithTotals | undefined = useMemo(() => {
    return activeCart ? calculateCartTotals(activeCart as any) : undefined
  }, [activeCart])

  return {
    cart: cartWithTotals,
    isLoading,
    error,
    createCart: createCartMutation.mutate,
    deleteCart: deleteCartMutation.mutate,
    isCreating: createCartMutation.isPending,
    isDeleting: deleteCartMutation.isPending,
  }
}

