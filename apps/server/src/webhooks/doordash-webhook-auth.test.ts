import { describe, it, expect } from 'vitest'
import crypto from 'node:crypto'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { verifyDoordashWebhookRequest, type DoordashWebhookAuthConfig } from './doordash-webhook-auth.js'

function mockReply() {
  let code = 0
  const body: { value?: unknown } = {}
  const reply = {
    code(n: number) {
      code = n
      return reply
    },
    send(p: unknown) {
      body.value = p
      return reply
    },
    getCode: () => code,
    getBody: () => body.value,
  }
  return reply as unknown as FastifyReply & { getCode: () => number; getBody: () => unknown }
}

function reqWith(
  headers: Record<string, string | string[] | undefined>,
  rawBody?: Buffer,
): FastifyRequest & { rawBody?: Buffer } {
  return { headers } as FastifyRequest & { rawBody?: Buffer }
}

describe('verifyDoordashWebhookRequest', () => {
  it('allows none mode without headers', () => {
    const auth: DoordashWebhookAuthConfig = {
      mode: 'none',
      signatureHeaderLower: 'x-doordash-signature',
    }
    const ok = verifyDoordashWebhookRequest(
      reqWith({}),
      mockReply(),
      auth,
      undefined,
    )
    expect(ok).toBe(true)
  })

  it('basic auth succeeds with valid credentials', () => {
    const token = Buffer.from('shopshop:local-secret', 'utf8').toString('base64')
    const auth: DoordashWebhookAuthConfig = {
      mode: 'basic',
      basicUser: 'shopshop',
      basicPassword: 'local-secret',
      signatureHeaderLower: 'x-doordash-signature',
    }
    const ok = verifyDoordashWebhookRequest(
      reqWith({ authorization: `Basic ${token}` }),
      mockReply(),
      auth,
      Buffer.from('{}'),
    )
    expect(ok).toBe(true)
  })

  it('basic auth rejects wrong password', () => {
    const token = Buffer.from('shopshop:wrong', 'utf8').toString('base64')
    const auth: DoordashWebhookAuthConfig = {
      mode: 'basic',
      basicUser: 'shopshop',
      basicPassword: 'local-secret',
      signatureHeaderLower: 'x-doordash-signature',
    }
    const reply = mockReply()
    const ok = verifyDoordashWebhookRequest(
      reqWith({ authorization: `Basic ${token}` }),
      reply,
      auth,
      Buffer.from('{}'),
    )
    expect(ok).toBe(false)
    expect(reply.getCode()).toBe(401)
  })

  it('basic auth rejects missing Authorization when mode is basic', () => {
    const auth: DoordashWebhookAuthConfig = {
      mode: 'basic',
      basicUser: 'u',
      basicPassword: 'p',
      signatureHeaderLower: 'x-doordash-signature',
    }
    const reply = mockReply()
    const ok = verifyDoordashWebhookRequest(reqWith({}), reply, auth, Buffer.from('{}'))
    expect(ok).toBe(false)
    expect(reply.getCode()).toBe(401)
  })

  it('hmac succeeds with matching hex signature', () => {
    const secret = 'whsec_test_secret_key'
    const raw = Buffer.from(JSON.stringify({ k: 1 }), 'utf8')
    const sig = crypto.createHmac('sha256', secret).update(raw).digest('hex')
    const auth: DoordashWebhookAuthConfig = {
      mode: 'hmac',
      hmacSecret: secret,
      signatureHeaderLower: 'x-doordash-signature',
    }
    const ok = verifyDoordashWebhookRequest(
      reqWith({ 'x-doordash-signature': sig }),
      mockReply(),
      auth,
      raw,
    )
    expect(ok).toBe(true)
  })

  it('hmac rejects wrong signature', () => {
    const secret = 'whsec_test_secret_key'
    const raw = Buffer.from(JSON.stringify({ k: 1 }), 'utf8')
    const auth: DoordashWebhookAuthConfig = {
      mode: 'hmac',
      hmacSecret: secret,
      signatureHeaderLower: 'x-doordash-signature',
    }
    const reply = mockReply()
    const ok = verifyDoordashWebhookRequest(
      reqWith({ 'x-doordash-signature': 'deadbeef' }),
      reply,
      auth,
      raw,
    )
    expect(ok).toBe(false)
    expect(reply.getCode()).toBe(401)
  })

  it('hmac rejects missing signature header when mode is hmac', () => {
    const auth: DoordashWebhookAuthConfig = {
      mode: 'hmac',
      hmacSecret: 's',
      signatureHeaderLower: 'x-doordash-signature',
    }
    const reply = mockReply()
    const ok = verifyDoordashWebhookRequest(reqWith({}), reply, auth, Buffer.from('{}'))
    expect(ok).toBe(false)
    expect(reply.getCode()).toBe(400)
  })
})
