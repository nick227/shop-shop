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

    ENABLE_COD_PAYMENTS: z.enum(['true', 'false']).optional(),

    GEOCODING_API_KEY: z.string().optional(),

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

export function parseEnv(source: Record<string, string | undefined>): z.SafeParseReturnType<
  Record<string, string | undefined>,
  ServerEnv
> {
  return envSchema.safeParse(source)
}
