// @ts-nocheck
/**
 * useAddToCart Hook - Enhanced cart mutation logic with rich notifications
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { handleApiError } from '@api/errors'
import { useCartStore } from '@stores/cartStore'
import { useCartToaster } from '@features/cart/components/CartToaster'
import type { ItemResponse } from '@api/types'
import { CartKeptError, confirmCartFor } from '@features/cart/cartSwitch'

export interface AddToCartParams {
  storeId: string;
  itemId: string;
  quantity: number;
  title?: string;
  unitPrice?: string | number;
  item?: Partial<ItemResponse>;
}

export function useAddToCart() {
  const queryClient = useQueryClient()
  const addItem = useCartStore((state) => state.addItem)
  const cart = useCartStore((state) => state.cart)
  const { showItemAdded } = useCartToaster()
  
  return useMutation({
    mutationFn: async (params: AddToCartParams) => {
      // Another store's cart is only replaced once the shopper says so.
      const replaceCart = await confirmCartFor(params.storeId)
      return addItem({ ...params, replaceCart })
    },
    onSuccess: (updatedCart, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      queryClient.invalidateQueries({ queryKey: ['carts'] })
      
      // Show rich cart notification
      showItemAdded({
        item: variables.item,
        quantity: variables.quantity,
        cartTotal: updatedCart?.total,
        cartItemCount: updatedCart?.itemCount,
        duration: 4000
      })
    },
    onError: async (error) => {
      if (error instanceof CartKeptError) return
      const appError = await handleApiError(error)
      // Could enhance with error-specific toast here
      console.error('Add to cart failed:', appError.message)
    }})
}
