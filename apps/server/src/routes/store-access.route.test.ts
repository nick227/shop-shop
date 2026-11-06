import { randomUUID } from 'crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import Fastify from 'fastify'
import { Decimal, prisma } from '@packages/db'
import { optionalAuthenticate } from '../middleware/auth.js'
import { registerAllResources } from './loader.js'
import { ALL_RESOURCES } from '../resources/index.js'
import { PublicStoreSchema } from '../resources/store-public.dto.js'
import { deliveryZoneRoutes } from './delivery-zone.route.js'
import { storefrontRoutes } from './storefront.route.js'
import { authHeaders, cleanupTestData, createAuthenticatedUser, createEnrolledVendor, createWorkspaceAdmin, TEST_NAMESPACE } from '../__tests__/helpers.js'

type Status = 'ACTIVE' | 'PAUSED' | 'DISABLED'
type User = Awaited<ReturnType<typeof createAuthenticatedUser>>

const TAX_ID = `TAX-${randomUUID().slice(0, 8)}`
const ZONE = [[-97.76, 30.25], [-97.72, 30.25], [-97.72, 30.29], [-97.76, 30.29], [-97.76, 30.25]]

async function createStore(ownerUserId: string, label: string, isPublished: boolean, status: Status = 'ACTIVE') {
  const store = await prisma.store.create({
    data: {
      ownerUserId,
      slug: `${TEST_NAMESPACE}-access-${label}-${randomUUID().slice(0, 8)}`,
      name: `Access ${label}`,
      description: 'Access-control test store',
      phone: '555-0100',
      email: 'hello@shop.test',
      addressStreet: '100 Test St',
      addressCity: 'Austin',
      addressState: 'TX',
      addressZip: '78701',
      latitude: new Decimal('30.2672'),
      longitude: new Decimal('-97.7431'),
      pickupEnabled: true,
      deliveryEnabled: true,
      deliveryCharge: new Decimal('5.00'),
      isPublished,
      status,
      taxId: TAX_ID,
      stripeAccountId: `acct_access_${randomUUID().slice(0, 8)}`,
    },
  })
  await prisma.deliveryZone.createMany({
    data: [
      { storeId: store.id, name: 'Downtown', polygonJson: { type: 'Polygon', coordinates: [ZONE] }, baseFee: new Decimal('4.00'), minOrder: new Decimal('15.00'), priority: 7, isActive: true },
      { storeId: store.id, name: 'Paused test zone', polygonJson: { type: 'Polygon', coordinates: [ZONE] }, baseFee: new Decimal('1.00'), priority: 1, isActive: false },
    ],
  })
  return store
}

describe('store access by viewer', () => {
  const app = Fastify({ logger: false })
  let owner: User, shopper: User, admin: User, otherVendor: User, settingsManager: User, ordersOnlyMember: User
  let live: { id: string }, draft: { id: string }, suspended: { id: string }, disabled: { id: string }

  beforeAll(async () => {
    app.addHook('preHandler', optionalAuthenticate) // as in index.ts
    await app.register(deliveryZoneRoutes)
    await app.register(storefrontRoutes)
    await registerAllResources(app, ALL_RESOURCES)
    await app.ready()

    owner = await createEnrolledVendor()
    shopper = await createAuthenticatedUser('USER')
    admin = await createWorkspaceAdmin()
    otherVendor = await createEnrolledVendor()
    settingsManager = await createAuthenticatedUser('USER')
    ordersOnlyMember = await createAuthenticatedUser('USER')

    live = await createStore(owner.id, 'live', true)
    draft = await createStore(owner.id, 'draft', false)
    suspended = await createStore(owner.id, 'suspended', true, 'PAUSED')
    disabled = await createStore(owner.id, 'disabled', true, 'DISABLED')
    await createStore(otherVendor.id, 'rival', true)

    for (const store of [live, draft]) {
      await prisma.teamMember.create({ data: { storeId: store.id, userId: settingsManager.id, permissionsJson: ['MANAGE_STORE_SETTINGS'] } })
      await prisma.teamMember.create({ data: { storeId: store.id, userId: ordersOnlyMember.id, permissionsJson: ['VIEW_ORDERS'] } })
    }
  })

  afterAll(async () => {
    await prisma.store.deleteMany({ where: { slug: { startsWith: `${TEST_NAMESPACE}-access-` } } })
    await cleanupTestData()
    await app.close()
  })

  const get = (url: string, user?: User) => app.inject({ method: 'GET', url, headers: user ? authHeaders(user.token) : {} })
  const viewers = () => ({ anonymous: undefined, shopper, otherVendor })

  describe('GET /stores/:id', () => {
    it('gives anonymous visitors, signed-in shoppers, and other vendors the same public store', async () => {
      const bodies = []
      for (const [name, user] of Object.entries(viewers())) {
        const response = await get(`/stores/${live.id}`, user)
        expect(response.statusCode, `${name}: ${response.body}`).toBe(200)
        const body = JSON.parse(response.body)
        PublicStoreSchema.parse(body)
        expect(response.body).not.toContain(TAX_ID)
        bodies.push(body)
      }
      expect(bodies[1]).toEqual(bodies[0])
      expect(bodies[2]).toEqual(bodies[0])
    })

    it('answers a private store exactly like a store that does not exist', async () => {
      const missing = await get(`/stores/${randomUUID()}`)
      expect(missing.statusCode).toBe(404)
      for (const store of [draft, suspended, disabled]) {
        for (const [name, user] of Object.entries(viewers())) {
          const response = await get(`/stores/${store.id}`, user)
          expect(response.statusCode, name).toBe(404)
          expect(response.body, name).toBe(missing.body)
        }
      }
    })

    it('gives a team member without settings access only the public shape, drafts included', async () => {
      for (const store of [live, draft]) {
        const response = await get(`/stores/${store.id}`, ordersOnlyMember)
        expect(response.statusCode).toBe(200)
        PublicStoreSchema.parse(JSON.parse(response.body))
      }
      // Not on this store's team: private stays private.
      expect((await get(`/stores/${suspended.id}`, ordersOnlyMember)).statusCode).toBe(404)
    })

    it('gives the full record to the owner, a settings manager, and an admin, private stores included', async () => {
      const cases: Array<[string, User, Array<{ id: string }>]> = [
        ['owner', owner, [live, draft, suspended, disabled]],
        ['settings manager', settingsManager, [live, draft]],
        ['admin', admin, [live, draft, suspended, disabled]],
      ]
      for (const [name, user, stores] of cases) {
        for (const store of stores) {
          const response = await get(`/stores/${store.id}`, user)
          expect(response.statusCode, `${name}: ${response.body}`).toBe(200)
          expect(JSON.parse(response.body), name).toMatchObject({ id: store.id, taxId: TAX_ID })
        }
      }
    })

    it('still refuses updates from anyone but the owner or an admin', async () => {
      const current = await prisma.store.findUniqueOrThrow({ where: { id: live.id } })
      const payload = { name: current.name, slug: current.slug, phone: current.phone ?? '', email: current.email ?? '', website: current.website ?? '', description: 'Updated by owner' }
      for (const user of [shopper, otherVendor, settingsManager]) {
        const response = await app.inject({ method: 'PATCH', url: `/stores/${live.id}`, headers: authHeaders(user.token), payload })
        expect(response.statusCode).toBe(403)
      }
      const own = await app.inject({ method: 'PATCH', url: `/stores/${live.id}`, headers: authHeaders(owner.token), payload })
      expect(own.statusCode, own.body).toBe(200)
    })
  })

  describe('GET /stores/:id/storefront', () => {
    it('hides suspended and disabled stores like drafts, and keeps them for the team', async () => {
      const missing = await get(`/stores/${randomUUID()}/storefront`)
      for (const store of [draft, suspended, disabled]) {
        for (const user of Object.values(viewers())) {
          const response = await get(`/stores/${store.id}/storefront`, user)
          expect(response.statusCode).toBe(404)
          expect(response.body).toBe(missing.body)
        }
        expect((await get(`/stores/${store.id}/storefront`, owner)).statusCode).toBe(200)
      }
      expect((await get(`/stores/${live.id}/storefront`, shopper)).statusCode).toBe(200)
    })
  })

  describe('GET /stores/:storeId/delivery-zones', () => {
    it('gives shoppers and other vendors only active coverage and fees', async () => {
      for (const [name, user] of Object.entries(viewers())) {
        const response = await get(`/stores/${live.id}/delivery-zones`, user)
        expect(response.statusCode, `${name}: ${response.body}`).toBe(200)
        const { zones } = JSON.parse(response.body) as { zones: Array<Record<string, unknown>> }
        expect(zones).toHaveLength(1)
        expect(Object.keys(zones[0]).sort()).toEqual(['baseFee', 'id', 'minOrder', 'name', 'polygonJson'])
        expect(zones[0]).toMatchObject({ name: 'Downtown', baseFee: '4', minOrder: '15' })
      }
    })

    it('answers a private store’s zones like a missing store', async () => {
      const missing = await get(`/stores/${randomUUID()}/delivery-zones`)
      for (const store of [draft, suspended]) {
        for (const user of Object.values(viewers())) {
          const response = await get(`/stores/${store.id}/delivery-zones`, user)
          expect(response.statusCode).toBe(404)
          expect(response.body).toBe(missing.body)
        }
      }
    })

    it('gives store managers every zone as stored, for editing', async () => {
      for (const user of [owner, settingsManager, admin]) {
        const response = await get(`/stores/${draft.id}/delivery-zones`, user)
        expect(response.statusCode, response.body).toBe(200)
        const { zones } = JSON.parse(response.body) as { zones: Array<Record<string, unknown>> }
        expect(zones).toHaveLength(2)
        expect(zones[0]).toMatchObject({ storeId: draft.id, priority: 7, isActive: true })
      }
    })
  })
})
