/**
 * Layered probes for Fastify `inject` hangs (see docs/TRACKED_BUGS.md).
 * Remove or collapse once the root cause is fixed.
 */
import { describe, it, expect } from 'vitest'
import Fastify from 'fastify'
import { prisma } from '@packages/db'
import { authenticate } from '../middleware/auth.js'
import { requireAuth } from '../middleware/rbac.js'
import { authHeaders, createAuthenticatedUser } from '../__tests__/helpers.js'

const UUID = '00000000-0000-4000-8000-000000000001'

describe('inject hang probes', { timeout: 15_000 }, () => {
  it('layer 1 — bare Fastify, POST returns 201 { ok: true }', async () => {
    const app = Fastify({ logger: false })
    app.post('/debug-dispatch-test', async (_request, reply) => reply.code(201).send({ ok: true }))
    await app.ready()
    const res = await app.inject({
      method: 'POST',
      url: '/debug-dispatch-test',
      payload: {},
    })
    expect(res.statusCode).toBe(201)
    await app.close()
  })

  it('layer 2 — Fastify + req.decorate(authenticate) only, same debug route', async () => {
    const app = Fastify({ logger: false })
    app.decorate('authenticate', authenticate)
    app.post('/debug-dispatch-test', async (_request, reply) => reply.code(201).send({ ok: true }))
    await app.ready()
    const res = await app.inject({
      method: 'POST',
      url: '/debug-dispatch-test',
      payload: {},
    })
    expect(res.statusCode).toBe(201)
    await app.close()
  })

  it('layer 3 — same URL shape as dispatch, stub handler (no auth)', async () => {
    const app = Fastify({ logger: false })
    app.decorate('authenticate', authenticate)
    app.post(`/api/v1/orders/:orderId/dispatch`, async (_request, reply) =>
      reply.code(201).send({ ok: true }),
    )
    await app.ready()
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/orders/${UUID}/dispatch`,
      payload: {},
    })
    expect(res.statusCode).toBe(201)
    await app.close()
  })

  it('layer 3b — no-op async preHandler only (isolates preHandler vs auth)', async () => {
    const app = Fastify({ logger: false })
    app.decorate('authenticate', authenticate)
    app.post(`/api/v1/orders/:orderId/dispatch`, {
      preHandler: [async () => undefined],
    }, async (_request, reply) => reply.code(201).send({ ok: true }))
    await app.ready()
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/orders/${UUID}/dispatch`,
      payload: {},
    })
    expect(res.statusCode).toBe(201)
    await app.close()
  })

  it('layer 3c — authenticate() inside route handler + Bearer (not requireAuth preHandler)', async () => {
    const vendor = await createAuthenticatedUser('VENDOR')
    const app = Fastify({ logger: false })
    app.decorate('authenticate', authenticate)
    app.post(`/api/v1/orders/:orderId/dispatch`, async (request, reply) => {
      await authenticate(request, reply)
      if (!request.user) return reply
      return reply.code(201).send({ ok: true })
    })
    await app.ready()
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/orders/${UUID}/dispatch`,
      headers: authHeaders(vendor.token),
      payload: {},
    })
    expect(res.statusCode).toBe(201)
    await app.close()
  })

  it('layer 4 — preHandler requireAuth + Bearer token + 201 stub', async () => {
    const vendor = await createAuthenticatedUser('VENDOR')
    const app = Fastify({ logger: false })
    app.decorate('authenticate', authenticate)
    app.post(`/api/v1/orders/:orderId/dispatch`, { preHandler: [requireAuth] }, async (_request, reply) =>
      reply.code(201).send({ ok: true }),
    )
    await app.ready()
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/orders/${UUID}/dispatch`,
      headers: authHeaders(vendor.token),
      payload: {},
    })
    expect(res.statusCode).toBe(201)
    await app.close()
  })

  it('layer 5 — layer 4 + JSON body (provider enum shape)', async () => {
    const vendor = await createAuthenticatedUser('VENDOR')
    const app = Fastify({ logger: false })
    app.decorate('authenticate', authenticate)
    app.post(`/api/v1/orders/:orderId/dispatch`, { preHandler: [requireAuth] }, async (_request, reply) =>
      reply.code(201).send({ ok: true }),
    )
    await app.ready()
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/orders/${UUID}/dispatch`,
      headers: {
        ...authHeaders(vendor.token),
        'content-type': 'application/json',
      },
      payload: { provider: 'DOORDASH_DRIVE' },
    })
    expect(res.statusCode).toBe(201)
    await app.close()
  })

  it('layer 6 — auth + prisma findFirst in handler, then 201', async () => {
    const vendor = await createAuthenticatedUser('VENDOR')
    const app = Fastify({ logger: false })
    app.decorate('authenticate', authenticate)
    app.post(`/api/v1/orders/:orderId/dispatch`, { preHandler: [requireAuth] }, async (_request, reply) => {
      await prisma.user.findFirst({ select: { id: true } })
      return reply.code(201).send({ ok: true })
    })
    await app.ready()
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/orders/${UUID}/dispatch`,
      headers: authHeaders(vendor.token),
      payload: { provider: 'DOORDASH_DRIVE' },
    })
    expect(res.statusCode).toBe(201)
    await app.close()
  })
})
