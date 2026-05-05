import { describe, expect, it } from 'vitest'

declare const process: {
  env: Record<string, string | undefined>
}

const ORDER_STATUSES = [
  'PENDING_PAYMENT',
  'PLACED',
  'ACCEPTED',
  'PREPARING',
  'READY',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'COMPLETED',
  'CANCELED',
] as const
const PAYMENT_STATUSES = ['UNPAID', 'PAID', 'REFUNDED'] as const
const CART_STATUSES = ['ACTIVE', 'SUBMITTED', 'ABANDONED'] as const
const CHECKOUT_STATUSES = ['pending', 'awaiting_payment', 'completed'] as const

const apiBaseUrl = (process.env.SHOP_SHOP_API_BASE_URL ?? process.env.API_BASE_URL ?? '').replace(/\/$/, '')
const authToken = process.env.SHOP_SHOP_API_TOKEN ?? process.env.API_TOKEN ?? ''
const itemId = process.env.CHECKOUT_ITEM_ID ?? process.env.FUNNEL_ITEM_ID ?? ''
const paymentToken = process.env.CHECKOUT_PAYMENT_TOKEN ?? ''

function requireEnv() {
  const missing = [
    ['SHOP_SHOP_API_BASE_URL or API_BASE_URL', apiBaseUrl],
    ['SHOP_SHOP_API_TOKEN or API_TOKEN', authToken],
    ['CHECKOUT_ITEM_ID or FUNNEL_ITEM_ID', itemId],
    ['CHECKOUT_PAYMENT_TOKEN', paymentToken],
  ].filter(([, value]) => !value)

  if (missing.length > 0) {
    throw new Error(`Missing required API test env vars: ${missing.map(([name]) => name).join(', ')}`)
  }
}

function headers(idempotencyKey?: string) {
  return {
    Authorization: `Bearer ${authToken}`,
    'Content-Type': 'application/json',
    ...(idempotencyKey ? { 'X-Idempotency-Key': idempotencyKey } : {}),
  }
}

async function requestJson(path: string, init: RequestInit) {
  const response = await fetch(`${apiBaseUrl}${path}`, init)
  const body = await response.json().catch(() => null)
  expect(response.ok, JSON.stringify(body)).toBe(true)
  return body as unknown
}

async function requestError(path: string, init: RequestInit, expectedStatus: number) {
  const response = await fetch(`${apiBaseUrl}${path}`, init)
  const body = await response.json().catch(() => null)
  expect(response.status, JSON.stringify(body)).toBe(expectedStatus)
  expectObject(body)
  expectString(body.error)
  expectString(body.message)
  return body
}

function expectObject(value: unknown): asserts value is Record<string, unknown> {
  expect(value).toBeTruthy()
  expect(typeof value).toBe('object')
  expect(Array.isArray(value)).toBe(false)
}

function expectString(value: unknown) {
  expect(typeof value).toBe('string')
  expect(value).not.toBe('')
}

function expectNumber(value: unknown) {
  expect(typeof value).toBe('number')
  expect(Number.isFinite(value)).toBe(true)
}

function expectEnum<T extends readonly string[]>(value: unknown, allowed: T) {
  expectString(value)
  expect(allowed).toContain(value as T[number])
}

function createSessionBody() {
  return {
    items: [{ itemId, quantity: 1 }],
    deliveryType: 'PICKUP',
    paymentMethod: {
      type: 'CREDIT_CARD',
      token: paymentToken,
    },
    tipAmount: 0,
  }
}

describe('runtime checkout OpenAPI contract', () => {
  it('validates POST /checkout/session, POST /checkout/complete, and GET /checkout/status responses', async () => {
    requireEnv()

    const session = await requestJson('/checkout/session', {
      method: 'POST',
      headers: headers(`rt_session_${Date.now()}`),
      body: JSON.stringify(createSessionBody()),
    })

    expectObject(session)
    expectString(session.sessionId)
    expectNumber(session.total)
    expectString(session.estimatedDelivery)
    expect(Number.isNaN(Date.parse(String(session.estimatedDelivery)))).toBe(false)

    const complete = await requestJson('/checkout/complete', {
      method: 'POST',
      headers: headers(`rt_complete_${Date.now()}`),
      body: JSON.stringify({
        sessionId: session.sessionId,
        paymentMethod: {
          type: 'CREDIT_CARD',
          token: paymentToken,
        },
        tipAmount: 0,
      }),
    })

    expectObject(complete)
    expectObject(complete.order)
    expectString(complete.order.id)
    expectEnum(complete.order.status, ORDER_STATUSES)
    expectNumber(complete.order.total)
    expectString(complete.order.createdAt)
    expectString(complete.paymentId)

    const status = await requestJson(`/checkout/status/${session.sessionId}`, {
      method: 'GET',
      headers: headers(),
    })

    expectObject(status)
    expect(status.sessionId).toBe(session.sessionId)
    expectEnum(status.cartStatus, CART_STATUSES)
    expectEnum(status.status, CHECKOUT_STATUSES)
    expectString(status.createdAt)

    expectObject(status.order)
    expect(status.order.id).toBe(complete.order.id)
    expectEnum(status.order.status, ORDER_STATUSES)
    expectEnum(status.order.paymentStatus, PAYMENT_STATUSES)
    expectEnum(status.order.deliveryType, ['PICKUP', 'DELIVERY'] as const)
    expectNumber(status.order.subtotal)
    expectNumber(status.order.fees)
    expectNumber(status.order.tax)
    expectNumber(status.order.tip)
    expectNumber(status.order.total)
    expectString(status.order.createdAt)
    expectString(status.order.updatedAt)
  })

  it('validates negative checkout contract responses', async () => {
    requireEnv()

    await requestError('/checkout/session', {
      method: 'POST',
      headers: headers(`rt_bad_required_${Date.now()}`),
      body: JSON.stringify({
        deliveryType: 'PICKUP',
        paymentMethod: {
          type: 'CREDIT_CARD',
          token: paymentToken,
        },
      }),
    }, 400)

    await requestError('/checkout/session', {
      method: 'POST',
      headers: headers(`rt_bad_enum_${Date.now()}`),
      body: JSON.stringify({
        items: [{ itemId, quantity: 1 }],
        deliveryType: 'DRONE',
        paymentMethod: {
          type: 'CREDIT_CARD',
          token: paymentToken,
        },
      }),
    }, 400)

    await requestError('/checkout/status/not-a-uuid', {
      method: 'GET',
      headers: headers(),
    }, 400)

    const session = await requestJson('/checkout/session', {
      method: 'POST',
      headers: headers(`rt_conflict_session_${Date.now()}`),
      body: JSON.stringify(createSessionBody()),
    })

    expectObject(session)
    expectString(session.sessionId)

    const completePayload = {
      sessionId: session.sessionId,
      paymentMethod: {
        type: 'CREDIT_CARD',
        token: paymentToken,
      },
      tipAmount: 0,
    }

    await requestJson('/checkout/complete', {
      method: 'POST',
      headers: headers(`rt_conflict_complete_${Date.now()}`),
      body: JSON.stringify(completePayload),
    })

    await requestError('/checkout/complete', {
      method: 'POST',
      headers: headers(`rt_conflict_duplicate_${Date.now()}`),
      body: JSON.stringify(completePayload),
    }, 409)
  })
})
