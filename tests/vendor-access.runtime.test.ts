import { authRoutes } from '../apps/server/src/routes/auth.route'
import { beforeAll, afterAll, describe, expect, it } from 'vitest'
import Fastify, { type FastifyInstance } from '../apps/server/node_modules/fastify/fastify.js'
import { randomUUID } from 'node:crypto'
import { prisma, createUser, generateJWT, getAccountCapabilities, enrollVendor, hasStorePermission, acceptInvitation } from '@packages/db'
import { accountAccessRoutes } from '../apps/server/src/routes/account-access.route'
import { teamRoutes } from '../apps/server/src/routes/team.route'
import { registerResource } from '../apps/server/src/routes/loader'
import { storeResource } from '../apps/server/src/resources/store.resource'
import { itemResource } from '../apps/server/src/resources/item.resource'
import { optionalAuthenticate } from '../apps/server/src/middleware/auth'
import { userHasStoreAccess } from '../apps/server/src/middleware/storeAccess'
import { realtimeBroker } from '../apps/server/src/services/realtime.broker'

// Never run fixtures or mutations against a developer/production database.
const isolated = new URL(process.env.DATABASE_URL || 'mysql://localhost/missing').pathname.startsWith('/shopshop_vendor_boundary_test_')
if (!isolated) throw new Error('Vendor boundary tests require an isolated shopshop_vendor_boundary_test_ database')
describe('Vendor access boundary (isolated migrated MySQL)', () => {
  let app: FastifyInstance
  let shopper: Awaited<ReturnType<typeof createUser>>
  let staff: typeof shopper
  let owner: typeof shopper
  let admin: typeof shopper
  let storeId: string
  const auth = (user: typeof shopper) => ({ authorization: `Bearer ${generateJWT(user)}` })
  beforeAll(async () => {
    app = Fastify({ logger: false })
    app.addHook('preHandler', optionalAuthenticate)
    await app.register(authRoutes, { prefix: '/api/auth/v1' })
    await app.register(accountAccessRoutes, { prefix: '/api' })
    await app.register(teamRoutes, { prefix: '/api' })
    await registerResource(app, storeResource, '/api')
    await registerResource(app, itemResource, '/api')
    await app.ready()
    const user = (name: string) => createUser({ email: `${name}-${randomUUID()}@boundary.test`, password: 'boundary-test-password', name })
    shopper = await user('shopper')
    staff = await user('staff')
    owner = await user('owner')
    admin = await user('admin')
    admin = await prisma.user.update({ where: { id: admin.id }, data: { role: 'ADMIN' } })
    const store = await prisma.store.create({ data: { ownerUserId: owner.id, name: 'Assigned store', slug: randomUUID(), addressStreet: '1 Main St', addressCity: 'Austin', addressState: 'TX', addressZip: '78701' } })
    storeId = store.id
  })
  afterAll(async () => { await app?.close(); await prisma.$disconnect() })

  it('backfills vendors and owners, preserves team membership, and defaults everyone else to shoppers', async () => {
    expect(await getAccountCapabilities('legacy-shopper')).toMatchObject({ canAccessVendorPortal: false, canCreateStore: false })
    for (const id of ['legacy-vendor','legacy-owner']) expect(await getAccountCapabilities(id)).toMatchObject({ vendorEnrollment: 'APPROVED', canCreateStore: true })
    expect(await getAccountCapabilities('legacy-team')).toMatchObject({ vendorEnrollment: 'NONE', canAccessVendorPortal: true, canCreateStore: false })
    expect(await getAccountCapabilities('legacy-admin')).toMatchObject({ canAdministerStores: true, canCreateStore: true })
    expect(await getAccountCapabilities('legacy-pending')).toMatchObject({ vendorEnrollment: 'PENDING', canAccessVendorPortal: false })
    expect(await prisma.teamMember.findUnique({ where: { id: 'legacy-membership' } })).toMatchObject({ isActive: true, permissionsJson: ['VIEW_ITEMS'] })
  })

  it('signup cannot grant itself vendor or administrative authority', async () => {
    const result = await app.inject({ method: 'POST', url: '/api/auth/v1/signup', payload: {
      email: `signup-${randomUUID()}@boundary.test`, password: 'boundary-test-password',
      role: 'ADMIN', adminVendorWorkspace: true, adminCreateStores: true, vendorEnrollment: { status: 'APPROVED' },
    } })
    expect(result.statusCode).toBe(201)
    expect(result.json().user.role).toBe('USER')
    expect(await getAccountCapabilities(result.json().user.id)).toMatchObject({ canAccessVendorPortal: false, canCreateStore: false, canAdministerStores: false })
    expect((await app.inject({ url: '/api/team/me/stores' })).statusCode).toBe(401)
  })

  it('denies new shoppers direct workspace and store creation API requests', async () => {
    expect(shopper.role).toBe('USER')
    for (const url of ['/api/team/me/stores', '/api/team/stores/legacy-store/members']) {
      expect((await app.inject({ url, headers: auth(shopper) })).statusCode).toBe(403)
    }
    expect((await app.inject({ method: 'POST', url: '/api/stores', headers: auth(shopper), payload: {} })).statusCode).toBe(403)
    expect((await app.inject({ url: '/api/auth/v1/capabilities', headers: auth(shopper) })).json()).toMatchObject({ canAccessVendorPortal: false })
  })

  it('auto-approves explicit enrollment idempotently without changing role or KYC', async () => {
    for (let i = 0; i < 2; i++) {
      const result = await app.inject({ method: 'POST', url: '/api/account/vendor-enrollment', headers: auth(shopper) })
      expect(result.statusCode).toBe(200)
      expect(result.json()).toMatchObject({ vendorEnrollment: 'APPROVED', canCreateStore: true, canAccessVendorPortal: true })
    }
    expect(await prisma.user.findUnique({ where: { id: shopper.id } })).toMatchObject({ role: 'USER' })
    expect(await prisma.vendorVerification.findUnique({ where: { userId: shopper.id } })).toBeNull()
    expect(await prisma.vendorEnrollment.count({ where: { userId: shopper.id } })).toBe(1)
    const created = await app.inject({ method: 'POST', url: '/api/stores', headers: auth(shopper), payload: {
      name: 'Enrolled merchant', slug: randomUUID(), description: 'A merchant store', phone: '5550100',
      email: 'merchant@boundary.test', website: 'https://example.test', pickupEnabled: true, deliveryEnabled: false,
      addressStreet: '1 Main St', addressCity: 'Austin', addressState: 'TX', addressZip: '78701',
    } })
    expect(created.statusCode, created.body).toBe(201)
    expect(created.json().ownerUserId).toBe(shopper.id)
    expect(await prisma.user.findUnique({ where: { id: shopper.id } })).toMatchObject({ role: 'USER' })
  })

  it('requires explicit admin grants, independent from platform role', async () => {
    expect(await getAccountCapabilities(admin.id)).toMatchObject({ platformRole: 'ADMIN', canAccessVendorPortal: false, canCreateStore: false })
    expect(await userHasStoreAccess(admin.id, 'ADMIN', storeId, 'settings')).toBe(false)
    const grant = await app.inject({ method: 'PATCH', url: `/api/admin/users/${admin.id}/vendor-access`, headers: auth(admin), payload: { adminVendorWorkspace: true } })
    expect(grant.statusCode).toBe(200)
    expect(grant.json()).toMatchObject({ canAccessVendorPortal: true, canCreateStore: false, canAdministerStores: true })
    expect(await userHasStoreAccess(admin.id, 'ADMIN', storeId, 'settings')).toBe(true)
  })

  it('suspended and pending enrollment do not authorize store creation', async () => {
    const pending = await createUser({ email: `pending-${randomUUID()}@boundary.test`, password: 'boundary-test-password' })
    await prisma.vendorEnrollment.create({ data: { userId: pending.id, status: 'PENDING' } })
    expect(await getAccountCapabilities(pending.id)).toMatchObject({ canAccessVendorPortal: false, canCreateStore: false })
    await prisma.vendorEnrollment.update({ where: { userId: pending.id }, data: { status: 'SUSPENDED' } })
    await enrollVendor(pending.id)
    expect(await getAccountCapabilities(pending.id)).toMatchObject({ vendorAccessRevoked: true, canAccessVendorPortal: false, canCreateStore: false })
  })

  it('accepts an invitation without enrollment, limits access to assigned features, and prevents replay', async () => {
    const invitation = await prisma.invitation.create({ data: { storeId, senderUserId: owner.id, recipientEmail: staff.email.toUpperCase(), token: randomUUID(), expiresAt: new Date(Date.now() + 60000), permissionsJson: ['VIEW_ITEMS', 'MANAGE_ITEMS'] } })
    const mismatch = await app.inject({ method: 'POST', url: '/api/team/invitations/accept', headers: auth(shopper), payload: { token: invitation.token } })
    expect(mismatch.statusCode).toBe(400)
    const result = await app.inject({ method: 'POST', url: '/api/team/invitations/accept', headers: auth(staff), payload: { token: invitation.token } })
    expect(result.statusCode).toBe(200)
    expect(await getAccountCapabilities(staff.id)).toMatchObject({ vendorEnrollment: 'NONE', canAccessVendorPortal: true, canCreateStore: false })
    const stores = await app.inject({ url: '/api/team/me/stores', headers: auth(staff) })
    expect(stores.json().stores.map((s: { storeId: string }) => s.storeId)).toEqual([storeId])
    expect(await hasStorePermission(staff.id, storeId, 'MANAGE_ITEMS')).toBe(true)
    expect(await hasStorePermission(staff.id, storeId, 'MANAGE_ORDERS')).toBe(false)
    expect(await hasStorePermission(staff.id, 'legacy-store', 'MANAGE_ITEMS')).toBe(false)
    expect((await app.inject({ method: 'POST', url: '/api/stores', headers: auth(staff), payload: {} })).statusCode).toBe(403)
    const payload = { storeId, title: 'Team item', description: 'Item created by assigned staff', price: '5.00', isActive: false }
    const created = await app.inject({ method: 'POST', url: '/api/items', headers: auth(staff), payload })
    expect(created.statusCode, created.body).toBe(201)
    expect((await app.inject({ method: 'POST', url: '/api/items', headers: auth(staff), payload: { ...payload, storeId: '00000000-0000-4000-8000-000000000000' } })).statusCode).toBe(403)
    await expect(acceptInvitation({ token: invitation.token, userId: staff.id })).rejects.toThrow('already used')
  })

  it('rejects expired invitations without creating membership', async () => {
    const invitation = await prisma.invitation.create({ data: { storeId: 'legacy-store', senderUserId: owner.id, recipientEmail: staff.email, token: randomUUID(), expiresAt: new Date(0), permissionsJson: ['FULL_ACCESS'] } })
    await expect(acceptInvitation({ token: invitation.token, userId: staff.id })).rejects.toThrow('expired')
    expect(await prisma.teamMember.findUnique({ where: { storeId_userId: { storeId: 'legacy-store', userId: staff.id } } })).toBeNull()
  })

  it('revokes immediately using the same token, preserving records and preventing self-restoration', async () => {
    const headers = auth(owner)
    const result = await app.inject({ method: 'PATCH', url: `/api/admin/users/${owner.id}/vendor-access`, headers: auth(admin), payload: { workspaceRevoked: true } })
    expect(result.statusCode).toBe(200)
    expect(result.json()).toMatchObject({ canAccessVendorPortal: false, canCreateStore: false })
    expect((await app.inject({ url: '/api/team/me/stores', headers })).statusCode).toBe(403)
    expect(await userHasStoreAccess(owner.id, 'USER', storeId, 'settings')).toBe(false)
    expect(await hasStorePermission(owner.id, storeId, 'MANAGE_ITEMS')).toBe(false)
    expect(await prisma.store.findUnique({ where: { id: storeId } })).toMatchObject({ ownerUserId: owner.id })
    expect(await prisma.teamMember.count({ where: { storeId } })).toBe(1)
    expect((await app.inject({ method: 'POST', url: '/api/account/vendor-enrollment', headers })).statusCode).toBe(403)
    expect((await app.inject({ url: '/api/auth/v1/capabilities', headers })).statusCode).toBe(200)
  })

  it('removing the last membership removes workspace access without enrollment side effects', async () => {
    const member = await prisma.teamMember.findUniqueOrThrow({ where: { storeId_userId: { storeId, userId: staff.id } } })
    const result = await app.inject({ method: 'DELETE', url: `/api/team/members/${member.id}`, headers: auth(admin) })
    expect(result.statusCode).toBe(204)
    expect(await getAccountCapabilities(staff.id)).toMatchObject({ canAccessVendorPortal: false, canCreateStore: false, vendorEnrollment: 'NONE' })
  })

  it('rechecks authorization before delivering realtime messages to existing subscribers', async () => {
    let allowed = true
    const messages: string[] = []
    const socket = { OPEN: 1, readyState: 1, send: (msg: string) => messages.push(msg) }
    const topic = 'vendor:boundary-realtime'
    realtimeBroker.subscribe(topic, socket as never, async () => allowed)
    realtimeBroker.publish(topic, { type: 'order.created', timestamp: '', payload: {} })
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(messages).toHaveLength(1)
    allowed = false
    realtimeBroker.publish(topic, { type: 'order.created', timestamp: '', payload: {} })
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(messages).toHaveLength(1)
    expect(realtimeBroker.getSubscriberCount(topic)).toBe(0)
  })
})
