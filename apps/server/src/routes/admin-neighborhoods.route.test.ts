import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import Fastify from 'fastify'
import { ensureGazetteer, prisma, WEST_CAMPUS_PLACE_ID } from '@packages/db'
import { createAuthenticatedUser, TEST_NAMESPACE, type TestUser } from '../__tests__/helpers.js'
import { adminNeighborhoodRoutes } from './admin-neighborhoods.route.js'
import { placeRoutes } from './places.route.js'

describe('neighborhood profiles', () => {
  const app = Fastify({ logger: false })
  let admin: TestUser
  let austinId = ''

  beforeAll(async () => {
    await ensureGazetteer(prisma)
    admin = await createAuthenticatedUser('ADMIN')
    const austin = await prisma.place.findUniqueOrThrow({ where: { slug: 'austin-tx' } })
    austinId = austin.id
    await app.register(adminNeighborhoodRoutes, { prefix: '/api' })
    await app.register(placeRoutes, { prefix: '/api' })
    await app.ready()
  })

  afterAll(async () => {
    const created = await prisma.place.findMany({
      where: { kind: 'NEIGHBORHOOD', slug: { contains: TEST_NAMESPACE } },
      select: { id: true },
    })
    const ids = created.map((place) => place.id)
    if (ids.length > 0) await prisma.place.deleteMany({ where: { id: { in: ids } } })
    await prisma.neighborhoodTag.deleteMany({ where: { places: { none: {} } } })
    await prisma.mediaAsset.deleteMany({ where: { placeId: WEST_CAMPUS_PLACE_ID } })
    await prisma.place.update({
      where: { id: WEST_CAMPUS_PLACE_ID },
      data: { headline: null, about: null, published: false },
    })
    await prisma.user.deleteMany({ where: { id: admin.id } })
    await app.close()
  })

  function auth(method: 'POST' | 'PATCH', url: string, payload: unknown) {
    return app.inject({
      method,
      url,
      headers: { authorization: `Bearer ${admin.token}`, 'content-type': 'application/json' },
      payload,
    })
  }

  it('publishes a neighborhood for its city zips and shows it on that zip', async () => {
    const hidden = await app.inject({ method: 'GET', url: '/api/places/by-zip/78705' })
    expect(hidden.statusCode).toBe(200)
    const hiddenBody = JSON.parse(hidden.body) as { city: { name: string }; neighborhoods: unknown[] }
    expect(hiddenBody.city.name).toBe('Austin')
    expect(hiddenBody.neighborhoods).toEqual([])

    const denied = await app.inject({
      method: 'POST',
      url: '/api/admin/neighborhoods',
      payload: { name: 'Nope', parentId: austinId, postalCodes: ['78751'] },
    })
    expect(denied.statusCode).toBe(401)

    const wrongCity = await auth('POST', '/api/admin/neighborhoods', {
      name: `${TEST_NAMESPACE} Queens`,
      parentId: austinId,
      postalCodes: ['10001'],
    })
    expect(wrongCity.statusCode).toBe(400)

    const created = await auth('POST', '/api/admin/neighborhoods', {
      name: `${TEST_NAMESPACE} Hyde Park`,
      parentId: austinId,
      postalCodes: ['78751'],
      headline: 'Bungalows and bakeries',
      about: 'A quiet north-central neighborhood.',
      imageUrls: ['https://example.test/hyde.jpg'],
      published: true,
    })
    expect(created.statusCode).toBe(201)
    const createdBody = JSON.parse(created.body) as { slug: string; postalCodes: string[] }
    expect(createdBody.slug).toContain('hyde-park')
    expect(createdBody.postalCodes).toEqual(['78751'])

    const one = await app.inject({ method: 'GET', url: '/api/places/by-zip/78751' })
    expect(one.statusCode).toBe(200)
    const oneBody = JSON.parse(one.body) as { neighborhoods: Array<{ name: string; headline: string; coverUrl: string }> }
    expect(oneBody.neighborhoods).toEqual([
      expect.objectContaining({
        name: `${TEST_NAMESPACE} Hyde Park`,
        headline: 'Bungalows and bakeries',
        coverUrl: 'https://example.test/hyde.jpg',
      }),
    ])

    const publishedWest = await auth('PATCH', `/api/admin/neighborhoods/${WEST_CAMPUS_PLACE_ID}`, {
      name: 'West Campus',
      parentId: austinId,
      postalCodes: ['78705'],
      headline: 'Campus blocks',
      about: 'Shops along Guadalupe.',
      imageUrls: ['https://example.test/west.jpg'],
      published: true,
    })
    expect(publishedWest.statusCode).toBe(200)

    const second = await auth('POST', '/api/admin/neighborhoods', {
      name: `${TEST_NAMESPACE} North Campus`,
      parentId: austinId,
      postalCodes: ['78705'],
      published: true,
    })
    expect(second.statusCode).toBe(201)

    const many = await app.inject({ method: 'GET', url: '/api/places/by-zip/78705' })
    const names = (JSON.parse(many.body) as { neighborhoods: Array<{ name: string }> }).neighborhoods.map((row) => row.name)
    expect(names).toEqual([`${TEST_NAMESPACE} North Campus`, 'West Campus'].sort((left, right) => left.localeCompare(right)))

    const profile = await app.inject({ method: 'GET', url: `/api/places/${createdBody.slug}` })
    expect(profile.statusCode).toBe(200)
    const profileBody = JSON.parse(profile.body) as { name: string; postalCodes: string[]; nearby: Array<{ name: string }> }
    expect(profileBody.name).toBe(`${TEST_NAMESPACE} Hyde Park`)
    expect(profileBody.postalCodes).toEqual(['78751'])
    expect(profileBody.nearby.map((area) => area.name)).toEqual(expect.arrayContaining(['West Campus']))

    const missingProfile = await app.inject({ method: 'GET', url: '/api/places/not-a-neighborhood' })
    expect(missingProfile.statusCode).toBe(404)
  })

  it('stores tags with explicit query mappings, per-place labels, order, and visibility', async () => {
    const created = await auth('POST', '/api/admin/neighborhoods', {
      name: `${TEST_NAMESPACE} Tagged`,
      parentId: austinId,
      postalCodes: ['78704'],
      headline: 'Tagged',
      about: 'Tagged place.',
      published: true,
      tags: [
        { label: 'Historic', kind: 'EDITORIAL' },
        { label: 'Coffee shops', kind: 'DISCOVERY', categoryId: 'food', searchQuery: 'coffee' },
        { label: 'Groceries', kind: 'DISCOVERY', categoryId: 'grocery', visible: false },
        { label: 'Coffee again', kind: 'DISCOVERY', categoryId: 'food', searchQuery: 'Coffee' },
      ],
    })
    expect(created.statusCode).toBe(201)
    const { slug } = JSON.parse(created.body) as { slug: string }

    const badTag = await auth('POST', '/api/admin/neighborhoods', {
      name: `${TEST_NAMESPACE} Bad Tag`,
      parentId: austinId,
      postalCodes: ['78704'],
      tags: [{ label: 'Anything', kind: 'DISCOVERY' }],
    })
    expect(badTag.statusCode).toBe(400)

    const profile = await app.inject({ method: 'GET', url: `/api/places/${slug}` })
    const body = JSON.parse(profile.body) as { tags: Array<{ label: string; kind: string; categoryId: string | null; searchQuery: string | null; visible: boolean }> }
    expect(body.tags).toEqual([
      expect.objectContaining({ label: 'Historic', kind: 'EDITORIAL', categoryId: null, searchQuery: null, visible: true }),
      expect.objectContaining({ label: 'Coffee shops', kind: 'DISCOVERY', categoryId: 'food', searchQuery: 'coffee', visible: true }),
      expect.objectContaining({ label: 'Groceries', kind: 'DISCOVERY', categoryId: 'grocery', visible: false }),
    ])
  })

  it('rejects an unknown zip', async () => {
    const missing = await app.inject({ method: 'GET', url: '/api/places/by-zip/99950' })
    expect(missing.statusCode).toBe(404)
  })
})
