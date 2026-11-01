/**
 * Store-owned menu categories: rename, merge and remove rewrite only this store's matching items,
 * and leave ShopShop's marketplace classification (ItemTag, optionsJson.type/subtype) alone.
 */
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import Fastify from 'fastify'
import { randomUUID } from 'crypto'
import { prisma } from '@packages/db'
import { menuCategoryRoutes } from '../routes/menu-categories.route.js'
import { optionalAuthenticate } from '../middleware/auth.js'
import { createAuthenticatedUser, authHeaders, createTestStore, createTestItem, cleanupTestData } from './helpers.js'

describe('POST /stores/:storeId/menu-categories/rename', () => {
  const app = Fastify({ logger: false })
  let owner: Awaited<ReturnType<typeof createAuthenticatedUser>>
  let rival: Awaited<ReturnType<typeof createAuthenticatedUser>>
  let storeId: string
  let rivalStoreId: string
  let tagId: string

  const item = async (store: string, title: string, options: Record<string, unknown>) => {
    const created = await createTestItem(store, { title })
    await prisma.item.update({ where: { id: created.id }, data: { optionsJson: options } })
    return created.id
  }
  const categoryOf = async (id: string) =>
    ((await prisma.item.findUnique({ where: { id } }))?.optionsJson as Record<string, unknown> | null) ?? {}
  const rename = (from: string, to: string, token = owner.token, store = storeId) =>
    app.inject({
      method: 'POST',
      url: `/stores/${store}/menu-categories/rename`,
      headers: authHeaders(token),
      payload: { from, to },
    })

  beforeAll(async () => {
    app.addHook('preHandler', optionalAuthenticate)
    await app.register(menuCategoryRoutes)
    await app.ready()
    owner = await createAuthenticatedUser('VENDOR')
    rival = await createAuthenticatedUser('VENDOR')
    storeId = (await createTestStore(owner.id)).id
    rivalStoreId = (await createTestStore(rival.id)).id
    tagId = (await prisma.tag.create({
      data: { slug: `test-tacos-${randomUUID()}`, label: 'Tacos', category: 'ITEM_TYPE' },
    })).id
  })

  afterAll(async () => {
    await prisma.tag.delete({ where: { id: tagId } }).catch(() => undefined)
    await cleanupTestData()
    await app.close()
  })

  it('renames every matching item, ignoring case and spacing, and keeps marketplace classification', async () => {
    const a = await item(storeId, 'Al Pastor', { category: 'Lunch', type: 'taco', subtype: 'al-pastor' })
    const b = await item(storeId, 'Carnitas', { category: ' lunch ' })
    const untouched = await item(storeId, 'Horchata', { category: 'Drinks' })
    const otherStore = await item(rivalStoreId, 'Rival Taco', { category: 'Lunch' })
    await prisma.itemTag.create({ data: { itemId: a, tagId } })

    const res = await rename('LUNCH', 'Family Meals')
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body)).toMatchObject({ to: 'Family Meals', updated: 2 })

    expect(await categoryOf(a)).toEqual({ category: 'Family Meals', type: 'taco', subtype: 'al-pastor' })
    expect((await categoryOf(b)).category).toBe('Family Meals')
    expect((await categoryOf(untouched)).category).toBe('Drinks')
    expect((await categoryOf(otherStore)).category).toBe('Lunch')
    expect(await prisma.itemTag.count({ where: { itemId: a, tagId } })).toBe(1)
  })

  it('merges into an existing category using that category’s spelling', async () => {
    const x = await item(storeId, 'Elote', { category: 'Snacks' })
    const y = await item(storeId, 'Chips', { category: 'Sides' })
    await rename('Sides', 'SNACKS')
    expect((await categoryOf(x)).category).toBe('Snacks')
    expect((await categoryOf(y)).category).toBe('Snacks')
  })

  it('removes a category, leaving its items on the menu uncategorized', async () => {
    const z = await item(storeId, 'Flan', { category: 'Desserts', type: 'dessert' })
    await rename('Desserts', '')
    expect(await categoryOf(z)).toEqual({ type: 'dessert' })
    expect(await prisma.item.count({ where: { id: z } })).toBe(1)
  })

  it('refuses vendors of other stores and changes nothing', async () => {
    const mine = await item(storeId, 'Torta', { category: 'Mains' })
    const res = await rename('Mains', 'Hijacked', rival.token)
    expect(res.statusCode).toBe(403)
    expect((await categoryOf(mine)).category).toBe('Mains')
  })

  it('writes all items in one transaction, so a failure leaves none of them changed', async () => {
    const p = await item(storeId, 'Pozole', { category: 'Soup' })
    const q = await item(storeId, 'Menudo', { category: 'Soup' })
    const spy = vi.spyOn(prisma, '$transaction').mockRejectedValueOnce(new Error('deadlock'))
    const res = await rename('Soup', 'Stews')
    spy.mockRestore()
    expect(res.statusCode).toBe(500)
    expect((await categoryOf(p)).category).toBe('Soup')
    expect((await categoryOf(q)).category).toBe('Soup')
  })

  it('rejects a blank source category', async () => {
    expect((await rename('   ', 'Anything')).statusCode).toBe(400)
  })
})
