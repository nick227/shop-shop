/**
 * useAddBundleToCart Hook - Bundle add-to-cart functionality
 * Extends useAddToCart for bundle-specific logic
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@api/client'
import { toast } from 'sonner'
import { handleApiError } from '@api/errors'

export interface AddBundleToCartParams {
  storeId: string
  bundleId: string
  quantity: number
}

export function useAddBundleToCart() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (params: AddBundleToCartParams) => {
      // For now, we'll add the bundle as a single item to the cart
      // In the future, this could be enhanced to add all bundle items individually
      // or create a special bundle cart item type
      
      // Get bundle details to add items individually
      const bundle = await apiClient.bundles().getBundleById({ id: params.bundleId })
      
      // Parse the items JSON string
      const bundleItems = JSON.parse(bundle.items || '[]')
      
      if (bundleItems.length === 0) {
        throw new Error('Bundle has no items')
      }
      
      // Add each bundle item to the cart
      const cartPromises = bundleItems.map((bundleItem: any) => 
        apiClient.carts().createCart({
          createCartRequest: {
            storeId: params.storeId,
            itemId: bundleItem.itemId,
            quantity: bundleItem.quantity * params.quantity
          }
        })
      )
      
      return Promise.all(cartPromises)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      queryClient.invalidateQueries({ queryKey: ['carts'] })
      toast.success('Bundle added to cart!')
    },
    onError: async (error) => {
      const appError = await handleApiError(error)
      toast.error(appError.message)
    }
  })
}
