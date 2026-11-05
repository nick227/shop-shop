import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import Fastify from 'fastify'
import { prisma } from '@packages/db'
import { createAuthenticatedUser, type TestUser } from '../__tests__/helpers.js'
import type { ListingCandidate, ListingSource } from '../directory/types.js'
import { adminBusinessImportRoutes } from './admin-business-imports.route.js'
import { directoryRoutes } from './directory.route.js'

const franklin: ListingCandidate = {
  source: 'osm',
  sourceId: 'way/test-franklin',
  name: 'Franklin Barbecue',
  category: 'RESTAURANT',
  categoryLabel: 'Restaurant',
  street: '900 East 11th Street',
  city: 'Austin',
  state: 'TX',
  zip: '78702',
  latitude: 30.2701634,
  longitude: -97.7312704,
  phone: '+1-512-653-1187',
  website: 'http://franklinbarbecue.com/',
  description: null,
  evidence: ['coordinates', 'street address', 'phone', 'website'],
}

const source: ListingSource = {
  async search(names) {
    return names.some((name) => name.toLowerCase().includes('franklin')) ? [franklin] : []
  },
}

describe('business directory import', () => {
  const app = Fastify({ logger: false })
  let admin: TestUser

  beforeAll(async () => {
    admin = await createAuthenticatedUser('ADMIN')
    await app.register(adminBusinessImportRoutes(source), { prefix: '/api' })
    await app.register(directoryRoutes, { prefix: '/api' })
    await app.ready()
  })

  afterAll(async () => {
    await prisma.businessImportEntry.deleteMany({ where: { submittedName: { in: ['Franklin Barbecue', 'Missing Cafe'] } } })
    await prisma.businessListing.deleteMany({ where: { sourceId: franklin.sourceId } })
    await prisma.businessImportBatch.deleteMany({ where: { adminId: admin.id } })
    await prisma.user.delete({ where: { id: admin.id } })
    await app.close()
  })

  it('publishes one strong match and leaves an unknown name unpublished', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/api/admin/business-imports',
      headers: { authorization: `Bearer ${admin.token}`, 'content-type': 'application/json' },
      payload: { names: ['Franklin Barbecue', 'Missing Cafe'] },
    })
    expect(created.statusCode).toBe(201)
    const batch = JSON.parse(created.body) as { id: string; entries: Array<{ id: string; submittedName: string; status: string }> }
    const ready = batch.entries.find((entry) => entry.submittedName === 'Franklin Barbecue')
    const missing = batch.entries.find((entry) => entry.submittedName === 'Missing Cafe')
    expect(ready?.status).toBe('READY')
    expect(missing?.status).toBe('NOT_FOUND')

    const published = await app.inject({
      method: 'POST',
      url: `/api/admin/business-imports/${batch.id}/publish`,
      headers: { authorization: `Bearer ${admin.token}`, 'content-type': 'application/json' },
      payload: { entryIds: [ready?.id] },
    })
    expect(published.statusCode).toBe(200)

    const nearby = await app.inject({ method: 'GET', url: '/api/directory?latitude=30.27&longitude=-97.73&radiusMiles=2' })
    const listings = JSON.parse(nearby.body) as { listings: Array<{ name: string; orderable: boolean; attribution: string }> }
    expect(listings.listings).toEqual([expect.objectContaining({ name: 'Franklin Barbecue', orderable: false, attribution: '© OpenStreetMap contributors' })])

    const again = await app.inject({
      method: 'POST',
      url: '/api/admin/business-imports',
      headers: { authorization: `Bearer ${admin.token}`, 'content-type': 'application/json' },
      payload: { names: ['Franklin Barbecue'] },
    })
    const second = JSON.parse(again.body) as { entries: Array<{ status: string }> }
    expect(second.entries[0]?.status).toBe('EXISTING')
  })
})