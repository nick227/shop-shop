import { z } from 'zod'

export const envSchema = z
  .object({
    DATABASE_URL: z.string().url(),

    PORT: z.string().transform(Number).default(process.env.PORT ?? '3000'),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

    JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
    JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
    JWT_EXPIRES_IN: z.string().default('7d'),

    REDIS_URL: z.string().default('redis://localhost:6379'),

    STRIPE_SECRET_KEY: z.string().optional(),
    STRIPE_WEBHOOK_SECRET: z.string().optional(),
    /** Only visible here when web and API share one .env (local dev); used to catch test/live mixups. */
    VITE_STRIPE_PUBLISHABLE_KEY: z.string().optional(),

    ENABLE_COD_PAYMENTS: z.enum(['true', 'false']).optional(),

    GEOCODING_API_KEY: z.string().optional(),
    /** Positionstack base URL; defaults to the APILayer host. Set only for a legacy api.positionstack.com key. */
    GEOCODING_API_URL: z.string().url().optional(),
    /** geocode.maps.co key: fallback when Positionstack fails or finds nothing. */
    GEOCODE_API_KEY: z.string().optional(),
    MAPBOX_ACCESS_TOKEN: z.string().optional(),
    ALLOW_APPROXIMATE_DELIVERY: z.enum(['true', 'false']).optional(),
    TAX_PROVIDER: z.enum(['stripe', 'estimate']).optional(),
    ALLOW_ESTIMATED_TAX: z.enum(['true', 'false']).optional(),

    WEB_PORT: z.string().transform(Number).default(process.env.WEB_PORT ?? '5177'),
    CORS_ORIGINS: z.string().default(process.env.CORS_ORIGINS ?? 'http://localhost:5177,http://localhost:3005'),

    /**
     * DoorDash Drive webhooks — in production, must be `basic` or `hmac` (never omitted / none / invalid).
     */
    DOORDASH_WEBHOOK_AUTH_MODE: z.enum(['none', 'basic', 'hmac']).optional(),
    DOORDASH_WEBHOOK_BASIC_USER: z.string().optional(),
    DOORDASH_WEBHOOK_BASIC_PASSWORD: z.string().optional(),
    DOORDASH_WEBHOOK_SECRET: z.string().optional(),
    DOORDASH_WEBHOOK_SIGNATURE_HEADER: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const mixup = stripeKeyModeIssue(data.STRIPE_SECRET_KEY, data.VITE_STRIPE_PUBLISHABLE_KEY)
    if (mixup) ctx.addIssue({ code: z.ZodIssueCode.custom, ...mixup })
    if (data.NODE_ENV === 'production' && !data.STRIPE_SECRET_KEY?.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'STRIPE_SECRET_KEY is required in production',
        path: ['STRIPE_SECRET_KEY'],
      })
    }
    if (data.NODE_ENV !== 'production') {
      return
    }
    for (const issue of launchConfigIssues(data)) ctx.addIssue({ code: z.ZodIssueCode.custom, ...issue })
    const mode = data.DOORDASH_WEBHOOK_AUTH_MODE
    if (mode !== 'basic' && mode !== 'hmac') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'DOORDASH_WEBHOOK_AUTH_MODE must be "basic" or "hmac" in production (unset, "none", and invalid values are rejected).',
        path: ['DOORDASH_WEBHOOK_AUTH_MODE'],
      })
      return
    }
    if (mode === 'basic') {
      if (!data.DOORDASH_WEBHOOK_BASIC_USER?.length || !data.DOORDASH_WEBHOOK_BASIC_PASSWORD?.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'DOORDASH_WEBHOOK_BASIC_USER and DOORDASH_WEBHOOK_BASIC_PASSWORD are required when DOORDASH_WEBHOOK_AUTH_MODE is basic in production.',
          path: ['DOORDASH_WEBHOOK_BASIC_USER'],
        })
      }
    }
    if (mode === 'hmac') {
      if (!data.DOORDASH_WEBHOOK_SECRET?.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'DOORDASH_WEBHOOK_SECRET is required when DOORDASH_WEBHOOK_AUTH_MODE is hmac in production.',
          path: ['DOORDASH_WEBHOOK_SECRET'],
        })
      }
    }
  })

export type ServerEnv = z.infer<typeof envSchema>

const stripeKeyMode = (key: string | undefined, prefixes: string): 'test' | 'live' | null =>
  new RegExp(`^(${prefixes})_(test|live)_[A-Za-z0-9]+$`).exec(key ?? '')?.[2] as 'test' | 'live' | undefined ?? null

/**
 * A test publishable key with a live secret key (or the reverse) makes every card fail inside Stripe
 * with a confusing "No such PaymentMethod". Refuse to start instead. Placeholders are ignored.
 */
export function stripeKeyModeIssue(secretKey: string | undefined, publishableKey: string | undefined): { message: string; path: string[] } | null {
  const secret = stripeKeyMode(secretKey, 'sk|rk')
  const publishable = stripeKeyMode(publishableKey, 'pk')
  if (!secret || !publishable || secret === publishable) return null
  return {
    message: `STRIPE_SECRET_KEY is a ${secret} key but VITE_STRIPE_PUBLISHABLE_KEY is a ${publishable} key; use test keys together or live keys together`,
    path: ['VITE_STRIPE_PUBLISHABLE_KEY'],
  }
}

const real = (value: string | undefined) => Boolean(value && !/^your[_-]/i.test(value))

/**
 * What production must have before it takes money or promises delivery: real Stripe keys (never a
 * `your_…` placeholder), a webhook secret so payments are confirmed, a precise geocoder unless
 * approximate delivery is knowingly chosen, and no silent tax estimate.
 */
export function launchConfigIssues(data: {
  STRIPE_SECRET_KEY?: string
  STRIPE_WEBHOOK_SECRET?: string
  MAPBOX_ACCESS_TOKEN?: string
  GEOCODING_API_KEY?: string
  ALLOW_APPROXIMATE_DELIVERY?: string
  TAX_PROVIDER?: string
  ALLOW_ESTIMATED_TAX?: string
}): { message: string; path: string[] }[] {
  const issues: { message: string; path: string[] }[] = []
  if (data.STRIPE_SECRET_KEY?.length && !/^(sk|rk)_(test|live)_[A-Za-z0-9]+$/.test(data.STRIPE_SECRET_KEY)) {
    issues.push({ message: 'STRIPE_SECRET_KEY must be a real Stripe secret key (sk_live_… or sk_test_…), not a placeholder', path: ['STRIPE_SECRET_KEY'] })
  }
  if (!/^whsec_[A-Za-z0-9]+$/.test(data.STRIPE_WEBHOOK_SECRET ?? '')) {
    issues.push({ message: 'STRIPE_WEBHOOK_SECRET (whsec_…) is required in production; without it card orders are never marked paid', path: ['STRIPE_WEBHOOK_SECRET'] })
  }
  if (!real(data.MAPBOX_ACCESS_TOKEN) && !real(data.GEOCODING_API_KEY) && data.ALLOW_APPROXIMATE_DELIVERY === undefined) {
    issues.push({
      message:
        'Set MAPBOX_ACCESS_TOKEN for precise delivery addresses. Without one, set ALLOW_APPROXIMATE_DELIVERY=false (no delivery) or =true (ZIP-center delivery) deliberately.',
      path: ['MAPBOX_ACCESS_TOKEN'],
    })
  }
  if (data.TAX_PROVIDER === 'estimate' && data.ALLOW_ESTIMATED_TAX !== 'true') {
    issues.push({ message: 'TAX_PROVIDER=estimate in production needs ALLOW_ESTIMATED_TAX=true; use Stripe Tax for real orders', path: ['TAX_PROVIDER'] })
  }
  return issues
}

export function parseEnv(source: Record<string, string | undefined>): z.SafeParseReturnType<
  Record<string, string | undefined>,
  ServerEnv
> {
  return envSchema.safeParse(source)
}
