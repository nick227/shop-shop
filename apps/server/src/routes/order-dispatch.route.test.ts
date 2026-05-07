import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest'
import Fastify from 'fastify'
import { prisma } from '@packages/db'
import { authenticate } from '../middleware/auth.js'
import { orderDispatchRoutes } from './order-dispatch.route.js'
import {
  authHeaders,
  cleanupTestData,
  createAuthenticatedUser,
  createTestOrder,
  createTestStore,
} from '../__tests__/helpers.js'

async function ensureDeliveryJobTable() {
  try {
    await prisma.deliveryJob.findFirst({ select: { id: true } })
    return
  } catch {
    // Test DB may not have latest migrations applied; create the table for isolated tests.
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`DeliveryJob\` (
        \`id\` CHAR(36) NOT NULL,
        \`orderId\` CHAR(36) NOT NULL,
        \`storeId\` CHAR(36) NOT NULL,
        \`provider\` ENUM('IN_HOUSE','DOORDASH_DRIVE','UBER_DIRECT') NOT NULL,
        \`status\` ENUM('REQUESTED','DISPATCHED','CANCELED','FAILED','COMPLETED') NOT NULL DEFAULT 'REQUESTED',
        \`providerExternalId\` VARCHAR(191) NULL,
        \`trackingUrl\` VARCHAR(191) NULL,
        \`providerStatus\` VARCHAR(191) NULL,
        \`providerPayload\` JSON NULL,
        \`requestedByUserId\` CHAR(36) NULL,
        \`canceledAt\` DATETIME(3) NULL,
        \`completedAt\` DATETIME(3) NULL,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updatedAt\` DATETIME(3) NOT NULL,
        PRIMARY KEY (\`id\`),
        INDEX \`DeliveryJob_orderId_idx\` (\`orderId\`),
        INDEX \`DeliveryJob_storeId_idx\` (\`storeId\`),
        INDEX \`DeliveryJob_providerExternalId_idx\` (\`providerExternalId\`),
        CONSTRAINT \`DeliveryJob_orderId_fkey\` FOREIGN KEY (\`orderId\`) REFERENCES \`Order\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`DeliveryJob_storeId_fkey\` FOREIGN KEY (\`storeId\`) REFERENCES \`Store\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`DeliveryJob_requestedByUserId_fkey\` FOREIGN KEY (\`requestedByUserId\`) REFERENCES \`User\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `)
  }
}

describe('Order dispatch route', () => {
  const app = Fastify({ logger: false })

  let vendor: Awaited<ReturnType<typeof createAuthenticatedUser>>
  let otherVendor: Awaited<ReturnType<typeof createAuthenticatedUser>>
  let driver: Awaited<ReturnType<typeof createAuthenticatedUser>>
  let storeId: string

  beforeAll(async () => {
    await ensureDeliveryJobTable()
    app.decorate('authenticate', authenticate)
    await app.register(orderDispatchRoutes, { prefix: '/api/v1/orders' })
    await app.ready()
  })

  beforeEach(async () => {
    vendor = await createAuthenticatedUser('VENDOR')
    otherVendor = await createAuthenticatedUser('VENDOR')
    driver = await createAuthenticatedUser('USER')
    const store = await createTestStore(vendor.id)
    storeId = store.id
  })

  afterAll(async () => {
    await cleanupTestData()
    await app.close()
  })

  it('rejects dispatch for pickup orders', async () => {
    const pickupOrder = await prisma.order.create({
      data: {
        userId: vendor.id,
        storeId,
        deliveryType: 'PICKUP',
        status: 'READY',
        paymentStatus: 'PAID',
        subtotal: '10.00',
        fees: '0.00',
        tax: '0.80',
        tip: '0.00',
        total: '10.80',
        serviceFeePercent: '5.00',
        serviceFeeAmount: '0.54',
        netToVendor: '10.26',
      },
      select: { id: true },
    })

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/orders/${pickupOrder.id}/dispatch`,
      headers: authHeaders(vendor.token),
      payload: { provider: 'DOORDASH_DRIVE' },
    })

    expect(res.statusCode, res.body).toBe(400)
    expect(JSON.parse(res.body)).toMatchObject({ error: 'Order is not a delivery order' })
  })

  it('rejects dispatch for non-READY orders', async () => {
    const order = await createTestOrder(vendor.id, storeId, { status: 'PREPARING', paymentStatus: 'PAID' })
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/orders/${order.id}/dispatch`,
      headers: authHeaders(vendor.token),
      payload: { provider: 'DOORDASH_DRIVE' },
    })
    expect(res.statusCode, res.body).toBe(400)
    expect(JSON.parse(res.body)).toMatchObject({ error: 'Order must be READY to dispatch' })
  })

  it('rejects unauthorized vendor dispatching another store order', async () => {
    const order = await createTestOrder(vendor.id, storeId, { status: 'READY', paymentStatus: 'PAID' })
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/orders/${order.id}/dispatch`,
      headers: authHeaders(otherVendor.token),
      payload: { provider: 'DOORDASH_DRIVE' },
    })
    expect(res.statusCode, res.body).toBe(403)
  })

  it('IN_HOUSE dispatch requires assignedToUserId', async () => {
    const order = await createTestOrder(vendor.id, storeId, { status: 'READY', paymentStatus: 'PAID' })
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/orders/${order.id}/dispatch`,
      headers: authHeaders(vendor.token),
      payload: { provider: 'IN_HOUSE' },
    })
    expect(res.statusCode, res.body).toBe(400)
    expect(JSON.parse(res.body)).toMatchObject({ error: 'IN_HOUSE dispatch requires assignedToUserId' })
  })

  it('IN_HOUSE dispatch rejects non-driver assignee', async () => {
    const order = await createTestOrder(vendor.id, storeId, { status: 'READY', paymentStatus: 'PAID' })
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/orders/${order.id}/dispatch`,
      headers: authHeaders(vendor.token),
      payload: { provider: 'IN_HOUSE', assignedToUserId: driver.id },
    })
    expect(res.statusCode, res.body).toBe(400)
    expect(JSON.parse(res.body)).toMatchObject({ error: 'Assignee must be an active store driver' })
  })

  it('creates a DeliveryJob for READY delivery order (mock provider)', async () => {
    const order = await createTestOrder(vendor.id, storeId, { status: 'READY', paymentStatus: 'PAID' })
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/orders/${order.id}/dispatch`,
      headers: authHeaders(vendor.token),
      payload: { provider: 'DOORDASH_DRIVE' },
    })
    expect(res.statusCode, res.body).toBe(201)
    const body = JSON.parse(res.body) as { deliveryJob: { providerExternalId?: string; trackingUrl?: string; status: string; provider: string } }
    expect(body.deliveryJob.provider).toBe('DOORDASH_DRIVE')
    expect(body.deliveryJob.status).toBe('DISPATCHED')
    expect(body.deliveryJob.providerExternalId).toBeTruthy()
    expect(body.deliveryJob.trackingUrl).toBeTruthy()
  })

  it('prevents duplicate active DeliveryJobs', async () => {
    const order = await createTestOrder(vendor.id, storeId, { status: 'READY', paymentStatus: 'PAID' })
    const first = await app.inject({
      method: 'POST',
      url: `/api/v1/orders/${order.id}/dispatch`,
      headers: authHeaders(vendor.token),
      payload: { provider: 'DOORDASH_DRIVE' },
    })
    expect(first.statusCode, first.body).toBe(201)

    const second = await app.inject({
      method: 'POST',
      url: `/api/v1/orders/${order.id}/dispatch`,
      headers: authHeaders(vendor.token),
      payload: { provider: 'UBER_DIRECT' },
    })
    expect(second.statusCode, second.body).toBe(400)
    expect(JSON.parse(second.body)).toMatchObject({ error: 'Order already has an active delivery job' })
  })
})

