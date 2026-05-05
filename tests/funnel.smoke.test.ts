import { describe, expect, it } from 'vitest'

declare const process: {
  env: Record<string, string | undefined>
}

const apiRootUrl = (process.env.SHOP_SHOP_API_BASE_URL ?? process.env.API_BASE_URL ?? '').replace(/\/$/, '')
const checkoutBaseUrl = apiRootUrl.endsWith('/api/v1') ? apiRootUrl : `${apiRootUrl}/api/v1`
const resourceBaseUrl = apiRootUrl.endsWith('/api/v1') ? apiRootUrl.replace(/\/api\/v1$/, '') : apiRootUrl
const authToken = process.env.SHOP_SHOP_API_TOKEN ?? process.env.API_TOKEN ?? ''
const itemId = process.env.FUNNEL_ITEM_ID ?? process.env.CHECKOUT_ITEM_ID ?? ''
const paymentToken = process.env.CHECKOUT_PAYMENT_TOKEN ?? ''
const searchUrl = process.env.FUNNEL_SEARCH_URL ?? ''
const kitchenUrl = process.env.FUNNEL_KITCHEN_URL ?? ''

function requireEnv() {
  const missing = [
    ['SHOP_SHOP_API_BASE_URL or API_BASE_URL', apiRootUrl],
    ['SHOP_SHOP_API_TOKEN or API_TOKEN', authToken],
    ['FUNNEL_ITEM_ID or CHECKOUT_ITEM_ID', itemId],
    ['CHECKOUT_PAYMENT_TOKEN', paymentToken],
  ].filter(([, value]) => !value)

  if (missing.length > 0) {
    throw new Error(`Missing required API test env vars: ${missing.map(([name]) => name).join(', ')}`)
  }
}

function authHeaders(idempotencyKey?: string) {
  return {
    Authorization: `Bearer ${authToken}`,
    'Content-Type': 'application/json',
    ...(idempotencyKey ? { 'X-Idempotency-Key': idempotencyKey } : {}),
  }
}

async function getOk(url: string) {
  const response = await fetch(url, { headers: { Authorization: `Bearer ${authToken}` } })
  expect(response.ok).toBe(true)
  return response.json().catch(() => null) as Promise<unknown>
}

function expectArrayWithItems(body: unknown, keys: string[]) {
  expect(body).toBeTruthy()
  expect(typeof body).toBe('object')
  expect(Array.isArray(body)).toBe(false)

  const record = body as Record<string, unknown>
  for (const key of keys) {
    const value = record[key]
    if (Array.isArray(value)) {
      expect(value.length).toBeGreaterThan(0)
      return value
    }
  }

  throw new Error(`Expected one of [${keys.join(', ')}] to be a non-empty array`)
}

async function apiJson(path: string, init: RequestInit) {
  const baseUrl = path.startsWith('/checkout/') ? checkoutBaseUrl : resourceBaseUrl
  const response = await fetch(`${baseUrl}${path}`, init)
  const body = await response.json().catch(() => null)
  expect(response.ok, JSON.stringify(body)).toBe(true)
  return body as Record<string, unknown>
}

function expectNonEmptyString(value: unknown) {
  expect(typeof value).toBe('string')
  expect(value).not.toBe('')
}

describe('funnel smoke validation', () => {
  it('validates search -> kitchen -> add -> cart -> checkout -> order', async () => {
    requireEnv()

    if (searchUrl) {
      const search = await getOk(searchUrl)
      const results = expectArrayWithItems(search, ['results', 'items', 'data'])
      expect(results.length).toBeGreaterThan(0)
    }

    if (kitchenUrl) {
      const kitchen = await getOk(kitchenUrl)
      const items = expectArrayWithItems(kitchen, ['items', 'results', 'data'])
      expect(items.length).toBeGreaterThan(0)

      const firstItem = items[0] as Record<string, unknown>
      expect(Number(firstItem.price ?? firstItem.unitPrice ?? 0)).toBeGreaterThan(0)
    }

    const cart = await apiJson('/carts', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ itemId, quantity: 1 }),
    })

    const cartItems = Array.isArray(cart.items) ? cart.items : []
    expectNonEmptyString(cart.id)
    expect(cart.status).toBe('ACTIVE')
    expect(cartItems.length).toBeGreaterThan(0)
    expect(Number((cartItems[0] as Record<string, unknown>)?.currentItem?.price ?? (cartItems[0] as Record<string, unknown>)?.item?.price ?? 0)).toBeGreaterThan(0)
    expect(Number(cart.itemCount ?? 0)).toBeGreaterThanOrEqual(1)
    expect(Number(cart.subtotal ?? 0)).toBeGreaterThan(0)

    const session = await apiJson('/checkout/session', {
      method: 'POST',
      headers: authHeaders(`smoke_session_${Date.now()}`),
      body: JSON.stringify({
        items: [{ itemId, quantity: 1 }],
        deliveryType: 'PICKUP',
        paymentMethod: {
          type: 'CREDIT_CARD',
          token: paymentToken,
        },
        tipAmount: 0,
      }),
    })

    expectNonEmptyString(session.sessionId)
    expect(Number(session.total)).toBeGreaterThan(0)

    const complete = await apiJson('/checkout/complete', {
      method: 'POST',
      headers: authHeaders(`smoke_complete_${Date.now()}`),
      body: JSON.stringify({
        sessionId: session.sessionId,
        paymentMethod: {
          type: 'CREDIT_CARD',
          token: paymentToken,
        },
        tipAmount: 0,
      }),
    })

    expect(typeof complete.order).toBe('object')
    const order = complete.order as Record<string, unknown>
    expectNonEmptyString(order.id)
    expectNonEmptyString(complete.paymentId)

    const status = await apiJson(`/checkout/status/${session.sessionId}`, {
      method: 'GET',
      headers: authHeaders(),
    })

    expect(status.sessionId).toBe(session.sessionId)
    expect(status.status).toMatch(/^(awaiting_payment|completed)$/)
    expect(typeof status.order).toBe('object')
  })
})
