/**
 * The shopper's checkout choices for this visit: pickup or delivery, and which address. Kept for the
 * tab session so going back to the cart and returning doesn't lose them. Never derived from the
 * browsing ZIP: a delivery address is only what the shopper chose or typed.
 */
import type { DeliveryAddressDraft, FulfillmentType } from './hooks/useCheckoutQuote'

const KEY = 'shop-shop-checkout-prefs'

export interface CheckoutPrefs {
  readonly deliveryType: FulfillmentType
  readonly addressId: string | null
  readonly draft: DeliveryAddressDraft | null
}

export const DEFAULT_PREFS: CheckoutPrefs = { deliveryType: 'PICKUP', addressId: null, draft: null }

export function readCheckoutPrefs(): CheckoutPrefs {
  try {
    const raw = sessionStorage.getItem(KEY)
    return raw ? { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<CheckoutPrefs>) } : DEFAULT_PREFS
  } catch {
    return DEFAULT_PREFS
  }
}

export function writeCheckoutPrefs(prefs: CheckoutPrefs): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(prefs))
  } catch {
    // Private mode: choices just won't survive navigation.
  }
}
