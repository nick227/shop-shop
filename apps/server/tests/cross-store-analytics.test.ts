import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { FastifyInstance } from 'fastify'
import { buildApp } from '../src/app'
import { prisma } from '@packages/db'

describe('Cross-Store Analytics Access', () => {
  let app: FastifyInstance
  let vendorAStoreId: string
  let vendorBStoreId: string
  let vendorAToken: string
  let vendorBToken: string

  beforeAll(async () => {
    app = await buildApp()

    // Create test users and stores
    const vendorA = await prisma.user.create({
      data: {
        email: 'vendor-a@test.com',
        role: 'VENDOR',
      }
    })

    const vendorB = await prisma.user.create({
      data: {
        email: 'vendor-b@test.com',
        role: 'VENDOR',
      }
    })

    // Create stores for each vendor
    const storeA = await prisma.store.create({
      data: {
        name: 'Vendor A Store',
        ownerUserId: vendorA.id,
        status: 'ACTIVE',
        isPublished: true,
      }
    })

    const storeB = await prisma.store.create({
      data: {
        name: 'Vendor B Store',
        ownerUserId: vendorB.id,
        status: 'ACTIVE',
        isPublished: true,
      }
    })

    vendorAStoreId = storeA.id
    vendorBStoreId = storeB.id

    // Mock JWT tokens for each vendor
    vendorAToken = 'mock-vendor-a-token'
    vendorBToken = 'mock-vendor-b-token'
  })

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['vendor-a@test.com', 'vendor-b@test.com']
        }
      }
    })
    await prisma.store.deleteMany({
      where: {
        id: {
          in: [vendorAStoreId, vendorBStoreId]
        }
      }
    })
    await prisma.$disconnect()
  })

  it('should allow Vendor A to access their own store analytics', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/api/items/analytics?storeId=${vendorAStoreId}&period=30d&sortBy=revenue&sortOrder=desc&limit=10`,
      headers: {
        authorization: `Bearer ${vendorAToken}`,
        'content-type': 'application/json'
      }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toHaveProperty('success', true)
  })

  it('should deny Vendor A access to Vendor B store analytics', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/api/items/analytics?storeId=${vendorBStoreId}&period=30d&sortBy=revenue&sortOrder=desc&limit=10`,
      headers: {
        authorization: `Bearer ${vendorAToken}`,
        'content-type': 'application/json'
      }
    })

    expect(response.statusCode).toBe(403)
    expect(response.json()).toHaveProperty('error', 'Forbidden')
    expect(response.json()).toHaveProperty('message', 'You cannot access analytics for this store')
  })

  it('should deny Vendor B access to Vendor A store analytics', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/api/items/analytics?storeId=${vendorAStoreId}&period=30d&sortBy=revenue&sortOrder=desc&limit=10`,
      headers: {
        authorization: `Bearer ${vendorBToken}`,
        'content-type': 'application/json'
      }
    })

    expect(response.statusCode).toBe(403)
    expect(response.json()).toHaveProperty('error', 'Forbidden')
    expect(response.json()).toHaveProperty('message', 'You cannot access analytics for this store')
  })

  it('should deny unauthenticated access to any store analytics', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/api/items/analytics?storeId=${vendorAStoreId}&period=30d&sortBy=revenue&sortOrder=desc&limit=10`,
      headers: {
        'content-type': 'application/json'
      }
    })

    expect(response.statusCode).toBe(401)
    expect(response.json()).toHaveProperty('error', 'Unauthorized')
  })
})
