import { randomUUID } from 'crypto'
import { describe, expect, it, beforeAll, beforeEach, afterAll } from 'vitest'
import Fastify from 'fastify'
import { prisma, Decimal } from '@packages/db'
import { registerAllResources } from './loader.js'
import { ALL_RESOURCES } from '../resources/index.js'
import { deliveryZoneRoutes } from './delivery-zone.route.js'
import { storeReadinessRoutes } from './store-readiness.route.js'
import { authHeaders, cleanupTestData, createAuthenticatedUser, TEST_NAMESPACE } from '../__tests__/helpers.js'

function testSlug(label: string) {
  return `${TEST_NAMESPACE}-${label}-${randomUUID().slice(0, 8)}`
}

async function createMarketplaceStore(input: {
  ownerUserId: string
  slug: string
  name: string
  latitude?: string
  longitude?: string
  isPublished?: boolean
  status?: 'ACTIVE' | 'PAUSED' | 'DISABLED'
  deliveryDistance?: string | null
  withMedia?: boolean
  withProduct?: boolean
}) {
  const store = await prisma.store.create({
    data: {
      ownerUserId: input.ownerUserId,
      slug: input.slug,
      name: input.name,
      description: 'A complete marketplace test store',
      phone: '555-0100',
      email: 'store@test.com',
      website: '',
      addressStreet: '100 Test St',
      addressCity: 'Austin',
      addressState: 'TX',
      addressZip: '78701',
      pickupEnabled: true,
      deliveryEnabled: true,
      deliveryCharge: new Decimal('5.00'),
      deliveryDistance: input.deliveryDistance === null ? null : new Decimal(input.deliveryDistance ?? '25.00'),
      feesJson: { minimumOrder: 0 },
      latitude: input.latitude ? new Decimal(input.latitude) : null,
      longitude: input.longitude ? new Decimal(input.longitude) : null,
      geocodedAt: input.latitude && input.longitude ? new Date() : null,
      geocodeSource: input.latitude && input.longitude ? 'test' : null,
      isPublished: input.isPublished ?? true,
      status: input.status ?? 'ACTIVE',
    },
  })

  if (input.withProduct ?? true) {
    await prisma.item.create({ data: { storeId: store.id, title: `${input.name} item`, description: 'Active product', price: new Decimal('12.00'), isActive: true, isSoldOut: false } })
  }

  if (input.withMedia ?? true) {
    await prisma.mediaAsset.create({ data: { storeId: store.id, kind: 'IMAGE', url: `https://example.test/${input.slug}.jpg` } })
  }

  return store
}

describe('Store readiness and coordinate marketplace behavior', () => {
  const app = Fastify({ logger: false })
  let vendor: Awaited<ReturnType<typeof createAuthenticatedUser>>

  beforeAll(async () => {
    await app.register(deliveryZoneRoutes)
    await app.register(storeReadinessRoutes)
    await registerAllResources(app, ALL_RESOURCES)
    await app.ready()
  })

  beforeEach(async () => {
    vendor = await createAuthenticatedUser('VENDOR')
  })

  afterAll(async () => {
    await cleanupTestData()
    await app.close()
  })

  it('allows draft saves but blocks publish when readiness fails', async () => {
    const slug = testSlug('draft-readiness')
    const draftPayload = { name: 'Test Draft Store', slug, description: '', pickupEnabled: true, deliveryEnabled: false, isPublished: false }
    const createResponse = await app.inject({ method: 'POST', url: '/stores', headers: authHeaders(vendor.token), payload: draftPayload })

    expect(createResponse.statusCode, createResponse.body).toBe(201)
    const draftStore = JSON.parse(createResponse.body) as { id: string; isPublished: boolean }
    expect(draftStore.isPublished).toBe(false)

    const draftSaveResponse = await app.inject({ method: 'PATCH', url: `/stores/${draftStore.id}`, headers: authHeaders(vendor.token), payload: draftPayload })
    expect(draftSaveResponse.statusCode).toBe(200)

    const publishResponse = await app.inject({ method: 'PATCH', url: `/stores/${draftStore.id}`, headers: authHeaders(vendor.token), payload: { ...draftPayload, isPublished: true } })
    expect(publishResponse.statusCode).toBe(400)
    expect(JSON.parse(publishResponse.body)).toMatchObject({ error: 'Store is not ready to publish' })
  })

  it('rejects unauthenticated delivery-zone writes', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/delivery-zones',
      payload: { storeId: randomUUID(), name: 'Unauthorized zone', polygonJson: { type: 'Polygon', coordinates: [[]] }, baseFee: 5 },
    })

    expect(response.statusCode).toBe(401)
  })

  it('persists negative longitudes through store create and update validation', async () => {
    const slug = testSlug('negative-longitude')
    const payload = {
      name: 'Test Negative Longitude Store', slug, description: 'A store with real western hemisphere coordinates', phone: '5550100', email: 'negative@test.com', website: 'https://example.test', addressStreet: '100 Congress Ave', addressCity: 'Austin', addressState: 'TX', addressZip: '78701', pickupEnabled: true, deliveryEnabled: true, deliveryDistance: '25.00', deliveryCharge: '5.00', latitude: '30.26720000', longitude: '-97.74310000', geocodedAt: new Date().toISOString(), geocodeSource: 'test', isPublished: false,
    }
    const createResponse = await app.inject({ method: 'POST', url: '/stores', headers: authHeaders(vendor.token), payload })

    expect(createResponse.statusCode, createResponse.body).toBe(201)
    const created = JSON.parse(createResponse.body) as { id: string; longitude: string }
    expect(String(created.longitude)).toContain('-97.7431')

    const updateResponse = await app.inject({ method: 'PATCH', url: `/stores/${created.id}`, headers: authHeaders(vendor.token), payload: { ...payload, name: 'Test Negative Longitude Store Updated', longitude: '-118.24370000' } })
    expect(updateResponse.statusCode).toBe(200)
    const updated = JSON.parse(updateResponse.body) as { longitude: string }
    expect(String(updated.longitude)).toContain('-118.2437')
  })

  it('returns page 2 coordinate results with filtered totals and public/live eligibility applied', async () => {
    // Wide random latitude band so repeated suite runs do not share the same bbox with old rows.
    const rng = BigInt(`0x${randomUUID().replace(/-/g, '').slice(0, 14)}`)
    const latBase = 15 + Number(rng % 45n)
    const micro = Number(rng % 1_000_000n) / 1e10
    const anchor = latBase + micro
    const lon = '-42.00000000'
    const lat = (delta: number) => (anchor + delta).toFixed(8)

    await createMarketplaceStore({ ownerUserId: vendor.id, slug: testSlug('coord-nearest'), name: 'Test Coordinate Nearest', latitude: lat(0), longitude: lon, deliveryDistance: null })
    await createMarketplaceStore({ ownerUserId: vendor.id, slug: testSlug('coord-second'), name: 'Test Coordinate Second', latitude: lat(0.01), longitude: lon })
    await createMarketplaceStore({ ownerUserId: vendor.id, slug: testSlug('coord-third'), name: 'Test Coordinate Third', latitude: lat(0.03), longitude: lon })
    await createMarketplaceStore({ ownerUserId: vendor.id, slug: testSlug('coord-missing-coordinates'), name: 'Test Missing Coordinates' })
    await createMarketplaceStore({ ownerUserId: vendor.id, slug: testSlug('coord-draft'), name: 'Test Coordinate Draft', latitude: lat(0.002), longitude: lon, isPublished: false })
    await createMarketplaceStore({ ownerUserId: vendor.id, slug: testSlug('coord-paused'), name: 'Test Coordinate Paused', latitude: lat(0.003), longitude: lon, status: 'PAUSED' })
    await createMarketplaceStore({ ownerUserId: vendor.id, slug: testSlug('coord-incomplete'), name: 'Test Coordinate Incomplete', latitude: lat(0.004), longitude: lon, status: 'DISABLED', withMedia: false, withProduct: false })
    await createMarketplaceStore({ ownerUserId: vendor.id, slug: testSlug('coord-delivery-excluded'), name: 'Test Delivery Distance Excluded', latitude: lat(0.1), longitude: lon, deliveryDistance: '2.00' })

    const searchLat = (anchor - 0.001).toFixed(8)
    const response = await app.inject({ method: 'GET', url: `/stores?latitude=${searchLat}&longitude=${lon}&radiusMiles=25&page=2&limit=2` })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body) as { data: Array<{ name: string; distance: number }>; total: number; page: number; limit: number }
    expect(body.total, JSON.stringify(body.data.map(store => store.name))).toBe(3)
    expect(body.page).toBe(2)
    expect(body.limit).toBe(2)
    expect(body.data.map(store => store.name)).toEqual(['Test Coordinate Third'])
    expect(body.data.every(store => store.distance <= 25)).toBe(true)
  })
})
