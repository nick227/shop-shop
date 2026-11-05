import { randomUUID } from 'crypto'
import { describe, expect, it, beforeAll, afterAll } from 'vitest'
import Fastify from 'fastify'
import { Decimal, prisma, backfillStorePlaces, WEST_CAMPUS_PLACE_ID } from '@packages/db'
import { registerAllResources } from './loader.js'
import { ALL_RESOURCES } from '../resources/index.js'
import { geocodingRoutes } from './geocoding.route.js'
import { cleanupTestData, createEnrolledVendor, TEST_NAMESPACE } from '../__tests__/helpers.js'

function testSlug(label: string) {
  return `${TEST_NAMESPACE}-geo-${label}-${randomUUID().slice(0, 8)}`
}

async function createStore(ownerUserId: string, input: {
  slug: string
  name: string
  city?: string
  state?: string
  zip?: string
  latitude?: string
  longitude?: string
  isPublished?: boolean
  status?: 'ACTIVE' | 'PAUSED'
}) {
  const store = await prisma.store.create({
    data: {
      ownerUserId,
      slug: input.slug,
      name: input.name,
      description: 'Discovery place test store',
      phone: '555-0100',
      email: 'store@test.com',
      addressStreet: '100 Test St',
      addressCity: input.city ?? null,
      addressState: input.state ?? null,
      addressZip: input.zip ?? null,
      pickupEnabled: true,
      deliveryEnabled: true,
      latitude: input.latitude ? new Decimal(input.latitude) : null,
      longitude: input.longitude ? new Decimal(input.longitude) : null,
      isPublished: input.isPublished ?? true,
      status: input.status ?? 'ACTIVE',
    },
  })
  await prisma.mediaAsset.create({ data: { storeId: store.id, kind: 'IMAGE', url: `https://example.test/${input.slug}.jpg` } })
  const item = await prisma.item.create({
    data: { storeId: store.id, title: `${input.name} item`, description: 'Active product', price: new Decimal('12.00'), isActive: true, isSoldOut: false },
  })
  await prisma.mediaAsset.create({ data: { storeId: store.id, itemId: item.id, kind: 'IMAGE', url: `https://example.test/${input.slug}-item.jpg` } })
  return store
}

describe('discovery place scopes', () => {
  const app = Fastify({ logger: false })
  const mark = `geo-${TEST_NAMESPACE}`

  beforeAll(async () => {
    await app.register(geocodingRoutes)
    await registerAllResources(app, ALL_RESOURCES)
    await app.ready()
  })

  afterAll(async () => {
    await cleanupTestData()
    await app.close()
  })

  it('resolves 78705 to Austin and keeps city, neighborhood, ZIP, and radius distinct', async () => {
    const vendor = await createEnrolledVendor()
    const west = await createStore(vendor.id, { slug: testSlug('west'), name: `${mark} West`, city: 'Austin', state: 'TX', zip: '78705', latitude: '30.29250000', longitude: '-97.74140000' })
    const downtown = await createStore(vendor.id, { slug: testSlug('down'), name: `${mark} Downtown`, city: 'Austin', state: 'TX', zip: '78701', latitude: '30.27110000', longitude: '-97.74370000' })
    const south = await createStore(vendor.id, { slug: testSlug('south'), name: `${mark} South`, city: 'Austin', state: 'TX', zip: '78704', latitude: '30.24200000', longitude: '-97.76800000' })
    const blank = await createStore(vendor.id, { slug: testSlug('blank'), name: `${mark} Blank` })
    await createStore(vendor.id, { slug: testSlug('draft'), name: `${mark} Draft`, city: 'Austin', state: 'TX', zip: '78705', latitude: '30.29250000', longitude: '-97.74140000', isPublished: false })
    await createStore(vendor.id, { slug: testSlug('paused'), name: `${mark} Paused`, city: 'Austin', state: 'TX', zip: '78701', latitude: '30.27110000', longitude: '-97.74370000', status: 'PAUSED' })
    const dallas = await createStore(vendor.id, { slug: testSlug('dallas'), name: `${mark} Dallas`, city: 'Dallas', state: 'TX', zip: '75201', latitude: '32.77670000', longitude: '-96.79700000' })

    const first = await backfillStorePlaces(prisma)
    const westAfter = await prisma.store.findUniqueOrThrow({ where: { id: west.id }, select: { placeId: true } })
    const second = await backfillStorePlaces(prisma)
    const westAgain = await prisma.store.findUniqueOrThrow({ where: { id: west.id }, select: { placeId: true } })
    expect(westAfter.placeId).toBe(WEST_CAMPUS_PLACE_ID)
    expect(westAgain.placeId).toBe(westAfter.placeId)
    expect(second).toEqual(first)
    const unresolved = await prisma.unresolvedStorePlace.findUniqueOrThrow({ where: { storeId: blank.id } })
    expect(unresolved.reason).toBe('NO_LOCATION')
    const unknownZip = await prisma.unresolvedStorePlace.findUniqueOrThrow({ where: { storeId: dallas.id } })
    expect(unknownZip.reason).toBe('UNKNOWN_ZIP')

    const geo = await app.inject({ method: 'GET', url: '/geocode/zip?zip=78705' })
    expect(geo.statusCode).toBe(200)
    const place = JSON.parse(geo.body) as { city?: string; state?: string; zip?: string; latitude?: number; longitude?: number; data?: unknown }
    expect(place.city).toBe('Austin')
    expect(place.state).toBe('TX')
    expect(place.zip).toBe('78705')
    expect(place.latitude).toBeCloseTo(30.2925, 3)
    expect(place.longitude).toBeCloseTo(-97.7414, 3)
    expect(place.data).toBeUndefined()

    const unknown = await app.inject({ method: 'GET', url: '/geocode/zip?zip=99950' })
    expect(unknown.statusCode).toBeGreaterThanOrEqual(400)
    const unknownBody = JSON.parse(unknown.body) as { data?: unknown }
    expect(unknownBody.data).toBeUndefined()

    const names = async (url: string) => {
      const response = await app.inject({ method: 'GET', url })
      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body) as { data: Array<{ name: string }>; total: number }
      return body.data.map((store) => store.name).filter((name) => name.startsWith(mark))
    }

    const cityNames = await names(`/stores?scope=city&city=Austin&state=TX&q=${encodeURIComponent(mark)}&limit=50`)
    expect(cityNames).toEqual(expect.arrayContaining([west.name, downtown.name, south.name]))
    expect(cityNames).not.toEqual(expect.arrayContaining([blank.name, `${mark} Draft`, `${mark} Paused`, dallas.name]))

    const neighborhoodNames = await names(`/stores?scope=neighborhood&place=austin-tx-west-campus&q=${encodeURIComponent(mark)}&limit=50`)
    expect(neighborhoodNames).toContain(west.name)
    expect(neighborhoodNames).not.toContain(downtown.name)
    expect(neighborhoodNames).not.toContain(south.name)

    const zipNames = await names(`/stores?scope=zip&zip=78701&q=${encodeURIComponent(mark)}&limit=50`)
    expect(zipNames).toContain(downtown.name)
    expect(zipNames).not.toContain(west.name)

    const failedRadius = await app.inject({ method: 'GET', url: '/stores?scope=radius&radiusMiles=25' })
    expect(failedRadius.statusCode).toBe(200)
    expect(JSON.parse(failedRadius.body).total).toBe(0)

    const radiusNames = await names('/stores?scope=radius&latitude=30.2672&longitude=-97.7431&radiusMiles=25&q=' + encodeURIComponent(mark) + '&limit=50')
    expect(radiusNames).toEqual(expect.arrayContaining([west.name, downtown.name, south.name]))
    expect(radiusNames).not.toContain(blank.name)
    expect(radiusNames).not.toContain(dallas.name)

    const homeNames = await names(`/stores?latitude=${place.latitude}&longitude=${place.longitude}&radiusMiles=25&q=${encodeURIComponent(mark)}&limit=50`)
    expect(homeNames).toContain(west.name)
    expect(homeNames).not.toContain(dallas.name)
    expect(homeNames).not.toContain(blank.name)
    expect(homeNames).not.toContain(`${mark} Draft`)

    const nearItem = await app.inject({
      method: 'GET',
      url: `/items?latitude=${place.latitude}&longitude=${place.longitude}&radiusMiles=25&title=${encodeURIComponent(`${west.name} item`)}`,
    })
    const farItem = await app.inject({
      method: 'GET',
      url: `/items?latitude=${place.latitude}&longitude=${place.longitude}&radiusMiles=25&title=${encodeURIComponent(`${dallas.name} item`)}`,
    })
    const unresolvedItems = await app.inject({
      method: 'GET',
      url: `/items?radiusMiles=25&title=${encodeURIComponent(`${west.name} item`)}`,
    })
    expect(nearItem.statusCode).toBe(200)
    expect(JSON.parse(nearItem.body).data).toHaveLength(1)
    expect(JSON.parse(farItem.body).data).toHaveLength(0)
    expect(JSON.parse(unresolvedItems.body).data).toHaveLength(0)

    const westItem = await app.inject({ method: 'GET', url: `/items?scope=city&city=Austin&state=TX&title=${encodeURIComponent(west.name + ' item')}` })
    const blankItem = await app.inject({ method: 'GET', url: `/items?scope=city&city=Austin&state=TX&title=${encodeURIComponent(blank.name + ' item')}` })
    expect(JSON.parse(westItem.body).data).toHaveLength(1)
    expect(JSON.parse(blankItem.body).data).toHaveLength(0)
  })
})
