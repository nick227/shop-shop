import { randomUUID } from 'crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import Fastify from 'fastify'
import { Decimal, prisma } from '@packages/db'
import { optionalAuthenticate } from '../middleware/auth.js'
import { registerAllResources } from './loader.js'
import { ALL_RESOURCES } from '../resources/index.js'
import { PublicStoreSchema } from '../resources/store-public.dto.js'
import { authHeaders, cleanupTestData, createAuthenticatedUser, createEnrolledVendor, createWorkspaceAdmin, TEST_NAMESPACE } from '../__tests__/helpers.js'

/** Values that must never reach an anonymous response, under any key. */
const SECRET = {
  taxId: `TAX-${randomUUID().slice(0, 8)}`,
  stripeAccountId: `acct_secret_${randomUUID().slice(0, 8)}`,
  companyName: `Legal Name ${randomUUID().slice(0, 6)} LLC`,
  disabledReason: `internal-note-${randomUUID().slice(0, 6)}`,
  ordersPausedReason: `pause-note-${randomUUID().slice(0, 6)}`,
}

const FORBIDDEN_KEY = /stripe|taxid|commission|owner|referred|affiliate|disabled|paused|geocode|feesjson|autoaccept|acceptancetimeout|password|companyname|defaulttaxcategory|placeid|hoursjson|timezone|metadata|^status$|^storeid$|^itemid$|^bundleid$|^listingid$|acceptsonlinecardpayments/i

function keysDeep(value: unknown, path = ''): string[] {
  if (Array.isArray(value)) return value.flatMap((entry, index) => keysDeep(entry, `${path}[${index}]`))
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, child]) => [`${path}.${key}`, ...keysDeep(child, `${path}.${key}`)])
  }
  return []
}

function expectPublic(body: unknown) {
  const leakedKeys = keysDeep(body).filter((path) => FORBIDDEN_KEY.test(path.split('.').pop()!.replace(/\[\d+\]$/, '')))
  expect(leakedKeys, 'sensitive keys in a public response').toEqual([])
  const text = JSON.stringify(body)
  for (const [name, value] of Object.entries(SECRET)) expect(text, `${name} value leaked`).not.toContain(value)
}

const slug = (label: string) => `${TEST_NAMESPACE}-public-${label}-${randomUUID().slice(0, 8)}`

async function createStore(ownerUserId: string, label: string, isPublished: boolean) {
  const store = await prisma.store.create({
    data: {
      ownerUserId,
      slug: slug(label),
      name: `Public DTO ${label}`,
      description: 'A store with private fields filled in',
      phone: '555-0100',
      email: 'hello@shop.test',
      website: 'https://shop.test',
      addressStreet: '100 Test St',
      addressCity: 'Austin',
      addressState: 'TX',
      addressZip: '78701',
      latitude: new Decimal('30.2672'),
      longitude: new Decimal('-97.7431'),
      geocodedAt: new Date(),
      geocodeSource: 'test',
      pickupEnabled: true,
      deliveryEnabled: true,
      deliveryCharge: new Decimal('5.00'),
      deliveryDistance: new Decimal('10.00'),
      feesJson: { minimumOrder: 0, internalMargin: 0.3 },
      isPublished,
      status: 'ACTIVE',
      taxId: SECRET.taxId,
      companyName: SECRET.companyName,
      stripeAccountId: `${SECRET.stripeAccountId}-${label}`,
      stripeOnboarded: true,
      stripeChargesEnabled: true,
      stripePayoutsEnabled: true,
      stripeRequirementsJson: { currently_due: ['secret'] },
      commissionRate: new Decimal('12.50'),
      disabledReason: SECRET.disabledReason,
      ordersPausedReason: SECRET.ordersPausedReason,
    },
  })
  await prisma.item.create({ data: { storeId: store.id, title: `${label} item`, description: 'Active product', price: new Decimal('12.00'), isActive: true, isSoldOut: false } })
  await prisma.mediaAsset.create({ data: { storeId: store.id, kind: 'IMAGE', url: `https://example.test/${store.slug}.jpg`, altText: 'Front', metadata: { s3Key: 'private/key' } } })
  return store
}

describe('public store responses', () => {
  const app = Fastify({ logger: false })
  let vendor: Awaited<ReturnType<typeof createEnrolledVendor>>
  let shopper: Awaited<ReturnType<typeof createAuthenticatedUser>>
  let admin: Awaited<ReturnType<typeof createWorkspaceAdmin>>
  let published: Awaited<ReturnType<typeof createStore>>
  let draft: Awaited<ReturnType<typeof createStore>>

  beforeAll(async () => {
    // Same as index.ts: a token, when present, identifies the caller on public routes.
    app.addHook('preHandler', optionalAuthenticate)
    await registerAllResources(app, ALL_RESOURCES)
    await app.ready()
    vendor = await createEnrolledVendor()
    shopper = await createAuthenticatedUser('USER')
    admin = await createWorkspaceAdmin()
    published = await createStore(vendor.id, 'live', true)
    draft = await createStore(vendor.id, 'draft', false)
  })

  afterAll(async () => {
    await prisma.store.deleteMany({ where: { id: { in: [published?.id, draft?.id].filter(Boolean) as string[] } } })
    await cleanupTestData()
    await app.close()
  })

  const get = (url: string, token?: string) => app.inject({ method: 'GET', url, headers: token ? authHeaders(token) : {} })
  const listIds = (body: { data: Array<{ id: string }> }) => body.data.map((store) => store.id)

  it.each([
    ['plain list', '/stores?limit=100'],
    ['delivery-first list', '/stores?limit=100&delivery=true'],
    ['coordinate search', '/stores?limit=100&latitude=30.2672&longitude=-97.7431&radiusMiles=5'],
    ['city search', '/stores?limit=100&city=Austin&state=TX'],
  ])('keeps the anonymous %s to public fields', async (_label, url) => {
    const response = await get(url)
    expect(response.statusCode, response.body).toBe(200)
    const body = JSON.parse(response.body) as { data: unknown[] }
    expect(listIds(body as never)).toContain(published.id)
    for (const row of body.data) PublicStoreSchema.parse(row)
    expectPublic(body)
  })

  it('still sends what discovery and the storefront read', async () => {
    const body = JSON.parse((await get('/stores?limit=100&latitude=30.2672&longitude=-97.7431&radiusMiles=5')).body) as { data: Array<Record<string, unknown>> }
    const store = body.data.find((row) => row.id === published.id)!
    expect(store).toMatchObject({
      name: published.name,
      slug: published.slug,
      phone: '555-0100',
      email: 'hello@shop.test',
      website: 'https://shop.test',
      addressCity: 'Austin',
      latitude: expect.anything(),
      longitude: expect.anything(),
      deliveryEnabled: true,
      pickupEnabled: true,
      fulfillment: { delivery: expect.any(String), pickup: expect.any(String) },
    })
    expect(typeof store.distance).toBe('number')
    expect(store.mediaAssets).toEqual([expect.objectContaining({ url: expect.stringContaining(published.slug), kind: 'IMAGE', altText: 'Front' })])
  })

  it('keeps the anonymous store detail to public fields', async () => {
    const response = await get(`/stores/${published.id}`)
    expect(response.statusCode, response.body).toBe(200)
    const body = JSON.parse(response.body)
    PublicStoreSchema.parse(body)
    expectPublic(body)
    expect(body.tags).toEqual([])
  })

  it('does not let a stranger list a vendor’s drafts or widen visibility', async () => {
    for (const token of [undefined, shopper.token]) {
      const response = await get(`/stores?limit=100&ownerUserId=${vendor.id}&isPublished=false&status=PAUSED`, token)
      expect(response.statusCode, response.body).toBe(200)
      const body = JSON.parse(response.body)
      expect(listIds(body)).not.toContain(draft.id)
      expectPublic(body)
    }
  })

  it('gives a signed-in shopper the public list too', async () => {
    const body = JSON.parse((await get('/stores?limit=100', shopper.token)).body)
    expect(listIds(body)).toContain(published.id)
    expectPublic(body)
  })

  it('never gives a signed-in stranger the full detail', async () => {
    const response = await get(`/stores/${published.id}`, shopper.token)
    // The ownership check may refuse outright; if it lets the read through, it must be public.
    if (response.statusCode === 200) {
      PublicStoreSchema.parse(JSON.parse(response.body))
      expectPublic(JSON.parse(response.body))
    } else {
      expect(response.statusCode).toBe(403)
    }
  })

  it('keeps the full record for the owner’s own list and detail', async () => {
    const list = JSON.parse((await get(`/stores?limit=100&ownerUserId=${vendor.id}`, vendor.token)).body) as { data: Array<Record<string, unknown>> }
    expect(listIds(list as never)).toEqual(expect.arrayContaining([published.id, draft.id]))
    expect(list.data.find((row) => row.id === published.id)).toMatchObject({ taxId: SECRET.taxId, ownerUserId: vendor.id })

    const detail = await get(`/stores/${published.id}`, vendor.token)
    expect(detail.statusCode, detail.body).toBe(200)
    expect(JSON.parse(detail.body)).toMatchObject({ taxId: SECRET.taxId, stripeOnboarded: true, acceptsOnlineCardPayments: true })
  })

  it('keeps the full record for an admin', async () => {
    const detail = await get(`/stores/${draft.id}`, admin.token)
    expect(detail.statusCode, detail.body).toBe(200)
    expect(JSON.parse(detail.body)).toMatchObject({ taxId: SECRET.taxId })
    const list = JSON.parse((await get(`/stores?limit=100&ownerUserId=${vendor.id}`, admin.token)).body)
    expect(listIds(list)).toContain(draft.id)
  })
})
