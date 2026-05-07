import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCartStore, type AddBundleToCartInput } from '@stores/cartStore'
import { useCartToaster } from '@features/cart/components/CartToaster'
import { handleApiError } from '@api/errors'

export type { AddBundleToCartInput }

export function useAddBundleToCart() {
  const queryClient = useQueryClient()
  const addBundle = useCartStore((state) => state.addBundle)
  const { showItemAdded } = useCartToaster()

  return useMutation({
    mutationFn: async (params: AddBundleToCartInput) => addBundle(params),
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
      const appError = await handleApiError(error)
      console.error('Add bundle to cart failed:', appError.message)
    },
  })
}
