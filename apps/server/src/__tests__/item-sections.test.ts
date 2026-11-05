/**
 * Items and menu sections: an item can only join one of its own store's sections, and a hidden section
 * hides its items from shoppers while the store's team still sees them.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import Fastify from 'fastify'
import { prisma } from '@packages/db'
import { registerResource } from '../routes/loader.js'
import { itemResource } from '../resources/item.resource.js'
import { optionalAuthenticate } from '../middleware/auth.js'
import { createAuthenticatedUser, authHeaders, createTestStore, createTestItem, cleanupTestData } from './helpers.js'

describe('items in menu sections', () => {
  const app = Fastify({ logger: false })
  let owner: Awaited<ReturnType<typeof createAuthenticatedUser>>
  let storeId: string
  let lunchId: string
  let hiddenId: string
  let rivalSectionId: string

  beforeAll(async () => {
    app.addHook('preHandler', optionalAuthenticate)
    await registerResource(app, itemResource)
    await app.ready()
    owner = await createAuthenticatedUser('VENDOR')
    const rival = await createAuthenticatedUser('VENDOR')
    storeId = (await createTestStore(owner.id, { isPublished: true })).id
    const rivalStoreId = (await createTestStore(rival.id)).id
    lunchId = (await prisma.menuSection.create({ data: { storeId, name: 'Lunch' } })).id
    hiddenId = (await prisma.menuSection.create({ data: { storeId, name: 'Staff', isVisible: false } })).id
    rivalSectionId = (await prisma.menuSection.create({ data: { storeId: rivalStoreId, name: 'Lunch' } })).id
  })

  afterAll(async () => {
    await cleanupTestData()
    await app.close()
  })

  const createItem = (sectionId: string | null) =>
    app.inject({
      method: 'POST',
      url: '/items',
      headers: authHeaders(owner.token),
      payload: { storeId, title: 'Torta', description: '', price: '9.00', sectionId },
    })

  it('places a new item in one of the store’s sections', async () => {
    const response = await createItem(lunchId)
    expect(response.statusCode).toBeLessThan(300)
    const id = (response.json().data ?? response.json()).id as string
    expect((await prisma.item.findUnique({ where: { id } }))?.sectionId).toBe(lunchId)
  })

  it('refuses another store’s section', async () => {
    const response = await createItem(rivalSectionId)
    expect(response.statusCode).toBeGreaterThanOrEqual(400)
  })

  it('moves an item between sections and out of them', async () => {
    const item = await createTestItem(storeId, { title: 'Agua fresca' })
    const update = (sectionId: string | null) =>
      app.inject({
        method: 'PATCH',
        url: `/items/${item.id}`,
        headers: authHeaders(owner.token),
        payload: { title: 'Agua fresca', description: '', price: '3.00', sectionId },
      })
    expect((await update(lunchId)).statusCode).toBeLessThan(300)
    expect((await prisma.item.findUnique({ where: { id: item.id } }))?.sectionId).toBe(lunchId)
    expect((await update(rivalSectionId)).statusCode).toBeGreaterThanOrEqual(400)
    expect((await update(null)).statusCode).toBeLessThan(300)
    expect((await prisma.item.findUnique({ where: { id: item.id } }))?.sectionId).toBeNull()
  })

  it('hides items in a hidden section from shoppers but not from the team', async () => {
    const secret = await createTestItem(storeId, { title: 'Family meal' })
    await prisma.item.update({ where: { id: secret.id }, data: { sectionId: hiddenId } })
    const list = async (token?: string) => {
      const response = await app.inject({
        method: 'GET',
        url: `/items?storeId=${storeId}&limit=100`,
        headers: token ? authHeaders(token) : {},
      })
      return (response.json().data as { id: string }[]).map((row) => row.id)
    }
    expect(await list()).not.toContain(secret.id)
    expect(await list(owner.token)).toContain(secret.id)
  })
})
