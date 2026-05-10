import { env } from '../env.js'

/**
 * Resolve Stripe Connect AccountLink return/refresh URLs.
 * Prefer explicit env vars; otherwise build from APP_URL / WEB_URL.
 */
export function resolveStripeConnectUrls(): { returnUrl: string; refreshUrl: string } {
  const explicitReturn = process.env.STRIPE_CONNECT_RETURN_URL
  const explicitRefresh = process.env.STRIPE_CONNECT_REFRESH_URL
  if (explicitReturn && explicitRefresh) {
    return { returnUrl: explicitReturn, refreshUrl: explicitRefresh }
  }

  const base =
    process.env.APP_URL ??
    process.env.WEB_URL ??
    `http://localhost:${String(env.PORT)}`
  const root = base.replace(/\/$/, '')

  return {
    returnUrl: `${root}/vendor/connect/success`,
    refreshUrl: `${root}/vendor/connect/refresh`,
  }
}

export function isCodPaymentsEnabled(): boolean {
  return env.ENABLE_COD_PAYMENTS === 'true'
}
