import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import Fastify from 'fastify'
import { itemAnalyticsRoutes } from './item-analytics.route.js'
import {
  createAuthenticatedUser,
  createTestStore,
  createTestItem,
  cleanupTestData,
} from '../__tests__/helpers.js'

describe('GET /api/items/analytics', () => {
  const app = Fastify({ logger: false })
  let storeId: string
  let token: string

  beforeAll(async () => {
    await app.register(itemAnalyticsRoutes)
    await app.ready()

    const vendor = await createAuthenticatedUser('VENDOR')
    token = vendor.token
    const store = await createTestStore(vendor.id)
    storeId = store.id
    await createTestItem(storeId, { title: 'Analytics Test Item', price: '9.99' })
  })

  afterAll(async () => {
    await cleanupTestData()
    await app.close()
  })

  it('returns 200 with success payload for valid query', async () => {
    const qs = new URLSearchParams({
      storeId,
      period: '30d',
      sortBy: 'revenue',
      sortOrder: 'desc',
      limit: '100',
    })
    const response = await app.inject({
      method: 'GET',
      url: `/api/items/analytics?${qs.toString()}`,
      headers: {
        authorization: `Bearer ${token}`,
      },
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body) as {
      success: boolean
      data: { items: unknown[]; summary: Record<string, number>; meta: Record<string, unknown> }
    }
    expect(body.success).toBe(true)
    expect(Array.isArray(body.data.items)).toBe(true)
    expect(body.data.summary).toMatchObject({
      totalItems: expect.any(Number),
      activeItems: expect.any(Number),
    })
    expect(body.data.meta.sortBy).toBe('revenue')
  })
})
