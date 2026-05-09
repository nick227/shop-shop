import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import Fastify from 'fastify'
import { prisma } from '@packages/db'
import { deliveryTrackingRoutes } from './delivery-tracking.route.js'
import {
  authHeaders,
  cleanupTestData,
  createAuthenticatedUser,
  createTestOrder,
  createTestStore,
} from '../__tests__/helpers.js'

describe('GET /api/delivery/tracking/:orderId', () => {
  const app = Fastify({ logger: false })

  beforeAll(async () => {
    await app.register(deliveryTrackingRoutes)
    await app.ready()
  })

  afterAll(async () => {
    await cleanupTestData()
    await app.close()
  })

  it('returns 401 when unauthenticated', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/delivery/tracking/00000000-0000-4000-8000-000000000001',
    })
    expect(res.statusCode).toBe(401)
  })

  it('returns 200 when the JWT subject owns the order', async () => {
    const vendor = await createAuthenticatedUser('VENDOR')
    const customer = await createAuthenticatedUser('USER')
    const store = await createTestStore(vendor.id)
    const order = await createTestOrder(customer.id, store.id, {
      status: 'READY',
      paymentStatus: 'PAID',
    })
    await prisma.order.update({
      where: { id: order.id },
      data: { deliveryMode: 'THIRD_PARTY_PROVIDER' },
    })
    const { randomUUID } = await import('crypto')
    await prisma.deliveryJob.create({
      data: {
        id: randomUUID(),
        orderId: order.id,
        storeId: store.id,
        provider: 'DOORDASH_DRIVE',
        status: 'DISPATCHED',
        providerExternalId: `test_${randomUUID().slice(0, 8)}`,
        providerPayload: {},
      },
    })

    const res = await app.inject({
      method: 'GET',
      url: `/api/delivery/tracking/${order.id}`,
      headers: authHeaders(customer.token),
    })
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body) as { deliveryJob: { id: string } | null }
    expect(body.deliveryJob?.id).toBeTruthy()
  })

  it('returns 403 for another authenticated customer', async () => {
    const vendor = await createAuthenticatedUser('VENDOR')
    const customer = await createAuthenticatedUser('USER')
    const otherCustomer = await createAuthenticatedUser('USER')
    const store = await createTestStore(vendor.id)
    const order = await createTestOrder(customer.id, store.id, {
      status: 'READY',
      paymentStatus: 'PAID',
    })
    await prisma.order.update({
      where: { id: order.id },
      data: { deliveryMode: 'THIRD_PARTY_PROVIDER' },
    })
    const { randomUUID } = await import('crypto')
    await prisma.deliveryJob.create({
      data: {
        id: randomUUID(),
        orderId: order.id,
        storeId: store.id,
        provider: 'DOORDASH_DRIVE',
        status: 'DISPATCHED',
        providerExternalId: `test_${randomUUID().slice(0, 8)}`,
        providerPayload: {},
      },
    })

    const res = await app.inject({
      method: 'GET',
      url: `/api/delivery/tracking/${order.id}`,
      headers: authHeaders(otherCustomer.token),
    })
    expect(res.statusCode).toBe(403)
  })

  it('returns 200 for store vendor (owner) with deliveries scope', async () => {
    const vendor = await createAuthenticatedUser('VENDOR')
    const customer = await createAuthenticatedUser('USER')
    const store = await createTestStore(vendor.id)
    const order = await createTestOrder(customer.id, store.id, {
      status: 'READY',
      paymentStatus: 'PAID',
    })
    await prisma.order.update({
      where: { id: order.id },
      data: { deliveryMode: 'THIRD_PARTY_PROVIDER' },
    })
    const { randomUUID } = await import('crypto')
    await prisma.deliveryJob.create({
      data: {
        id: randomUUID(),
        orderId: order.id,
        storeId: store.id,
        provider: 'DOORDASH_DRIVE',
        status: 'DISPATCHED',
        providerExternalId: `test_${randomUUID().slice(0, 8)}`,
        providerPayload: {},
      },
    })

    const res = await app.inject({
      method: 'GET',
      url: `/api/delivery/tracking/${order.id}`,
      headers: authHeaders(vendor.token),
    })
    expect(res.statusCode).toBe(200)
  })

  it('returns 200 for STAFF team member with deliveries permission', async () => {
    const vendor = await createAuthenticatedUser('VENDOR')
    const customer = await createAuthenticatedUser('USER')
    const staff = await createAuthenticatedUser('STAFF')
    const store = await createTestStore(vendor.id)
    await prisma.teamMember.create({
      data: {
        storeId: store.id,
        userId: staff.id,
        permissionsJson: ['VIEW_DELIVERIES'],
      },
    })

    const order = await createTestOrder(customer.id, store.id, {
      status: 'READY',
      paymentStatus: 'PAID',
    })
    await prisma.order.update({
      where: { id: order.id },
      data: { deliveryMode: 'THIRD_PARTY_PROVIDER' },
    })
    const { randomUUID } = await import('crypto')
    await prisma.deliveryJob.create({
      data: {
        id: randomUUID(),
        orderId: order.id,
        storeId: store.id,
        provider: 'DOORDASH_DRIVE',
        status: 'DISPATCHED',
        providerExternalId: `test_${randomUUID().slice(0, 8)}`,
        providerPayload: {},
      },
    })

    const res = await app.inject({
      method: 'GET',
      url: `/api/delivery/tracking/${order.id}`,
      headers: authHeaders(staff.token),
    })
    expect(res.statusCode).toBe(200)
  })

  it('returns 403 for STAFF team member without deliveries permission', async () => {
    const vendor = await createAuthenticatedUser('VENDOR')
    const customer = await createAuthenticatedUser('USER')
    const staff = await createAuthenticatedUser('STAFF')
    const store = await createTestStore(vendor.id)
    await prisma.teamMember.create({
      data: {
        storeId: store.id,
        userId: staff.id,
        permissionsJson: ['MANAGE_ORDERS'],
      },
    })

    const order = await createTestOrder(customer.id, store.id, {
      status: 'READY',
      paymentStatus: 'PAID',
    })
    await prisma.order.update({
      where: { id: order.id },
      data: { deliveryMode: 'THIRD_PARTY_PROVIDER' },
    })
    const { randomUUID } = await import('crypto')
    await prisma.deliveryJob.create({
      data: {
        id: randomUUID(),
        orderId: order.id,
        storeId: store.id,
        provider: 'DOORDASH_DRIVE',
        status: 'DISPATCHED',
        providerExternalId: `test_${randomUUID().slice(0, 8)}`,
        providerPayload: {},
      },
    })

    const res = await app.inject({
      method: 'GET',
      url: `/api/delivery/tracking/${order.id}`,
      headers: authHeaders(staff.token),
    })
    expect(res.statusCode).toBe(403)
  })
})
