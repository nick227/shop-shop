import { useCartStore } from '@stores/cartStore'

export function useCart() {
  const cart = useCartStore((state) => state.cart)
  const hasHydrated = useCartStore((state) => state.hasHydrated)
  const setCart = useCartStore((state) => state.setCart)
  const clearCart = useCartStore((state) => state.clearCart)

  const deleteCart = (_cartId?: string, options?: { onSuccess?: () => void; onError?: () => void }) => {
    try {
      clearCart()
      options?.onSuccess?.()
    } catch {
      options?.onError?.()
    }
  }

  return {
    cart,
    isLoading: !hasHydrated,
    error: undefined,
    createCart: setCart,
    deleteCart,
    clearCart,
    isCreating: false,
    isDeleting: false,
  }
}
