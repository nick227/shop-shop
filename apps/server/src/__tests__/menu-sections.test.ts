/**
 * Store-owned menu sections: the team manages them independently of items, and shoppers see only
 * visible sections that hold something on sale.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import Fastify from 'fastify'
import { prisma } from '@packages/db'
import { menuSectionRoutes } from '../routes/menu-sections.route.js'
import { optionalAuthenticate } from '../middleware/auth.js'
import { createAuthenticatedUser, authHeaders, createTestStore, createTestItem, cleanupTestData } from './helpers.js'

describe('menu sections', () => {
  const app = Fastify({ logger: false })
  let owner: Awaited<ReturnType<typeof createAuthenticatedUser>>
  let rival: Awaited<ReturnType<typeof createAuthenticatedUser>>
  let shopper: Awaited<ReturnType<typeof createAuthenticatedUser>>
  let storeId: string

  const call = (method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE', path: string, token?: string, payload?: unknown) =>
    app.inject({
      method,
      url: `/stores/${storeId}/menu-sections${path}`,
      headers: token ? authHeaders(token) : {},
      ...(payload === undefined ? {} : { payload: payload as Record<string, unknown> }),
    })
  const create = async (name: string, extra: Record<string, unknown> = {}) => {
    const response = await call('POST', '', owner.token, { name, ...extra })
    expect(response.statusCode).toBe(201)
    return response.json().data as { id: string; name: string; sortIndex: number }
  }

  beforeAll(async () => {
    app.addHook('preHandler', optionalAuthenticate)
    await app.register(menuSectionRoutes)
    await app.ready()
    owner = await createAuthenticatedUser('VENDOR')
    rival = await createAuthenticatedUser('VENDOR')
    shopper = await createAuthenticatedUser('USER')
    storeId = (await createTestStore(owner.id, { isPublished: true })).id
    await createTestStore(rival.id)
  })

  afterAll(async () => {
    await cleanupTestData()
    await app.close()
  })

  it('creates sections in order, normalizes names and rejects duplicates in any case', async () => {
    const breakfast = await create('  Breakfast   Plates ')
    const drinks = await create('Drinks', { description: 'Cold and hot' })
    expect(breakfast.name).toBe('Breakfast Plates')
    expect(drinks.sortIndex).toBe(breakfast.sortIndex + 1)

    const clash = await call('POST', '', owner.token, { name: 'drinks' })
    expect(clash.statusCode).toBe(409)
    expect((await call('POST', '', owner.token, { name: '   ' })).statusCode).toBe(400)
  })

  it('only lets the store team change sections', async () => {
    expect((await call('POST', '', rival.token, { name: 'Sneaky' })).statusCode).toBe(403)
    expect((await call('POST', '', undefined, { name: 'Anonymous' })).statusCode).toBe(401)
  })

  it('renames, describes and hides a section, keeping names unique', async () => {
    const sides = await create('Sides')
    const renamed = await call('PATCH', `/${sides.id}`, owner.token, { name: 'Sides & Extras', description: 'Small plates' })
    expect(renamed.statusCode).toBe(200)
    expect(renamed.json().data).toMatchObject({ name: 'Sides & Extras', description: 'Small plates' })

    expect((await call('PATCH', `/${sides.id}`, owner.token, { name: 'DRINKS' })).statusCode).toBe(409)
    const hidden = await call('PATCH', `/${sides.id}`, owner.token, { isVisible: false })
    expect(hidden.json().data.isVisible).toBe(false)
  })

  it('reorders the whole menu and refuses a stale or partial order', async () => {
    const before = (await call('GET', '', owner.token)).json().data as { id: string }[]
    const reversed = [...before].reverse().map((section) => section.id)
    const response = await call('PUT', '/order', owner.token, { sectionIds: reversed })
    expect(response.statusCode).toBe(200)
    expect((response.json().data as { id: string }[]).map((section) => section.id)).toEqual(reversed)

    expect((await call('PUT', '/order', owner.token, { sectionIds: reversed.slice(1) })).statusCode).toBe(409)
  })

  it('shows shoppers only visible sections with items on sale, and the team everything', async () => {
    const lunch = await create('Lunch')
    const empty = await create('Coming Soon')
    const secret = await create('Staff Meals')
    await prisma.menuSection.update({ where: { id: secret.id }, data: { isVisible: false } })
    const taco = await createTestItem(storeId, { title: 'Taco' })
    const off = await createTestItem(storeId, { title: 'Retired', isActive: false })
    const staff = await createTestItem(storeId, { title: 'Family meal' })
    await prisma.item.update({ where: { id: taco.id }, data: { sectionId: lunch.id } })
    await prisma.item.update({ where: { id: off.id }, data: { sectionId: empty.id } })
    await prisma.item.update({ where: { id: staff.id }, data: { sectionId: secret.id } })

    const asShopper = (await call('GET', '', shopper.token)).json().data as { name: string; itemCount: number }[]
    expect(asShopper).toEqual([expect.objectContaining({ name: 'Lunch', itemCount: 1 })])
    const anonymous = (await call('GET', '')).json().data as { name: string }[]
    expect(anonymous.map((section) => section.name)).toEqual(['Lunch'])

    const asTeam = (await call('GET', '', owner.token)).json().data as { name: string }[]
    expect(asTeam.map((section) => section.name)).toEqual(expect.arrayContaining(['Lunch', 'Coming Soon', 'Staff Meals']))
    const preview = (await call('GET', '?view=shopper', owner.token)).json().data as { name: string }[]
    expect(preview.map((section) => section.name)).toEqual(['Lunch'])
  })

  it('deletes a section and leaves its items on the menu', async () => {
    const specials = await create('Specials')
    const item = await createTestItem(storeId, { title: 'Daily special' })
    await prisma.item.update({ where: { id: item.id }, data: { sectionId: specials.id } })

    expect((await call('DELETE', `/${specials.id}`, rival.token)).statusCode).toBe(403)
    expect((await call('DELETE', `/${specials.id}`, owner.token)).statusCode).toBe(204)
    const after = await prisma.item.findUnique({ where: { id: item.id } })
    expect(after).toMatchObject({ id: item.id, sectionId: null })
  })

  it('hides an unpublished store’s sections from everyone but its team', async () => {
    const draftStoreId = (await createTestStore(owner.id, { isPublished: false })).id
    const response = await app.inject({ method: 'GET', url: `/stores/${draftStoreId}/menu-sections` })
    expect(response.statusCode).toBe(404)
    const team = await app.inject({ method: 'GET', url: `/stores/${draftStoreId}/menu-sections`, headers: authHeaders(owner.token) })
    expect(team.statusCode).toBe(200)
  })
})
