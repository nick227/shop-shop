/** Production refuses to start without what it needs to charge cards and judge delivery correctly. */
import { describe, it, expect } from 'vitest'
import { parseEnv } from './env.schema.js'

const production = (overrides: Record<string, string | undefined> = {}) => {
  const env: Record<string, string | undefined> = {
    DATABASE_URL: 'mysql://u:p@localhost:3306/db',
    JWT_SECRET: 'a'.repeat(32),
    JWT_REFRESH_SECRET: 'b'.repeat(32),
    NODE_ENV: 'production',
    DOORDASH_WEBHOOK_AUTH_MODE: 'hmac',
    DOORDASH_WEBHOOK_SECRET: 'dd-secret',
    STRIPE_SECRET_KEY: 'sk_live_abc123',
    STRIPE_WEBHOOK_SECRET: 'whsec_abc123',
    MAPBOX_ACCESS_TOKEN: 'pk.eyJ1abc',
    ...overrides,
  }
  return parseEnv(env)
}
const problems = (result: ReturnType<typeof parseEnv>) => (result.success ? [] : result.error.issues.map((i) => i.path.join('.')))

describe('production launch configuration', () => {
  it('starts with real Stripe keys and a precise geocoder', () => {
    expect(problems(production())).toEqual([])
  })

  it('refuses missing or placeholder Stripe keys and a missing webhook secret', () => {
    expect(problems(production({ STRIPE_SECRET_KEY: undefined }))).toContain('STRIPE_SECRET_KEY')
    expect(problems(production({ STRIPE_SECRET_KEY: 'your_stripe_secret_key' }))).toContain('STRIPE_SECRET_KEY')
    expect(problems(production({ STRIPE_WEBHOOK_SECRET: 'your_stripe_webhook_secret' }))).toContain('STRIPE_WEBHOOK_SECRET')
  })

  it('needs a precise geocoder, or an explicit choice about approximate delivery', () => {
    expect(problems(production({ MAPBOX_ACCESS_TOKEN: undefined }))).toContain('MAPBOX_ACCESS_TOKEN')
    expect(problems(production({ MAPBOX_ACCESS_TOKEN: 'your_mapbox_token' }))).toContain('MAPBOX_ACCESS_TOKEN')
    expect(problems(production({ MAPBOX_ACCESS_TOKEN: undefined, ALLOW_APPROXIMATE_DELIVERY: 'false' }))).toEqual([])
  })

  it('refuses a silent tax estimate', () => {
    expect(problems(production({ TAX_PROVIDER: 'estimate' }))).toContain('TAX_PROVIDER')
    expect(problems(production({ TAX_PROVIDER: 'estimate', ALLOW_ESTIMATED_TAX: 'true' }))).toEqual([])
  })

  it('leaves development alone', () => {
    expect(problems(production({ NODE_ENV: 'development', STRIPE_SECRET_KEY: 'your_key', STRIPE_WEBHOOK_SECRET: undefined, MAPBOX_ACCESS_TOKEN: undefined }))).toEqual([])
  })

  it('refuses Stripe keys from different modes, in any environment', () => {
    expect(problems(production({ VITE_STRIPE_PUBLISHABLE_KEY: 'pk_test_abc123' }))).toContain('VITE_STRIPE_PUBLISHABLE_KEY')
    expect(problems(production({ NODE_ENV: 'development', STRIPE_SECRET_KEY: 'sk_test_abc', VITE_STRIPE_PUBLISHABLE_KEY: 'pk_live_abc' }))).toContain('VITE_STRIPE_PUBLISHABLE_KEY')
    expect(problems(production({ VITE_STRIPE_PUBLISHABLE_KEY: 'pk_live_abc123' }))).toEqual([])
    expect(problems(production({ NODE_ENV: 'development', STRIPE_SECRET_KEY: 'sk_test_abc', VITE_STRIPE_PUBLISHABLE_KEY: 'your_key' }))).toEqual([])
  })
})
