import { describe, it, expect, beforeAll } from 'vitest'
import Fastify from 'fastify'
import Stripe from 'stripe'
import { prisma } from '@packages/db'
import { stripeWebhookRoutes } from './stripe-webhook.route.js'

const WEBHOOK_SECRET = `whsec_${'a'.repeat(32)}`
const STRIPE_KEY = `sk_test_${'b'.repeat(32)}`

describe('Stripe webhook (raw body + signature)', () => {
  beforeAll(() => {
    process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET
    process.env.STRIPE_SECRET_KEY = STRIPE_KEY
  })

  it('verifies signature when POST body matches signed bytes', async () => {
    const app = Fastify({ logger: false })
    await app.register(stripeWebhookRoutes)
    await app.ready()

    const eventPayload = {
      id: `evt_test_wh_${Date.now()}`,
      object: 'event',
      api_version: '2024-11-20.acacia',
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: `pi_test_${Date.now()}`,
          object: 'payment_intent',
        },
      },
      livemode: false,
      pending_webhooks: 1,
      request: { id: null, idempotency_key: null },
      type: 'payment_intent.succeeded',
    }

    const payloadString = JSON.stringify(eventPayload)
    const signature = Stripe.webhooks.generateTestHeaderString({
      payload: payloadString,
      secret: WEBHOOK_SECRET,
    })

    const res = await app.inject({
      method: 'POST',
      url: '/webhooks/stripe',
      headers: {
        'content-type': 'application/json',
        'stripe-signature': signature,
      },
      payload: payloadString,
    })

    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body) as { received?: boolean; processed?: boolean }
    expect(body.received).toBe(true)
    expect(body.processed).toBe(true)

    await prisma.paymentWebhook.deleteMany({ where: { eventId: eventPayload.id } })
    await app.close()
  })

  it('returns 400 when body bytes differ from signed payload', async () => {
    const app = Fastify({ logger: false })
    await app.register(stripeWebhookRoutes)
    await app.ready()

    const original = JSON.stringify({
      id: `evt_tamper_${Date.now()}`,
      object: 'event',
      api_version: '2024-11-20.acacia',
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: 'pi_original_id',
          object: 'payment_intent',
        },
      },
      livemode: false,
      pending_webhooks: 1,
      request: { id: null, idempotency_key: null },
      type: 'payment_intent.succeeded',
    })

    const signature = Stripe.webhooks.generateTestHeaderString({
      payload: original,
      secret: WEBHOOK_SECRET,
    })

    const tampered = original.replace('pi_original_id', 'pi_changed_id')

    const res = await app.inject({
      method: 'POST',
      url: '/webhooks/stripe',
      headers: {
        'content-type': 'application/json',
        'stripe-signature': signature,
      },
      payload: tampered,
    })

    expect(res.statusCode).toBe(400)
    await app.close()
  })
})
