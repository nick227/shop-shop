/**
 * Storefront config: drafts stay private until published, publishing and discarding move the right copy,
 * references are checked against the store, and the ordering state matches what checkout enforces.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import Fastify from 'fastify'
import { prisma } from '@packages/db'
import { storefrontRoutes } from '../routes/storefront.route.js'
import { optionalAuthenticate } from '../middleware/auth.js'
import { createAuthenticatedUser, authHeaders, createTestStore, createTestItem, createTestOrder, cleanupTestData } from './helpers.js'

describe('storefront', () => {
  const app = Fastify({ logger: false })
  let owner: Awaited<ReturnType<typeof createAuthenticatedUser>>
  let rival: Awaited<ReturnType<typeof createAuthenticatedUser>>
  let storeId: string
  let itemId: string
  let rivalItemId: string

  const get = (query = '', token?: string, store = storeId) =>
    app.inject({ method: 'GET', url: `/stores/${store}/storefront${query}`, headers: token ? authHeaders(token) : {} })
  const makeReady = async (id: string) => {
    await prisma.store.update({
      where: { id },
      data: {
        description: 'Ready to open',
        phone: '555-0100',
        addressStreet: '100 Test St',
        addressCity: 'Austin',
        addressState: 'TX',
        addressZip: '78701',
        latitude: '30.26720000',
        longitude: '-97.74310000',
        geocodedAt: new Date(),
        geocodeSource: 'test',
        pickupEnabled: true,
        deliveryEnabled: false,
      },
    })
    if ((await prisma.mediaAsset.count({ where: { storeId: id } })) === 0) {
      await prisma.mediaAsset.create({ data: { storeId: id, kind: 'IMAGE', url: `https://example.test/${id}.jpg` } })
    }
  }

  const send = (method: 'PUT' | 'POST', path: string, token: string, payload?: unknown) =>
    app.inject({
      method,
      url: `/stores/${storeId}/storefront${path}`,
      headers: authHeaders(token),
      ...(payload === undefined ? {} : { payload: payload as Record<string, unknown> }),
    })

  beforeAll(async () => {
    app.addHook('preHandler', optionalAuthenticate)
    await app.register(storefrontRoutes)
    await app.ready()
    owner = await createAuthenticatedUser('VENDOR')
    rival = await createAuthenticatedUser('VENDOR')
    storeId = (await createTestStore(owner.id, { isPublished: true })).id
    const rivalStoreId = (await createTestStore(rival.id, { isPublished: true })).id
    itemId = (await createTestItem(storeId, { title: 'Torta' })).id
    rivalItemId = (await createTestItem(rivalStoreId, { title: 'Not yours' })).id
  })

  afterAll(async () => {
    await cleanupTestData()
    await app.close()
  })

  it('shows the defaults before anything is published', async () => {
    const response = await get()
    expect(response.statusCode).toBe(200)
    const data = response.json().data
    expect(data.view).toBe('published')
    expect(data.config.brand.paletteId).toBe('market')
    expect(data.ordering).toMatchObject({ acceptingOrders: true, message: null })
    // No posted hours: no open/closed claim.
    expect(data.hours).toBeNull()
    expect(data.editor).toBeUndefined()
  })

  it('saves a draft without changing what shoppers see, and drops references to other stores', async () => {
    const saved = await send('PUT', '/draft', owner.token, {
      config: {
        brand: { tagline: 'Hot tortas daily', paletteId: 'tomato' },
        featured: { itemIds: [itemId, rivalItemId] },
      },
    })
    expect(saved.statusCode).toBe(200)
    expect(saved.json().data.draft.featured.itemIds).toEqual([itemId])
    expect(saved.json().data.hasUnpublishedChanges).toBe(true)

    expect((await get()).json().data.config.brand.tagline).toBe('')
    // Only the team may preview the draft; others get the published config.
    expect((await get('?view=draft', rival.token)).json().data.config.brand.tagline).toBe('')
    const preview = (await get('?view=draft', owner.token)).json().data
    expect(preview.view).toBe('draft')
    expect(preview.config.brand.tagline).toBe('Hot tortas daily')
  })

  it('publishes the draft, then discards later changes back to it', async () => {
    await makeReady(storeId)
    const published = await send('POST', '/publish', owner.token)
    expect(published.statusCode).toBe(200)
    expect(published.json().data.hasUnpublishedChanges).toBe(false)
    expect((await get()).json().data.config.brand.tagline).toBe('Hot tortas daily')

    await send('PUT', '/draft', owner.token, { config: { brand: { tagline: 'Half-baked idea', paletteId: 'tomato' } } })
    const discarded = await send('POST', '/discard', owner.token)
    expect(discarded.json().data.draft.brand.tagline).toBe('Hot tortas daily')
    expect(discarded.json().data.hasUnpublishedChanges).toBe(false)
  })

  it('refuses to publish until the store can go live, then enables it', async () => {
    const id = (await createTestStore(owner.id, { isPublished: false })).id
    const post = () => app.inject({ method: 'POST', url: `/stores/${id}/storefront/publish`, headers: authHeaders(owner.token) })
    const blocked = await post()
    expect(blocked.statusCode).toBe(400)
    expect(blocked.json().error).toMatch(/not ready to publish/)
    expect((await prisma.store.findUnique({ where: { id }, select: { isPublished: true } }))?.isPublished).toBe(false)

    await createTestItem(id, { title: 'Taco' })
    await makeReady(id)
    expect((await post()).statusCode).toBe(200)
    expect((await prisma.store.findUnique({ where: { id }, select: { isPublished: true } }))?.isPublished).toBe(true)
  })

  it('lets only the store’s managers change the storefront', async () => {
    expect((await send('PUT', '/draft', rival.token, { config: {} })).statusCode).toBe(403)
    expect((await send('POST', '/publish', rival.token)).statusCode).toBe(403)
    const anonymous = await app.inject({ method: 'PUT', url: `/stores/${storeId}/storefront/draft`, payload: { config: {} } })
    expect(anonymous.statusCode).toBe(401)
  })

  it('reports a merchant pause the way checkout enforces it', async () => {
    await prisma.store.update({ where: { id: storeId }, data: { acceptingOrders: false, ordersPausedReason: 'Back at 5pm' } })
    expect((await get()).json().data.ordering).toMatchObject({ acceptingOrders: false, message: 'Back at 5pm' })
    await prisma.store.update({ where: { id: storeId }, data: { acceptingOrders: true, ordersPausedReason: null } })
  })

  it('ranks popular items by units sold on recent, real orders', async () => {
    const quiet = (await createTestItem(storeId, { title: 'Agua' })).id
    const order = async (status: 'PLACED' | 'CANCELED', id: string, quantity: number) => {
      const created = await createTestOrder(owner.id, storeId, { status })
      await prisma.orderItem.create({ data: { orderId: created.id, itemId: id, titleSnapshot: 'x', unitPrice: 5, quantity } })
    }
    await order('PLACED', quiet, 1)
    await order('PLACED', itemId, 3)
    await order('CANCELED', quiet, 50)
    expect((await get()).json().data.popularItemIds).toEqual([itemId, quiet])
  })

  it('sends posted hours with the store’s own timezone', async () => {
    await prisma.store.update({
      where: { id: storeId },
      data: { timezone: 'America/Chicago', hoursJson: { storeHours: { MON: { open: '11:00', close: '21:00' } } } },
    })
    const hours = (await get()).json().data.hours
    expect(hours).toMatchObject({ timezone: 'America/Chicago', week: { MON: { open: '11:00', close: '21:00' } } })
    await prisma.store.update({ where: { id: storeId }, data: { timezone: null, hoursJson: null as never } })
  })

  it('prices bundles with the store’s pricing rules and leaves out ones that cannot be ordered whole', async () => {
    const a = (await createTestItem(storeId, { title: 'Coffee', price: '4.00' })).id
    const b = (await createTestItem(storeId, { title: 'Muffin', price: '3.00' })).id
    const gone = (await createTestItem(storeId, { title: 'Scone', price: '3.00' })).id
    const deal = await prisma.bundle.create({
      data: { storeId, name: 'Morning deal', items: { create: [{ itemId: a, sortIndex: 0 }, { itemId: b, quantity: 2, sortIndex: 1 }] }, pricing: { create: { pricingType: 'FIXED_PRICE', fixedPrice: 8 } } },
    })
    await prisma.bundle.create({ data: { storeId, name: 'Broken', items: { create: [{ itemId: a }, { itemId: gone }] } } })
    await prisma.item.update({ where: { id: gone }, data: { isSoldOut: true } })

    const bundles = (await get()).json().data.bundles as { id: string; resolvedPrice: number; itemSum: number; savings: number; items: unknown[] }[]
    expect(bundles.map((bundle) => bundle.id)).toEqual([deal.id])
    expect(bundles[0]).toMatchObject({ resolvedPrice: 8, itemSum: 10, savings: 2 })
    expect(bundles[0].items).toEqual([
      { itemId: a, title: 'Coffee', price: 4, quantity: 1 },
      { itemId: b, title: 'Muffin', price: 3, quantity: 2 },
    ])
  })

  it('hides an unpublished store from shoppers', async () => {
    const draftStore = (await createTestStore(owner.id, { isPublished: false })).id
    expect((await get('', undefined, draftStore)).statusCode).toBe(404)
    expect((await get('', owner.token, draftStore)).statusCode).toBe(200)
  })
})
