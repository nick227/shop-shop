import { randomUUID } from 'crypto'
import Fastify from 'fastify'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { prisma } from '@packages/db'
import { geocodingRoutes } from './geocoding.route.js'

// 99999 is not a real ZIP (GeoNames has no row for it), so this fixture never collides with imported data.
const FIXTURE_ZIP = '99999'

describe('GET /geocode/zip with the national ZIP reference', () => {
  const app = Fastify({ logger: false })
  const datasetId = randomUUID()

  beforeAll(async () => {
    await prisma.referenceDataset.create({
      data: { id: datasetId, name: 'test-zip-fixture', source: 'test', sourceUrl: 'https://example.test', sourceDate: new Date(), checksum: datasetId.replace(/-/g, '').padEnd(64, '0'), license: 'test', attribution: 'test', recordCount: 1, skippedCount: 0 },
    })
    // Alaska: outside the lower-48 box the route used to require.
    await prisma.zipReference.create({
      data: { zip: FIXTURE_ZIP, city: 'Fixture Harbor', state: 'AK', latitude: '55.34220000', longitude: '-131.64780000', accuracy: 4, source: 'test', sourceDate: new Date(), datasetId },
    })
    await app.register(geocodingRoutes)
    await app.ready()
  })

  afterAll(async () => {
    await prisma.zipReference.deleteMany({ where: { datasetId } })
    await prisma.referenceDataset.deleteMany({ where: { id: datasetId } })
    await app.close()
  })

  it('answers an Alaska ZIP from local reference data instead of rejecting it as foreign', async () => {
    const response = await app.inject({ method: 'GET', url: `/geocode/zip?zip=${FIXTURE_ZIP}` })
    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body)).toMatchObject({ city: 'Fixture Harbor', state: 'AK', zip: FIXTURE_ZIP, latitude: 55.3422 })
  })

  it('still answers served Austin ZIPs from the place directory', async () => {
    const response = await app.inject({ method: 'GET', url: '/geocode/zip?zip=78758' })
    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body)).toMatchObject({ city: 'Austin', state: 'TX', zip: '78758' })
  })

  it('rejects a malformed ZIP before any lookup', async () => {
    const response = await app.inject({ method: 'GET', url: '/geocode/zip?zip=7875' })
    expect(response.statusCode).toBe(400)
  })
})
