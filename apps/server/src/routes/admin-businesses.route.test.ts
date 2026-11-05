import { randomUUID } from 'crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import Fastify from 'fastify'
import { ensureGazetteer, prisma } from '@packages/db'
import { createAuthenticatedUser, type TestUser } from '../__tests__/helpers.js'
import { adminBusinessRoutes } from './admin-businesses.route.js'
import { adminNeighborhoodRoutes } from './admin-neighborhoods.route.js'

describe('directory administration', () => {
  const app = Fastify({ logger: false })
  let admin: TestUser
  const keepId = randomUUID()
  const dropId = randomUUID()
  const draftId = randomUUID()
  const suffix = randomUUID().slice(0, 8)

  beforeAll(async () => {
    admin = await createAuthenticatedUser('ADMIN')
    await ensureGazetteer(prisma)
    const austin = await prisma.place.findUniqueOrThrow({ where: { slug: 'austin-tx' }, select: { id: true } })
    await app.register(adminBusinessRoutes, { prefix: '/api' })
    await app.register(adminNeighborhoodRoutes, { prefix: '/api' })
    await app.ready()
    await prisma.businessListing.create({
      data: { id: keepId, name: `Keep Gazette ${suffix}`, slug: `keep-gazette-${suffix}`, category: 'RESTAURANT', categoryLabel: 'Restaurant', source: 'admin', sourceId: `admin/keep-${suffix}`, description: 'Admin wrote this', published: true },
    })
    await prisma.businessListing.create({
      data: { id: dropId, name: `Drop Gazette ${suffix}`, slug: `drop-gazette-${suffix}`, category: 'RESTAURANT', categoryLabel: 'Restaurant', source: 'osm', sourceId: `way/drop-${suffix}`, phone: '555-0100', description: 'Source text', published: true },
    })
    await prisma.place.create({
      data: { id: draftId, kind: 'NEIGHBORHOOD', name: `Draft Point ${suffix}`, slug: `austin-tx-draft-point-${suffix}`, parentId: austin.id, state: 'TX', country: 'US', published: false },
    })
  })

  afterAll(async () => {
    await prisma.businessListing.deleteMany({ where: { id: { in: [keepId, dropId] } } })
    await prisma.place.deleteMany({ where: { id: draftId } })
    await prisma.user.delete({ where: { id: admin.id } })
    await app.close()
  })

  it('finds a listing and keeps an admin description when merging a duplicate', async () => {
    const found = await app.inject({ method: 'GET', url: `/api/admin/businesses?q=${encodeURIComponent(`Keep Gazette ${suffix}`)}`, headers: { authorization: `Bearer ${admin.token}` } })
    expect(found.statusCode).toBe(200)
    const body = JSON.parse(found.body) as { listings: Array<{ id: string }> }
    expect(body.listings.some((row) => row.id === keepId)).toBe(true)
    const merged = await app.inject({
      method: 'POST',
      url: '/api/admin/businesses/merge',
      headers: { authorization: `Bearer ${admin.token}`, 'content-type': 'application/json' },
      payload: { keepId, dropId },
    })
    expect(merged.statusCode).toBe(200)
    const saved = await prisma.businessListing.findUnique({ where: { id: keepId } })
    expect(saved?.description).toBe('Admin wrote this')
    expect(saved?.phone).toBe('555-0100')
    expect(await prisma.businessListing.findUnique({ where: { id: dropId } })).toBeNull()
  })

  it('does not publish a neighborhood draft that has no description', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/admin/neighborhoods/publish',
      headers: { authorization: `Bearer ${admin.token}`, 'content-type': 'application/json' },
      payload: { ids: [draftId] },
    })
    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body)).toEqual({ published: 0, skipped: 1 })
    const saved = await prisma.place.findUnique({ where: { id: draftId } })
    expect(saved?.published).toBe(false)
  })
})
