/* eslint-disable react-refresh/only-export-components -- the dialog and the hook that opens it belong together */
/**
 * Starting a new cart for another store is always the shopper's call. Adding from a different store
 * asks first; keeping the current cart leaves it exactly as it was.
 */
import { create } from 'zustand'
import { Button } from '@shared/ui/primitives'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/ui/primitives/ui/Dialog'
import { useCartStore, cartBelongsToAnotherStore } from '@stores/cartStore'

interface CartSwitchState {
  pending: { readonly resolve: (startNew: boolean) => void } | null
  ask: () => Promise<boolean>
  answer: (startNew: boolean) => void
}

export const useCartSwitchStore = create<CartSwitchState>((set, get) => ({
  pending: null,
  ask: () =>
    new Promise<boolean>((resolve) => {
      // A second question while one is open keeps the current cart for the first.
      get().pending?.resolve(false)
      set({ pending: { resolve } })
    }),
  answer: (startNew) => {
    get().pending?.resolve(startNew)
    set({ pending: null })
  },
}))

/** Thrown when the shopper keeps their current cart; callers treat it as "nothing to do". */
export class CartKeptError extends Error {
  constructor() {
    super('Kept the current cart')
    this.name = 'CartKeptError'
  }
}

/**
 * Resolves `true` when adding from `storeId` may go ahead (and must replace the cart), `false` when the
 * cart is already this store's or empty. Throws `CartKeptError` when the shopper keeps their cart.
 */
export async function confirmCartFor(storeId: string): Promise<boolean> {
  if (!cartBelongsToAnotherStore(useCartStore.getState().cart, storeId)) return false
  const startNew = await useCartSwitchStore.getState().ask()
  if (!startNew) throw new CartKeptError()
  return true
}

export function CartSwitchDialog() {
  const pending = useCartSwitchStore((state) => state.pending)
  const answer = useCartSwitchStore((state) => state.answer)

  return (
    <Dialog open={!!pending} onOpenChange={(open) => !open && answer(false)}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-md rounded-xl">
        <DialogHeader>
          <DialogTitle>Start a new cart?</DialogTitle>
          <DialogDescription>
            Your cart contains items from another store. Start a new cart for this store?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => answer(false)}>
            Keep current cart
          </Button>
          <Button variant="primary" onClick={() => answer(true)}>
            Start new cart
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
