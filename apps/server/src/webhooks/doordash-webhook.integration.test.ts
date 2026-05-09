import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import Fastify from 'fastify'
import crypto from 'node:crypto'
import { prisma } from '@packages/db'
import {
  cleanupTestData,
  createAuthenticatedUser,
  createTestOrder,
  createTestStore,
} from '../__tests__/helpers.js'
import { doordashWebhookRoutes } from './doordash.webhook.js'

async function ensureDeliveryJobTable() {
  try {
    await prisma.deliveryJob.findFirst({ select: { id: true } })
    return
  } catch {
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

function saveDoorDashEnv(): Record<string, string | undefined> {
  return {
    DOORDASH_WEBHOOK_AUTH_MODE: process.env.DOORDASH_WEBHOOK_AUTH_MODE,
    DOORDASH_WEBHOOK_BASIC_USER: process.env.DOORDASH_WEBHOOK_BASIC_USER,
    DOORDASH_WEBHOOK_BASIC_PASSWORD: process.env.DOORDASH_WEBHOOK_BASIC_PASSWORD,
    DOORDASH_WEBHOOK_SECRET: process.env.DOORDASH_WEBHOOK_SECRET,
    DOORDASH_WEBHOOK_SIGNATURE_HEADER: process.env.DOORDASH_WEBHOOK_SIGNATURE_HEADER,
  }
}

function restoreDoorDashEnv(saved: Record<string, string | undefined>) {
  for (const [k, v] of Object.entries(saved)) {
    if (v === undefined) {
      delete process.env[k]
    } else {
      process.env[k] = v
    }
  }
}

describe('DoorDash webhook integration', () => {
  const app = Fastify({ logger: false })

  beforeAll(async () => {
    await ensureDeliveryJobTable()
    await app.register(doordashWebhookRoutes)
    await app.ready()
  })

  afterAll(async () => {
    await cleanupTestData()
    await app.close()
  })

  it('processes webhook, stores audit, dedupes by event_id, and rejects bad Basic auth', async () => {
    const envSnap = saveDoorDashEnv()
    process.env.DOORDASH_WEBHOOK_AUTH_MODE = 'basic'
    process.env.DOORDASH_WEBHOOK_BASIC_USER = 'shopshop'
    process.env.DOORDASH_WEBHOOK_BASIC_PASSWORD = 'local-secret'

    try {
      const vendor = await createAuthenticatedUser('VENDOR')
      const store = await createTestStore(vendor.id)
      const storeId = store.id

      const order = await createTestOrder(vendor.id, storeId, { status: 'READY', paymentStatus: 'PAID' })
      await prisma.order.update({
        where: { id: order.id },
        data: { deliveryMode: 'THIRD_PARTY_PROVIDER' },
      })

      const externalId = `dd_test_${crypto.randomUUID().slice(0, 8)}`
      const { randomUUID } = await import('crypto')
      await prisma.deliveryJob.create({
        data: {
          id: randomUUID(),
          orderId: order.id,
          storeId,
          provider: 'DOORDASH_DRIVE',
          status: 'DISPATCHED',
          providerExternalId: externalId,
          providerPayload: {},
        },
      })

      const basicOk = Buffer.from('shopshop:local-secret', 'utf8').toString('base64')
      const evtId = `evt_dd_${crypto.randomUUID()}`
      const payloadObj = {
        event_name: 'DASHER_PICKED_UP',
        external_delivery_id: externalId,
        event_id: evtId,
      }
      const payloadStr = JSON.stringify(payloadObj)

      const res1 = await app.inject({
        method: 'POST',
        url: '/webhooks/doordash',
        headers: {
          'content-type': 'application/json',
          authorization: `Basic ${basicOk}`,
        },
        payload: payloadStr,
      })
      expect(res1.statusCode).toBe(200)
      const body1 = JSON.parse(res1.body) as { duplicate?: boolean; mapped_event_type?: string }
      expect(body1.duplicate).toBeUndefined()
      expect(body1.mapped_event_type).toBe('picked_up')

      const orderAfter = await prisma.order.findUnique({
        where: { id: order.id },
        select: { status: true },
      })
      expect(orderAfter?.status).toBe('OUT_FOR_DELIVERY')

      const jobAfter = await prisma.deliveryJob.findFirst({
        where: { providerExternalId: externalId },
        select: { providerPayload: true },
      })
      const pl = jobAfter?.providerPayload as { doorDashWebhook?: { lastRawEvent?: unknown } } | null
      expect(pl?.doorDashWebhook?.lastRawEvent).toMatchObject(payloadObj)

      const resDup = await app.inject({
        method: 'POST',
        url: '/webhooks/doordash',
        headers: {
          'content-type': 'application/json',
          authorization: `Basic ${basicOk}`,
        },
        payload: payloadStr,
      })
      expect(resDup.statusCode).toBe(200)
      const dupBody = JSON.parse(resDup.body) as { duplicate?: boolean }
      expect(dupBody.duplicate).toBe(true)

      const badBasic = Buffer.from('shopshop:wrong', 'utf8').toString('base64')
      const resBad = await app.inject({
        method: 'POST',
        url: '/webhooks/doordash',
        headers: {
          'content-type': 'application/json',
          authorization: `Basic ${badBasic}`,
        },
        payload: payloadStr,
      })
      expect(resBad.statusCode).toBe(401)
    } finally {
      restoreDoorDashEnv(envSnap)
    }
  })
})
