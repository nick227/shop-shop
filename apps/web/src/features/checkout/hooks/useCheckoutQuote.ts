/**
 * useCheckoutQuote - the totals checkout will charge, and whether pickup and delivery are possible,
 * from the server's pricing code. The cart only knows what the shopper added; prices, fees, tax and
 * delivery eligibility always come from here.
 */
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { CartWithTotals } from '@api/types'
import { authPost } from '@shared/lib/auth/authFetch'

export type FulfillmentType = 'PICKUP' | 'DELIVERY'

export interface DeliveryAddressDraft {
  readonly line1: string
  readonly line2?: string
  readonly city: string
  readonly state: string
  readonly postalCode: string
  readonly instructions?: string
}

export type DeliveryAvailability =
  | { readonly available: true; readonly fee: number; readonly minimum: number | null; readonly distanceMiles: number | null }
  | {
      readonly available: false
      readonly code: string
      readonly message: string
      readonly minimum: number | null
      readonly shortBy: number | null
    }

export interface CheckoutQuote {
  readonly storeId: string
  readonly deliveryType: FulfillmentType
  readonly lines: readonly { itemId: string | null; bundleId: string | null; title: string; quantity: number; unitPrice: number }[]
  readonly subtotal: number
  readonly deliveryFee: number
  readonly tax: number
  /** The tax is a development estimate and must be labeled so. */
  readonly taxEstimated: boolean
  readonly serviceFee: number
  readonly tip: number
  readonly total: number
  /** Why the chosen way to get the order isn't possible; the totals can't be paid while set. */
  readonly blocked: { readonly code: string; readonly message: string } | null
  readonly fulfillment: { readonly pickup: { readonly available: boolean }; readonly delivery: DeliveryAvailability }
  readonly destination: { readonly addressId: string | null; readonly address: DeliveryAddressDraft; readonly approximate: boolean } | null
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

export interface QuoteOptions {
  readonly deliveryType: FulfillmentType
  readonly tipAmount?: number
  readonly deliveryAddressId?: string | null
  readonly deliveryAddress?: DeliveryAddressDraft | null
}

export function quoteRequestBody(cart: CartWithTotals | undefined, options: QuoteOptions) {
  return {
    items: checkoutLines(cart),
    deliveryType: options.deliveryType,
    tipAmount: Math.max(0, Math.round((options.tipAmount ?? 0) * 100) / 100),
    ...(options.deliveryAddressId ? { deliveryAddressId: options.deliveryAddressId } : {}),
    ...(!options.deliveryAddressId && options.deliveryAddress ? { deliveryAddress: options.deliveryAddress } : {}),
  }
}

export function useCheckoutQuote(cart: CartWithTotals | undefined, options: QuoteOptions) {
  const body = quoteRequestBody(cart, options)
  return useQuery({
    queryKey: ['checkout-quote', cart?.storeId, JSON.stringify(body)],
    queryFn: async (): Promise<CheckoutQuote> => {
      const response = await authPost('/api/v1/checkout/quote', body)
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string; message?: string }
        throw new Error(payload.error ?? payload.message ?? 'Prices could not be checked')
      }
      return (await response.json()) as CheckoutQuote
    },
    enabled: body.items.length > 0,
    // Keep the last totals on screen while a change (address, tip, method) is re-priced.
    placeholderData: keepPreviousData,
    retry: false,
  })
}
