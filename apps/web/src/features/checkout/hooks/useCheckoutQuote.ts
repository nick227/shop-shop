/**
 * useCheckoutQuote - the totals checkout will charge for the cart, from the server's pricing code.
 * The cart only knows what the shopper added; prices, fees and tax always come from here.
 */
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { CartWithTotals } from '@api/types'
import { authPost } from '@shared/lib/auth/authFetch'

export interface CheckoutQuote {
  readonly storeId: string
  readonly deliveryType: 'PICKUP' | 'DELIVERY'
  readonly lines: readonly { itemId: string | null; bundleId: string | null; title: string; quantity: number; unitPrice: number }[]
  readonly subtotal: number
  readonly deliveryFee: number
  readonly tax: number
  readonly serviceFee: number
  readonly tip: number
  readonly total: number
  readonly fulfillment: { readonly pickup: boolean; readonly delivery: boolean }
}

export type CheckoutLine = { itemId: string; quantity: number } | { bundleId: string; quantity: number }

/** The cart's lines as checkout takes them: an item or a bundle, and how many. */
export function checkoutLines(cart: CartWithTotals | undefined): CheckoutLine[] {
  const lines = Array.isArray(cart?.items) ? (cart.items as { itemId?: string | null; bundleId?: string | null; quantity?: number }[]) : []
  return lines.flatMap((line): CheckoutLine[] => {
    const quantity = line.quantity ?? 0
    if (quantity <= 0) return []
    if (line.bundleId) return [{ bundleId: line.bundleId, quantity }]
    return line.itemId ? [{ itemId: line.itemId, quantity }] : []
  })
}

export function useCheckoutQuote(
  cart: CartWithTotals | undefined,
  options: { deliveryType: 'PICKUP' | 'DELIVERY'; tipAmount?: number },
) {
  const items = checkoutLines(cart)
  const tipAmount = Math.max(0, Math.round((options.tipAmount ?? 0) * 100) / 100)
  return useQuery({
    queryKey: ['checkout-quote', cart?.storeId, JSON.stringify(items), options.deliveryType, tipAmount],
    queryFn: async (): Promise<CheckoutQuote> => {
      const response = await authPost('/api/v1/checkout/quote', { items, deliveryType: options.deliveryType, tipAmount })
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string; message?: string }
        throw new Error(body.error ?? body.message ?? 'Prices could not be checked')
      }
      return (await response.json()) as CheckoutQuote
    },
    enabled: items.length > 0,
    // Keep showing the last totals while a change (quantity, tip) is re-priced.
    placeholderData: keepPreviousData,
    retry: false,
  })
}
