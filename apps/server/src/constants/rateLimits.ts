/**
 * Per-route limits for @fastify/rate-limit.
 * App registers the plugin with `global: false`, so only routes that set
 * `config.rateLimit` are limited (IP-based key unless overridden at plugin level).
 */

export const rateLimits = {
  /** Login — brute-force protection */
  authLogin: {
    max: 5,
    timeWindow: '15 minutes' as const,
  },
  /** Signup — allow normal retries during onboarding */
  authSignup: {
    max: 20,
    timeWindow: '15 minutes' as const,
  },
  /** Stripe PaymentIntent creation — expensive + fraud surface */
  paymentCreateIntent: {
    max: 60,
    timeWindow: '15 minutes' as const,
  },
  /** Connect onboarding URL creation — abuse / Stripe API */
  paymentConnect: {
    max: 15,
    timeWindow: '1 hour' as const,
  },
  /** Status polling — allow frequent refreshes but cap */
  paymentConnectStatus: {
    max: 120,
    timeWindow: '15 minutes' as const,
  },
  /** Refunds — financial */
  paymentRefund: {
    max: 40,
    timeWindow: '15 minutes' as const,
  },
  /** Tip create + charge */
  tipMutation: {
    max: 50,
    timeWindow: '15 minutes' as const,
  },
  /** Tip refund */
  tipRefund: {
    max: 25,
    timeWindow: '15 minutes' as const,
  },
  /** Order cancel (may trigger refund) */
  orderCancel: {
    max: 40,
    timeWindow: '15 minutes' as const,
  },
} as const
