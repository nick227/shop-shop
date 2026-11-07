import Fastify from 'fastify'
import { describe, expect, it, vi } from 'vitest'
const locate = vi.hoisted(() => vi.fn())
vi.mock('../commerce/addressProvider.js', () => ({ addressProvider: () => ({ locate }) }))
vi.mock('@packages/db', () => ({ prisma: {}, ensureGazetteer: vi.fn(), backfillStorePlaces: vi.fn(), lookupPostalCode: vi.fn(), createEnhancedGeocodingService: vi.fn() }))
vi.mock('../env.js', () => ({ env: {} }))
import { geocodingRoutes } from './geocoding.route.js'

describe('store address location', () => {
  it.each([
    [{ lat: 30, lng: -97, precision: 'address' }, 200],
    [{ lat: 30, lng: -97, precision: 'postal' }, 404],
    [null, 404],
  ])('only returns street-level locations (%j)', async (position, status) => {
    locate.mockResolvedValue(position)
    const app = Fastify()
    await app.register(geocodingRoutes)
    const response = await app.inject('/geocode/locate?line1=100%20Main&city=Austin&state=TX&postalCode=78701')
    expect(response.statusCode).toBe(status)
    await app.close()
  })
  it('requires a complete address', async () => {
    const app = Fastify()
    await app.register(geocodingRoutes)
    expect((await app.inject('/geocode/locate?city=Austin')).statusCode).toBe(400)
    await app.close()
  })
})
