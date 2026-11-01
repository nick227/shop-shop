/**
 * Store isolation: one store's items never leak into another store's menu, bundles or sales,
 * whatever the client sends. These go through the real HTTP routes and database.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import Fastify from 'fastify'
import { registerAllResources } from '../routes/loader.js'
import { ALL_RESOURCES } from '../resources/index.js'
import { itemAnalyticsRoutes } from '../routes/item-analytics.route.js'
import { authenticate, optionalAuthenticate } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'
import { prisma } from '@packages/db'
import { createAuthenticatedUser, authHeaders, createTestStore, createTestItem, cleanupTestData } from './helpers.js'

describe('store isolation', () => {
  const app = Fastify({ logger: false })
  let owner: Awaited<ReturnType<typeof createAuthenticatedUser>>
  let rival: Awaited<ReturnType<typeof createAuthenticatedUser>>
  let storeId: string
  let rivalStoreId: string
  let mine: string[]
  let hiddenItemId: string
  let foreignItemId: string

  beforeAll(async () => {
    app.decorate('authenticate', authenticate)
    app.decorate('requireRole', requireRole)
    app.addHook('preHandler', optionalAuthenticate) // as in index.ts: public routes still know the caller
    await registerAllResources(app, ALL_RESOURCES)
    await app.register(itemAnalyticsRoutes)
    await app.ready()

    owner = await createAuthenticatedUser('VENDOR')
    rival = await createAuthenticatedUser('VENDOR')
    storeId = (await createTestStore(owner.id)).id
    rivalStoreId = (await createTestStore(rival.id)).id
    mine = [
      (await createTestItem(storeId, { title: 'Mine A' })).id,
      (await createTestItem(storeId, { title: 'Mine B' })).id,
    ]
    hiddenItemId = (await createTestItem(storeId, { title: 'Mine Hidden', isActive: false })).id
    foreignItemId = (await createTestItem(rivalStoreId, { title: 'Fish Taco' })).id
  })

  afterAll(async () => {
    await cleanupTestData()
    await app.close()
  })

  const bundlePayload = (itemIds: string[]) => ({
    storeId,
    name: 'Combo',
    items: itemIds.map((itemId) => ({ itemId, quantity: 1 })),
    pricing: { pricingType: 'DISCOUNT_PERCENT', discountPercent: 10 },
  })

  describe('menu list', () => {
    it('returns only the requested store’s items, hidden ones included for its owner', async () => {
      const res = await app.inject({ method: 'GET', url: `/items?storeId=${storeId}&limit=500`, headers: authHeaders(owner.token) })
      expect(res.statusCode).toBe(200)
      const ids = (JSON.parse(res.body).data as { id: string; storeId: string }[]).map((i) => i.id)
      expect(ids.sort()).toEqual([...mine, hiddenItemId].sort())
    })

    it('does not show a store’s hidden items to anyone without menu access', async () => {
      for (const headers of [authHeaders(rival.token), {}]) {
        const res = await app.inject({ method: 'GET', url: `/items?storeId=${storeId}&limit=500`, headers })
        expect(res.statusCode).toBe(200)
        const items = JSON.parse(res.body).data as { id: string; storeId: string }[]
        expect(items.every((i) => i.storeId === storeId)).toBe(true)
        expect(items.map((i) => i.id)).not.toContain(hiddenItemId)
      }
    })
  })

  describe('bundles', () => {
    it('creates a bundle from the store’s own items', async () => {
      const res = await app.inject({ method: 'POST', url: '/bundles', headers: authHeaders(owner.token), payload: bundlePayload(mine) })
      expect(res.statusCode).toBe(201)
      const links = await prisma.bundleItem.findMany({ where: { bundleId: JSON.parse(res.body).id } })
      expect(links.map((l) => l.itemId).sort()).toEqual([...mine].sort())
    })

    it('rejects creating a bundle that includes another store’s item', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/bundles',
        headers: authHeaders(owner.token),
        payload: bundlePayload([mine[0], foreignItemId]),
      })
      expect(res.statusCode).toBe(403)
      expect(JSON.parse(res.body).error).toMatch(/same store/)
      expect(await prisma.bundleItem.count({ where: { itemId: foreignItemId } })).toBe(0)
    })

    it('rejects adding another store’s item, or an unknown item, to an existing bundle', async () => {
      const created = await app.inject({ method: 'POST', url: '/bundles', headers: authHeaders(owner.token), payload: bundlePayload(mine) })
      expect(created.statusCode).toBe(201)
      const bundleId = JSON.parse(created.body).id as string

      // A valid replacement works, so the rejections below are about the items, not the route.
      const ok = await app.inject({
        method: 'PATCH',
        url: `/bundles/${bundleId}`,
        headers: authHeaders(owner.token),
        payload: { items: [mine[1], mine[0]].map((itemId) => ({ itemId, quantity: 2 })) },
      })
      expect(ok.statusCode).toBe(200)

      for (const bad of [foreignItemId, '00000000-0000-0000-0000-000000000000']) {
        const res = await app.inject({
          method: 'PATCH',
          url: `/bundles/${bundleId}`,
          headers: authHeaders(owner.token),
          payload: { items: [mine[0], bad].map((itemId) => ({ itemId, quantity: 1 })) },
        })
        expect(res.statusCode).toBe(403)
      }
      const links = await prisma.bundleItem.findMany({ where: { bundleId } })
      expect(links.map((l) => l.itemId).sort()).toEqual([...mine].sort())
    })

    it('rejects another vendor creating a bundle in this store', async () => {
      const res = await app.inject({ method: 'POST', url: '/bundles', headers: authHeaders(rival.token), payload: bundlePayload(mine) })
      expect(res.statusCode).toBe(403)
    })
  })

  describe('items', () => {
    it('rejects moving an item to another store', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: `/items/${mine[0]}`,
        headers: authHeaders(owner.token),
        payload: { storeId: rivalStoreId, title: 'Mine A', description: '', price: '5.00' },
      })
      expect(res.statusCode).toBe(403)
      expect((await prisma.item.findUnique({ where: { id: mine[0] } }))?.storeId).toBe(storeId)
    })
  })

  describe('sales', () => {
    it('reports only the store’s own items', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/items/analytics?storeId=${storeId}&limit=100`,
        headers: authHeaders(owner.token),
      })
      expect(res.statusCode).toBe(200)
      const ids = (JSON.parse(res.body).data.items as { itemId: string }[]).map((i) => i.itemId)
      expect(ids).not.toContain(foreignItemId)
      expect(ids).toEqual(expect.arrayContaining(mine))
    })

    it('refuses another vendor’s sales', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/items/analytics?storeId=${storeId}`,
        headers: authHeaders(rival.token),
      })
      expect(res.statusCode).toBe(403)
    })
  })
})
