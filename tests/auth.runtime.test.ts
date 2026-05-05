import { describe, expect, it } from 'vitest'

declare const process: {
  env: Record<string, string | undefined>
}

const apiRootUrl = (process.env.SHOP_SHOP_API_BASE_URL ?? process.env.API_BASE_URL ?? '').replace(/\/$/, '')
const authBaseUrl = apiRootUrl.endsWith('/api/v1') ? apiRootUrl.replace(/\/api\/v1$/, '') : apiRootUrl
const authUrl = `${authBaseUrl}/auth/v1/login`
const authEmail = process.env.AUTH_EMAIL ?? 'customer@seed.local'
const authPassword = process.env.AUTH_PASSWORD ?? 'Test123456!'

function requireEnv() {
  if (!apiRootUrl) {
    throw new Error('Missing required API test env vars: SHOP_SHOP_API_BASE_URL or API_BASE_URL')
  }
}

async function login(body: Record<string, unknown>) {
  const response = await fetch(authUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const payload = await response.json().catch(() => null)
  return { response, payload }
}

function expectObject(value: unknown): asserts value is Record<string, unknown> {
  expect(value).toBeTruthy()
  expect(typeof value).toBe('object')
  expect(Array.isArray(value)).toBe(false)
}

describe('auth runtime validation', () => {
  it('logs in a seeded customer and returns a token', async () => {
    requireEnv()

    const { response, payload } = await login({
      email: authEmail,
      password: authPassword,
    })

    expect(response.status).toBe(200)
    expectObject(payload)
    expect(typeof payload.token).toBe('string')
    expect(payload.token).not.toBe('')
    expectObject(payload.user)
    expect(typeof payload.user.id).toBe('string')
    expect(typeof payload.user.email).toBe('string')
    expect(payload.user.email).toBe(authEmail)
  })

  it('rejects invalid credentials with 401', async () => {
    requireEnv()

    const { response, payload } = await login({
      email: authEmail,
      password: `${authPassword}-invalid`,
    })

    expect(response.status).toBe(401)
    expectObject(payload)
    expect(typeof payload.error).toBe('string')
    expect(payload.error).not.toBe('')
  })
})
