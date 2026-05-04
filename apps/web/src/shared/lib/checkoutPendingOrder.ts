/**
 * Persists the order created during checkout so payment retries do not call create again.
 * Cleared when checkout completes successfully.
 */
const STORAGE_KEY = 'shop-shop-checkout-pending-order'

export interface PendingCheckoutOrder {
  readonly cartId: string
  readonly orderId: string
}

export function getPendingOrderForCart(cartId: string): string | undefined {
  if (typeof sessionStorage === 'undefined') return undefined
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return undefined
    const parsed = JSON.parse(raw) as PendingCheckoutOrder
    return parsed.cartId === cartId ? parsed.orderId : undefined
  } catch {
    return undefined
  }
}

export function setPendingOrderForCart(cartId: string, orderId: string): void {
  if (typeof sessionStorage === 'undefined') return
  const payload: PendingCheckoutOrder = { cartId, orderId }
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}

export function clearPendingOrderForCheckout(): void {
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.removeItem(STORAGE_KEY)
}
