/**
 * useRemoveFromCart Hook - Cart item removal and decrement logic
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { handleApiError } from '@api/errors'
import { useCartStore } from '@stores/cartStore'

export interface RemoveFromCartParams {
  cartId: string
  itemId: string
  quantity?: number // If provided, decrement by this amount, otherwise remove item completely
}

export function useRemoveFromCart() {
  const queryClient = useQueryClient()
  const removeItem = useCartStore((state) => state.removeItem)
  
  return useMutation({
    mutationFn: async (params: RemoveFromCartParams) => {
      return removeItem(params.itemId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      queryClient.invalidateQueries({ queryKey: ['carts'] })
      toast.success('Item removed from cart')
    },
    onError: async (error) => {
      const appError = await handleApiError(error)
      toast.error(appError.message)
    }
  })
}

export function useDecrementCartItem() {
  const queryClient = useQueryClient()
  const decrementItem = useCartStore((state) => state.decrementItem)
  
  return useMutation({
    mutationFn: async ({ cartId, itemId, decrementBy = 1 }: { cartId: string; itemId: string; decrementBy?: number }) => {
      return decrementItem(itemId, decrementBy)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      queryClient.invalidateQueries({ queryKey: ['carts'] })
      toast.success('Item quantity updated')
    },
    onError: async (error) => {
      const appError = await handleApiError(error)
      toast.error('Failed to update quantity')
    }
  })
}
