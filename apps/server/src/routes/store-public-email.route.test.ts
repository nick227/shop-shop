import { randomUUID } from 'crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import Fastify from 'fastify'
import { Decimal, prisma } from '@packages/db'
import { optionalAuthenticate } from '../middleware/auth.js'
import { registerAllResources } from './loader.js'
import { ALL_RESOURCES } from '../resources/index.js'
import { storefrontRoutes } from './storefront.route.js'
import { authHeaders, cleanupTestData, createEnrolledVendor, TEST_NAMESPACE } from '../__tests__/helpers.js'

const LEGACY_EMAIL = `legacy-${randomUUID().slice(0, 8)}@owner-account.test`

/** A store that can appear in the marketplace, as it looked before email consent existed. */
async function createLegacyStore(ownerUserId: string) {
  const store = await prisma.store.create({
    data: {
      ownerUserId,
      slug: `${TEST_NAMESPACE}-email-legacy-${randomUUID().slice(0, 8)}`,
      name: 'Email Legacy Shop',
      description: 'Stored an email before consent existed',
      phone: '555-0100',
      email: LEGACY_EMAIL,
      website: '',
      addressStreet: '100 Test St',
      addressCity: 'Austin',
      addressState: 'TX',
      addressZip: '78701',
      latitude: new Decimal('30.2672'),
      longitude: new Decimal('-97.7431'),
      geocodedAt: new Date(),
      pickupEnabled: true,
      deliveryEnabled: false,
      isPublished: true,
      status: 'ACTIVE',
    },
  })
  await prisma.item.create({ data: { storeId: store.id, title: 'Item', description: 'Active', price: new Decimal('5.00'), isActive: true, isSoldOut: false } })
  await prisma.mediaAsset.create({ data: { storeId: store.id, kind: 'IMAGE', url: `https://example.test/${store.slug}.jpg` } })
  return store
}

describe('storefront business email consent', () => {
  const app = Fastify({ logger: false })
  let vendor: Awaited<ReturnType<typeof createEnrolledVendor>>
  let legacy: Awaited<ReturnType<typeof createLegacyStore>>

  beforeAll(async () => {
    app.addHook('preHandler', optionalAuthenticate) // as in index.ts
    await app.register(storefrontRoutes)
    await registerAllResources(app, ALL_RESOURCES)
    await app.ready()
    vendor = await createEnrolledVendor()
    legacy = await createLegacyStore(vendor.id)
  })

  afterAll(async () => {
    await prisma.store.deleteMany({ where: { slug: { startsWith: `${TEST_NAMESPACE}-email-` } } })
    await cleanupTestData()
    await app.close()
  })

  const get = (url: string, token?: string) => app.inject({ method: 'GET', url, headers: token ? authHeaders(token) : {} })
  const anonymousViews = (id: string) => [
    `/stores/${id}`,
    '/stores?limit=100',
    '/stores?limit=100&delivery=true',
    '/stores?limit=100&latitude=30.2672&longitude=-97.7431&radiusMiles=5',
    `/stores/${id}/storefront`,
  ]
  async function anonymousEmail(id: string): Promise<{ email: unknown; bodies: string }> {
    let email: unknown = 'not found'
    let bodies = ''
    for (const url of anonymousViews(id)) {
      const response = await get(url)
      expect(response.statusCode, `${url}: ${response.body}`).toBe(200)
      bodies += response.body
      const body = JSON.parse(response.body)
      const row = Array.isArray(body.data) ? body.data.find((store: { id: string }) => store.id === id) : body.id === id ? body : undefined
      if (row) {
        expect(row).not.toHaveProperty('publicEmailConfirmedAt')
        email = row.email
      }
    }
    return { email, bodies }
  }
  const patch = (id: string, payload: Record<string, unknown>) =>
    app.inject({ method: 'PATCH', url: `/stores/${id}`, headers: authHeaders(vendor.token), payload })
  const formPayload = async (id: string, overrides: Record<string, unknown> = {}) => {
    const current = await prisma.store.findUniqueOrThrow({ where: { id } })
    return { name: current.name, slug: current.slug, description: current.description ?? '', phone: current.phone ?? '', email: current.email ?? '', website: current.website ?? '', ...overrides }
  }

  it('keeps a legacy email stored but out of every anonymous response', async () => {
    const { email, bodies } = await anonymousEmail(legacy.id)
    expect(email).toBeNull()
    expect(bodies).not.toContain(LEGACY_EMAIL)
    // Still there for the owner.
    expect(JSON.parse((await get(`/stores/${legacy.id}`, vendor.token)).body)).toMatchObject({ email: LEGACY_EMAIL, publicEmailConfirmedAt: null })
  })

  it('does not publish a legacy email when the vendor re-saves the form untouched', async () => {
    const response = await patch(legacy.id, await formPayload(legacy.id, { email: LEGACY_EMAIL.toUpperCase(), description: 'Re-saved' }))
    expect(response.statusCode, response.body).toBe(200)
    expect((await anonymousEmail(legacy.id)).email).toBeNull()
  })

  it('publishes the stored email once the vendor confirms it', async () => {
    const response = await patch(legacy.id, await formPayload(legacy.id, { publicEmailConfirmed: true }))
    expect(response.statusCode, response.body).toBe(200)
    expect((await anonymousEmail(legacy.id)).email).toBe(LEGACY_EMAIL.toUpperCase())
  })

  it('clears the email and its confirmation together', async () => {
    const response = await patch(legacy.id, await formPayload(legacy.id, { email: '' }))
    expect(response.statusCode, response.body).toBe(200)
    expect(await prisma.store.findUniqueOrThrow({ where: { id: legacy.id }, select: { email: true, publicEmailConfirmedAt: true } }))
      .toEqual({ email: null, publicEmailConfirmedAt: null })
    expect((await anonymousEmail(legacy.id)).email).toBeNull()
  })

  it('publishes a replacement the vendor types, and ignores a client-set confirmation time', async () => {
    await patch(legacy.id, await formPayload(legacy.id, { email: 'hello@replaced.test' }))
    expect((await anonymousEmail(legacy.id)).email).toBe('hello@replaced.test')

    await prisma.store.update({ where: { id: legacy.id }, data: { publicEmailConfirmedAt: null } })
    await patch(legacy.id, await formPayload(legacy.id, { publicEmailConfirmedAt: '2020-01-01T00:00:00.000Z' }))
    expect((await anonymousEmail(legacy.id)).email).toBeNull()
  })

  it('creates a store without an email when none is typed, and keeps it unpublished', async () => {
    const slug = `${TEST_NAMESPACE}-email-new-blank-${randomUUID().slice(0, 8)}`
    const response = await app.inject({
      method: 'POST',
      url: '/stores',
      headers: authHeaders(vendor.token),
      payload: { name: 'Blank Email Shop', slug, description: 'New', phone: '555-0101', website: '' },
    })
    expect(response.statusCode, response.body).toBe(201)
    const created = JSON.parse(response.body)
    expect(created).toMatchObject({ email: null, publicEmailConfirmedAt: null })
    // Never the account's sign-in email.
    expect(response.body).not.toContain(vendor.email)
  })

  it('publishes an email typed at creation', async () => {
    const slug = `${TEST_NAMESPACE}-email-new-typed-${randomUUID().slice(0, 8)}`
    const response = await app.inject({
      method: 'POST',
      url: '/stores',
      headers: authHeaders(vendor.token),
      payload: { name: 'Typed Email Shop', slug, description: 'New', phone: '555-0102', email: 'hi@typed.test', website: '' },
    })
    expect(response.statusCode, response.body).toBe(201)
    expect(JSON.parse(response.body).publicEmailConfirmedAt).toEqual(expect.any(String))
  })
})
