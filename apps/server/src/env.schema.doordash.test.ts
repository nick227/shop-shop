import { describe, it, expect } from 'vitest'
import { parseEnv } from './env.schema.js'

function baseEnv(overrides: Record<string, string> = {}): Record<string, string> {
  return {
    DATABASE_URL: 'mysql://u:p@localhost:3306/db',
    JWT_SECRET: 'a'.repeat(32),
    JWT_REFRESH_SECRET: 'b'.repeat(32),
    NODE_ENV: 'test',
    STRIPE_SECRET_KEY: 'sk_test_placeholder_for_schema_tests',
    ...overrides,
  }
}

describe('parseEnv DoorDash + production rules', () => {
  it('allows unset / none / invalid mode in development', () => {
    expect(parseEnv(baseEnv({ NODE_ENV: 'development' })).success).toBe(true)
    expect(parseEnv(baseEnv({ NODE_ENV: 'development', DOORDASH_WEBHOOK_AUTH_MODE: 'none' })).success).toBe(
      true,
    )
  })

  it('rejects production without explicit basic or hmac', () => {
    const r = parseEnv(
      baseEnv({
        NODE_ENV: 'production',
        DOORDASH_WEBHOOK_AUTH_MODE: 'none',
      }),
    )
    expect(r.success).toBe(false)
  })

  it('rejects production when DOORDASH_WEBHOOK_AUTH_MODE is unset', () => {
    const r = parseEnv(
      baseEnv({
        NODE_ENV: 'production',
      }),
    )
    expect(r.success).toBe(false)
  })

  it('accepts production with basic + credentials', () => {
    const r = parseEnv(
      baseEnv({
        NODE_ENV: 'production',
        DOORDASH_WEBHOOK_AUTH_MODE: 'basic',
        DOORDASH_WEBHOOK_BASIC_USER: 'shopshop',
        DOORDASH_WEBHOOK_BASIC_PASSWORD: 'secret',
      }),
    )
    expect(r.success).toBe(true)
  })

  it('rejects production basic without password', () => {
    const r = parseEnv(
      baseEnv({
        NODE_ENV: 'production',
        DOORDASH_WEBHOOK_AUTH_MODE: 'basic',
        DOORDASH_WEBHOOK_BASIC_USER: 'shopshop',
      }),
    )
    expect(r.success).toBe(false)
  })

  it('accepts production with hmac + secret', () => {
    const r = parseEnv(
      baseEnv({
        NODE_ENV: 'production',
        DOORDASH_WEBHOOK_AUTH_MODE: 'hmac',
        DOORDASH_WEBHOOK_SECRET: 'abc123',
      }),
    )
    expect(r.success).toBe(true)
  })
})
