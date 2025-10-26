/**
 * useAddToCart Hook - Shared cart mutation logic;
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@api/client'
import { toast } from 'sonner'
import { handleApiError } from '@api/errors'

export interface AddToCartParams {
  storeId: string;
  itemId: string;
  quantity: number;
}

export function useAddToCart() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (params: AddToCartParams) => {
      return await apiClient.carts().createCart({ 
        createCartRequest: params
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      toast.success('Item added to cart!')
    },
    onError: async (error) => {
      const appError = await handleApiError(error)
      toast.error(appError.message)
    }})
}

