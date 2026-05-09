import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest'
import { prisma, getDeliveryProviderAdapter, dispatchOrderDelivery } from '@packages/db'
import {
  cleanupTestData,
  createAuthenticatedUser,
  createTestOrder,
  createTestStore,
} from './helpers.js'

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

describe('Delivery dispatch lifecycle (quote → READY → dispatch → job)', () => {
  let vendor: Awaited<ReturnType<typeof createAuthenticatedUser>>
  let storeId: string

  beforeAll(async () => {
    await ensureDeliveryJobTable()
  })

  beforeEach(async () => {
    vendor = await createAuthenticatedUser('VENDOR', { phone: '+15555550100' })
    const created = await createTestStore(vendor.id)
    await prisma.store.update({
      where: { id: created.id },
      data: { phone: '+15555550101' },
    })
    storeId = created.id
  })

  afterAll(async () => {
    await cleanupTestData()
  })

  it('adapter quote then dispatchOrderDelivery persists providerExternalId + trackingUrl', async () => {
    const order = await createTestOrder(vendor.id, storeId, { status: 'READY', paymentStatus: 'PAID' })
    await prisma.order.update({
      where: { id: order.id },
      data: {
        deliveryMode: 'THIRD_PARTY_PROVIDER',
        addressSnapshot: {
          line1: '100 Delivery St',
          city: 'Los Angeles',
          state: 'CA',
          postalCode: '90001',
        },
      },
    })

    const adapter = getDeliveryProviderAdapter('DOORDASH_DRIVE')
    const quote = await adapter.quoteDelivery({
      orderId: order.id,
      storeId,
      dropoffLatitude: 34.0522,
      dropoffLongitude: -118.2437,
    })
    expect(quote.currency).toBe('USD')
    expect(quote.feeCents).toBe(599)

    const deliveryJob = await dispatchOrderDelivery({
      orderId: order.id,
      provider: 'DOORDASH_DRIVE',
      requestedByUserId: vendor.id,
    })

    expect(deliveryJob.status).toBe('DISPATCHED')
    expect(deliveryJob.providerExternalId).toBeTruthy()
    expect(deliveryJob.trackingUrl).toBeTruthy()

    const row = await prisma.deliveryJob.findUnique({
      where: { id: deliveryJob.id },
      select: {
        providerExternalId: true,
        trackingUrl: true,
        status: true,
        provider: true,
      },
    })
    expect(row?.provider).toBe('DOORDASH_DRIVE')
    expect(row?.status).toBe('DISPATCHED')
    expect(row?.providerExternalId).toBe(deliveryJob.providerExternalId)
    expect(row?.trackingUrl).toBe(deliveryJob.trackingUrl)
  })
})
