import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCartStore, type AddBundleToCartInput } from '@stores/cartStore'
import { useCartToaster } from '@features/cart/components/CartToaster'
import { handleApiError } from '@api/errors'
import { CartKeptError, confirmCartFor } from '@features/cart/cartSwitch'



export function useAddBundleToCart() {
  const queryClient = useQueryClient()
  const addBundle = useCartStore((state) => state.addBundle)
  const { showItemAdded } = useCartToaster()

  return useMutation({
    mutationFn: async (params: AddBundleToCartInput) => {
      // Another store's cart is only replaced once the shopper says so.
      const replaceCart = await confirmCartFor(params.storeId)
      return addBundle({ ...params, replaceCart })
    },
    onSuccess: (updatedCart, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      queryClient.invalidateQueries({ queryKey: ['carts'] })
      showItemAdded({
        item: { title: variables.title } as any,
        quantity: 1,
        cartTotal: updatedCart?.total,
        cartItemCount: updatedCart?.itemCount,
        duration: 4000,
      })
    },
    onError: async (error) => {
      if (error instanceof CartKeptError) return
      const appError = await handleApiError(error)
      console.error('Add bundle to cart failed:', appError.message)
    },
  })
}

export {type AddBundleToCartInput} from '@stores/cartStore'