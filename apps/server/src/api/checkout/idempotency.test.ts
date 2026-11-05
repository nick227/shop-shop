/**
 * Idempotency without Redis: requests stay fast, and a retried request still gets the first response.
 */
import { describe, it, expect, afterAll } from 'vitest'
import Fastify from 'fastify'
import { memoryIdempotencyStore, redisFallbackStore, setupIdempotency } from './idempotency.js'

describe('idempotency', () => {
  // A port nothing listens on: Redis is "down".
  const offline = redisFallbackStore('redis://127.0.0.1:6390', () => undefined)
  const app = Fastify({ logger: false })
  let calls = 0

  afterAll(async () => {
    await app.close()
  })

  it('answers immediately and replays a retried request when Redis is unavailable', async () => {
    await app.register(async (scope) => {
      setupIdempotency(scope, {}, offline)
      scope.post('/charge', async () => ({ charge: ++calls }))
    })
    await app.ready()

    const send = () => app.inject({ method: 'POST', url: '/charge', headers: { 'x-idempotency-key': 'retry-key-123' }, payload: {} })
    const started = Date.now()
    const first = await send()
    const second = await send()
    expect(Date.now() - started).toBeLessThan(500)
    expect(first.json()).toEqual({ charge: 1 })
    expect(second.json()).toEqual({ charge: 1 })
    expect(second.headers['x-idempotency-response']).toBe('true')
    expect(calls).toBe(1)
  })

  it('forgets entries after their time to live', async () => {
    let now = 1000
    const store = memoryIdempotencyStore(() => now)
    await store.set('k', 10, 'v')
    expect(await store.get('k')).toBe('v')
    now += 11_000
    expect(await store.get('k')).toBeNull()
  })
})
