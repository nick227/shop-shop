/**
 * Single cached Stripe.js loader for checkout.
 */
import { loadStripe, type Stripe } from '@stripe/stripe-js'
import { env } from '@/env'

let cached: Promise<Stripe | null> | null = null

/** Only a real publishable key counts; a placeholder would load Stripe.js and fail inside it. */
export function getStripePublishableKey(): string | undefined {
  const key = env.VITE_STRIPE_PUBLISHABLE_KEY
  return key && /^pk_(test|live)_[A-Za-z0-9]+$/.test(key) ? key : undefined
}

/** Test keys take Stripe's test cards (4242 4242 4242 4242 …) and never move real money. */
export function isStripeTestMode(): boolean {
  return getStripePublishableKey()?.startsWith('pk_test_') ?? false
}

export function getStripePromise(): Promise<Stripe | null> | null {
  const key = getStripePublishableKey()
  if (!key) return null
  if (!cached) {
    cached = loadStripe(key)
  }
  return cached
}
