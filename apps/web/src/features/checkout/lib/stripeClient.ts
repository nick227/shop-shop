/**
 * Single cached Stripe.js loader for checkout.
 */
import { loadStripe, type Stripe } from '@stripe/stripe-js'
import { env } from '@/env'

let cached: Promise<Stripe | null> | null = null

export function getStripePublishableKey(): string | undefined {
  return env.VITE_STRIPE_PUBLISHABLE_KEY
}

export function getStripePromise(): Promise<Stripe | null> | null {
  const key = env.VITE_STRIPE_PUBLISHABLE_KEY
  if (!key) return null
  if (!cached) {
    cached = loadStripe(key)
  }
  return cached
}
