import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartWithTotals, ItemResponse } from '@api/types'

interface AddCartItemInput {
  storeId: string
  itemId: string
  quantity: number
  title?: string
  unitPrice?: string | number
  item?: Partial<ItemResponse>
}

interface CartStoreState {
  cart: CartWithTotals | undefined
  hasHydrated: boolean
  addItem: (input: AddCartItemInput) => CartWithTotals
  decrementItem: (itemId: string, quantity?: number) => CartWithTotals | undefined
  removeItem: (itemId: string) => CartWithTotals | undefined
  setCart: (cart: CartWithTotals | undefined) => void
  clearCart: () => void
  setHasHydrated: (hasHydrated: boolean) => void
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function createEmptyCart(storeId: string): CartWithTotals {
  const now = new Date().toISOString()
  return ({
    id: `local-cart-${storeId}`,
    storeId,
    status: 'ACTIVE',
    items: [],
    itemCount: 0,
    subtotal: 0,
    tax: 0,
    deliveryFee: 0,
    fees: 0,
    total: 0,
    createdAt: now,
    updatedAt: now,
  } as unknown) as CartWithTotals
}

function recalculateCart(cart: CartWithTotals): CartWithTotals {
  const items = (Array.isArray(cart.items) ? cart.items : []) as any[]
  const subtotal = items.reduce((sum, item) => {
    const price = toNumber(item.unitPrice ?? item.currentItem?.price)
    return sum + price * (item.quantity || 0)
  }, 0)
  const itemCount = items.reduce((sum, item) => sum + (item.quantity || 0), 0)
  const tax = subtotal * 0.1
  const deliveryFee = subtotal > 0 ? 5.99 : 0
  const fees = deliveryFee
  const total = subtotal + tax + fees

  return {
    ...cart,
    items: items as any,
    itemCount,
    subtotal,
    tax,
    deliveryFee,
    fees,
    total,
    updatedAt: new Date().toISOString(),
  }
}

export const useCartStore = create<CartStoreState>()(
  persist(
    (set, get) => ({
      cart: undefined,
      hasHydrated: false,
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),

      addItem: (input) => {
        const currentCart = get().cart
        const baseCart = currentCart?.storeId === input.storeId
          ? currentCart
          : createEmptyCart(input.storeId)
        const baseItems = (baseCart as any).items
        const items: any[] = Array.isArray(baseItems) ? [...baseItems] : []
        const existingIndex = items.findIndex((item) => item.itemId === input.itemId)
        const unitPrice = toNumber(input.unitPrice ?? input.item?.price)

        if (existingIndex >= 0) {
          const existing = items[existingIndex]
          items[existingIndex] = {
            ...existing,
            quantity: (existing.quantity || 0) + input.quantity,
            unitPrice,
          }
        } else {
          items.push(({
            id: `local-cart-item-${input.itemId}`,
            cartId: baseCart.id,
            itemId: input.itemId,
            item: input.item as ItemResponse,
            currentItem: input.item as ItemResponse,
            quantity: input.quantity,
            unitPrice,
            titleSnapshot: input.title ?? input.item?.title ?? 'Item',
          } as unknown) as any)
        }

        const nextCart = recalculateCart(({ ...(baseCart as any), items } as unknown) as CartWithTotals)
        set({ cart: nextCart })
        return nextCart
      },

      decrementItem: (itemId, quantity = 1) => {
        const currentCart = get().cart
        if (!currentCart) return undefined

        const currentItems = (currentCart as any).items
        const items: any[] = (Array.isArray(currentItems) ? currentItems : [])
          .map((item) => item.itemId === itemId
            ? { ...item, quantity: Math.max(0, (item.quantity || 0) - quantity) }
            : item
          )
          .filter((item) => item.quantity > 0)

        if (items.length === 0) {
          set({ cart: undefined })
          return undefined
        }

        const nextCart = recalculateCart(({ ...(currentCart as any), items } as unknown) as CartWithTotals)
        set({ cart: nextCart })
        return nextCart
      },

      removeItem: (itemId) => {
        const currentCart = get().cart
        if (!currentCart) return undefined

        const currentItems = (currentCart as any).items
        const items: any[] = (Array.isArray(currentItems) ? currentItems : [])
          .filter((item) => item.itemId !== itemId)

        if (items.length === 0) {
          set({ cart: undefined })
          return undefined
        }

        const nextCart = recalculateCart(({ ...(currentCart as any), items } as unknown) as CartWithTotals)
        set({ cart: nextCart })
        return nextCart
      },

      setCart: (cart) => {
        set({ cart: cart ? recalculateCart(cart) : undefined })
      },

      clearCart: () => {
        set({ cart: undefined })
      },
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({ cart: state.cart }),
      onRehydrateStorage: () => (state) => {
        // Ensure UI can distinguish "empty cart" from "not hydrated yet".
        state?.setHasHydrated(true)
      },
    }
  )
)
