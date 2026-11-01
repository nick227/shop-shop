/**
 * Merchant pause vs administrative restriction: the merchant controls only `acceptingOrders`;
 * `status` and the disabled fields stay with admins.
 */
import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest'
import Fastify, { type FastifyInstance } from 'fastify'
import { enrollVendor, prisma } from '@packages/db'
import { registerAllResources } from './loader.js'
import { ALL_RESOURCES } from '../resources/index.js'
import { storeOrderingRoutes } from './store-ordering.route.js'
import { authenticate } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'
import { createAuthenticatedUser, authHeaders, createTestStore, cleanupTestData, type TestUser } from '../__tests__/helpers.js'

describe('store ordering controls', () => {
  let app: FastifyInstance
  let owner: TestUser
  let storeId: string

  beforeAll(async () => {
    app = Fastify({ logger: false })
    app.decorate('authenticate', authenticate)
    app.decorate('requireRole', requireRole)
    await registerAllResources(app, ALL_RESOURCES)
    await app.register(storeOrderingRoutes)
    await app.ready()
  })

  beforeEach(async () => {
    owner = await createAuthenticatedUser('VENDOR')
    await enrollVendor(owner.id)
    storeId = (await createTestStore(owner.id, { isPublished: true })).id
  })

  afterAll(async () => {
    await cleanupTestData()
    await app.close()
  })

  const setOrdering = (user: TestUser, payload: unknown) =>
    app.inject({ method: 'PUT', url: `/stores/${storeId}/ordering`, headers: authHeaders(user.token), payload })

  it('lets the owner pause and resume, recording who and why', async () => {
    const paused = await setOrdering(owner, { acceptingOrders: false, reason: 'Sold out for today' })
    expect(paused.statusCode).toBe(200)
    expect(JSON.parse(paused.body)).toMatchObject({
      acceptingOrders: false,
      pauseReason: 'Sold out for today',
      pausedByUserId: owner.id,
      unavailableReason: 'PAUSED_BY_STORE',
    })

    const resumed = await setOrdering(owner, { acceptingOrders: true })
    expect(JSON.parse(resumed.body)).toMatchObject({ acceptingOrders: true, pauseReason: null, unavailableReason: null })
  })

  it('never lifts an admin suspension when the merchant resumes', async () => {
    await prisma.store.update({ where: { id: storeId }, data: { status: 'DISABLED', disabledReason: 'Policy review' } })

    const resumed = await setOrdering(owner, { acceptingOrders: true })
    expect(resumed.statusCode).toBe(200)
    expect(JSON.parse(resumed.body).unavailableReason).toBe('DISABLED')

    const store = await prisma.store.findUniqueOrThrow({ where: { id: storeId }, select: { status: true, disabledReason: true } })
    expect(store).toEqual({ status: 'DISABLED', disabledReason: 'Policy review' })
  })

  it('ignores status and pause fields sent through the store update', async () => {
    await prisma.store.update({ where: { id: storeId }, data: { status: 'PAUSED', acceptingOrders: false } })
    const store = await prisma.store.findUniqueOrThrow({ where: { id: storeId } })

    const response = await app.inject({
      method: 'PATCH',
      url: `/stores/${storeId}`,
      headers: authHeaders(owner.token),
      payload: {
        name: store.name,
        slug: store.slug,
        description: store.description ?? 'A store',
        phone: store.phone ?? '5550100',
        email: store.email ?? 'store@test.com',
        website: store.website ?? 'https://example.test',
        status: 'ACTIVE',
        disabledReason: null,
        acceptingOrders: true,
      },
    })
    expect(response.statusCode).toBe(200)

    const after = await prisma.store.findUniqueOrThrow({ where: { id: storeId }, select: { status: true, acceptingOrders: true } })
    expect(after).toEqual({ status: 'PAUSED', acceptingOrders: false })
  })

  it('refuses members without settings access', async () => {
    const handler = await createAuthenticatedUser('USER')
    await prisma.teamMember.create({
      data: { storeId, userId: handler.id, permissionsJson: ['VIEW_ORDERS', 'MANAGE_ORDERS'], isActive: true },
    })

    const response = await setOrdering(handler, { acceptingOrders: false })
    expect(response.statusCode).toBe(403)
    const store = await prisma.store.findUniqueOrThrow({ where: { id: storeId }, select: { acceptingOrders: true } })
    expect(store.acceptingOrders).toBe(true)
  })
})
