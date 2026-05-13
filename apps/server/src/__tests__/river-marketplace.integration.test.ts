/**
 * River posting + public marketplace discovery (official store slug excluded from search; River unchanged).
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { prisma } from '@packages/db'

/** Must match `OFFICIAL_PLATFORM_STORE_SLUG` in `@packages/db` (avoid dist resolution gaps in Vitest). */
const OFFICIAL_SLUG = 'official' as const
import { createApp } from '../index'
import {
  authHeaders,
  cleanupTestData,
  createAuthenticatedUser,
  createTestStore,
  TEST_NAMESPACE,
} from './helpers'

const RIVER_TEST_PREFIX = '[river-test]'

const POSTS_PATH = '/api/v1/river/posts'

function postCreatePayload(storeId: string, content: string) {
  return {
    storeId,
    content,
    mediaUrls: [] as [],
    source: 'MANUAL' as const,
  }
}

async function getOrCreateOfficialStoreId(ownerUserId: string): Promise<string> {
  const existing = await prisma.store.findUnique({
    where: { slug: OFFICIAL_SLUG },
    select: { id: true },
  })
  if (existing) return existing.id
  const created = await prisma.store.create({
    data: {
      ownerUserId,
      name: 'Shop Shop',
      slug: OFFICIAL_SLUG,
      description: 'editorial',
      storeType: 'OTHER',
      isPublished: true,
      status: 'ACTIVE',
      deliveryEnabled: false,
      pickupEnabled: false,
      prepTimeMin: 15,
    },
    select: { id: true },
  })
  return created.id
}

describe('River posts & marketplace (official store)', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = await createApp()
  })

  beforeEach(async () => {
    await prisma.post.deleteMany({
      where: { content: { startsWith: RIVER_TEST_PREFIX } },
    })
    await cleanupTestData()
  })

  afterAll(async () => {
    await prisma.post.deleteMany({
      where: { content: { startsWith: RIVER_TEST_PREFIX } },
    })
    await cleanupTestData()
    // Do not app.close() — createApp() returns the module singleton shared across integration tests.
  })

  describe('POST /api/v1/river/posts', () => {
    it('allows ADMIN to create a post for the official platform store', async () => {
      const admin = await createAuthenticatedUser('ADMIN')
      const officialId = await getOrCreateOfficialStoreId(admin.id)
      const content = `${RIVER_TEST_PREFIX} admin-official`

      const res = await app.inject({
        method: 'POST',
        url: POSTS_PATH,
        headers: {
          ...authHeaders(admin.token),
          'content-type': 'application/json',
        },
        payload: postCreatePayload(officialId, content),
      })

      expect(res.statusCode).toBe(201)
      const body = JSON.parse(res.payload) as { storeId: string }
      expect(body.storeId).toBe(officialId)
    })

    it('allows ADMIN to create a post for any vendor store', async () => {
      const admin = await createAuthenticatedUser('ADMIN')
      const vendor = await createAuthenticatedUser('VENDOR')
      const store = await createTestStore(vendor.id)
      const content = `${RIVER_TEST_PREFIX} admin-vendor-store`

      const res = await app.inject({
        method: 'POST',
        url: POSTS_PATH,
        headers: {
          ...authHeaders(admin.token),
          'content-type': 'application/json',
        },
        payload: postCreatePayload(store.id, content),
      })

      expect(res.statusCode).toBe(201)
    })

    it('allows VENDOR to create a post only for their own store', async () => {
      const vendor = await createAuthenticatedUser('VENDOR')
      const store = await createTestStore(vendor.id)
      const content = `${RIVER_TEST_PREFIX} vendor-own`

      const res = await app.inject({
        method: 'POST',
        url: POSTS_PATH,
        headers: {
          ...authHeaders(vendor.token),
          'content-type': 'application/json',
        },
        payload: postCreatePayload(store.id, content),
      })

      expect(res.statusCode).toBe(201)
    })

    it('allows STAFF with team content access to create a post for that store', async () => {
      const staff = await createAuthenticatedUser('STAFF')
      const vendor = await createAuthenticatedUser('VENDOR')
      const store = await createTestStore(vendor.id)
      await prisma.teamMember.create({
        data: {
          storeId: store.id,
          userId: staff.id,
          permissionsJson: ['FULL_ACCESS'],
          isActive: true,
        },
      })

      const res = await app.inject({
        method: 'POST',
        url: POSTS_PATH,
        headers: {
          ...authHeaders(staff.token),
          'content-type': 'application/json',
        },
        payload: postCreatePayload(store.id, `${RIVER_TEST_PREFIX} staff-team`),
      })

      expect(res.statusCode).toBe(201)
    })

    it('returns 403 when VENDOR posts to a store they do not manage', async () => {
      const vendorA = await createAuthenticatedUser('VENDOR')
      const vendorB = await createAuthenticatedUser('VENDOR')
      const storeB = await createTestStore(vendorB.id)

      const res = await app.inject({
        method: 'POST',
        url: POSTS_PATH,
        headers: {
          ...authHeaders(vendorA.token),
          'content-type': 'application/json',
        },
        payload: postCreatePayload(storeB.id, `${RIVER_TEST_PREFIX} vendor-cross`),
      })

      expect(res.statusCode).toBe(403)
    })
  })

  describe('Public marketplace search', () => {
    it('excludes the official store slug from unified store search results', async () => {
      const admin = await createAuthenticatedUser('ADMIN')
      const officialId = await getOrCreateOfficialStoreId(admin.id)
      const mark = `${TEST_NAMESPACE}-mkt-official-${Date.now()}`
      await prisma.store.update({
        where: { id: officialId },
        data: {
          description: mark,
          isPublished: true,
          addressCity: 'Testville',
          addressState: 'TX',
          addressZip: '78701',
        },
      })

      const vendor = await createAuthenticatedUser('VENDOR')
      const vendorStore = await createTestStore(vendor.id, {
        name: `${mark} Vendor Store`,
        isPublished: true,
      })
      await prisma.store.update({
        where: { id: vendorStore.id },
        data: { imageUrl: `https://example.com/${TEST_NAMESPACE}-marketplace-vendor.jpg` },
      })

      const res = await app.inject({
        method: 'GET',
        url: `/api/search/unified?q=${encodeURIComponent(mark)}`,
      })
      expect(res.statusCode).toBe(200)
      const data = JSON.parse(res.payload) as {
        sections: { stores: { results: Array<{ id: string }> } }
      }
      const ids = data.sections.stores.results.map((s) => s.id)
      expect(ids.includes(officialId)).toBe(false)
      expect(ids.includes(vendorStore.id)).toBe(true)
    })
  })

  describe('River visibility', () => {
    it('still lists official store posts on GET /api/v1/river/posts', async () => {
      const admin = await createAuthenticatedUser('ADMIN')
      const officialId = await getOrCreateOfficialStoreId(admin.id)
      const content = `${RIVER_TEST_PREFIX} river-visible`

      const createRes = await app.inject({
        method: 'POST',
        url: POSTS_PATH,
        headers: {
          ...authHeaders(admin.token),
          'content-type': 'application/json',
        },
        payload: postCreatePayload(officialId, content),
      })
      expect(createRes.statusCode).toBe(201)

      const listRes = await app.inject({
        method: 'GET',
        url: `/api/v1/river/posts?storeId=${officialId}&page=1&limit=20`,
      })
      expect(listRes.statusCode).toBe(200)
      const listBody = JSON.parse(listRes.payload) as {
        data: Array<{ content?: string | null }>
        total: number
      }
      expect(listBody.total).toBeGreaterThanOrEqual(1)
      expect(listBody.data.some((row) => row.content === content)).toBe(true)
    })
  })
})
