// @ts-nocheck
/**
 * useAddToCart Hook - Shared cart mutation logic;
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { handleApiError } from '@api/errors'
import { useCartStore } from '@stores/cartStore'
import type { ItemResponse } from '@api/types'
import { apiClient } from '@api/client'

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
  
  return useMutation({
    mutationFn: async (params: AddToCartParams) => {
      const cart = addItem(params)
      void apiClient.carts().createCart({
        createCartRequest: {
          storeId: params.storeId,
          itemId: params.itemId,
          quantity: params.quantity,
        },
      }).catch((error) => {
        console.warn('Cart API sync failed; kept local cart state.', error)
      })
      return cart
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      queryClient.invalidateQueries({ queryKey: ['carts'] })
      toast.success('Item added to cart!')
    },
    onError: async (error) => {
      const appError = await handleApiError(error)
      toast.error(appError.message)
    }})
}

