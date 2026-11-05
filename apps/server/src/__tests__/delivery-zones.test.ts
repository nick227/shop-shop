/**
 * Vendor delivery zones: shapes are validated before shoppers are judged by them, and the preview
 * answers with the same rules checkout uses.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import Fastify from 'fastify'
import { prisma } from '@packages/db'
import { deliveryZoneRoutes } from '../routes/delivery-zone.route.js'
import { optionalAuthenticate } from '../middleware/auth.js'
import { validateZonePolygon } from '../commerce/deliveryZones.js'
import { authHeaders, cleanupTestData, createAuthenticatedUser, createEnrolledVendor, createTestStore } from './helpers.js'

// Around 5300 N Lamar, Austin ([lng, lat]).
const square: [number, number][] = [
  [-97.735, 30.300],
  [-97.715, 30.300],
  [-97.715, 30.320],
  [-97.735, 30.320],
]

describe('validateZonePolygon', () => {
  it('closes an open ring and stores a GeoJSON Polygon', () => {
    const result = validateZonePolygon(square)
    expect('polygon' in result && result.polygon.coordinates[0]).toHaveLength(5)
  })
  it('rejects too few corners, crossing edges and points off the map', () => {
    expect(validateZonePolygon(square.slice(0, 2))).toEqual({ error: expect.stringMatching(/three corners/) })
    expect(validateZonePolygon([square[0], square[2], square[1], square[3]])).toEqual({ error: expect.stringMatching(/cross/) })
    expect(validateZonePolygon([[-200, 30], [-97, 30], [-97, 31]])).toEqual({ error: expect.stringMatching(/outside/) })
    expect(validateZonePolygon({ type: 'Point', coordinates: [1, 2] })).toEqual({ error: expect.any(String) })
  })
})

describe('delivery zone routes', () => {
  const app = Fastify({ logger: false })
  let vendor: Awaited<ReturnType<typeof createEnrolledVendor>>
  let other: Awaited<ReturnType<typeof createEnrolledVendor>>
  let storeId: string

  beforeAll(async () => {
    app.addHook('preHandler', optionalAuthenticate)
    await app.register(deliveryZoneRoutes, { prefix: '/api' })
    await app.ready()
    vendor = await createEnrolledVendor()
    other = await createEnrolledVendor()
    storeId = (await createTestStore(vendor.id, { isPublished: true })).id
    await prisma.store.update({
      where: { id: storeId },
      data: { deliveryEnabled: true, deliveryDistance: 0, deliveryCharge: 3, deliveryMinimum: 20, latitude: 30.31, longitude: -97.724 },
    })
  })

  afterAll(async () => {
    await cleanupTestData()
    await app.close()
  })

  const create = (token: string, payload: Record<string, unknown>) =>
    app.inject({ method: 'POST', url: '/api/delivery-zones', headers: authHeaders(token), payload: { storeId, ...payload } })

  it('saves a drawn zone with free delivery and no minimum', async () => {
    const response = await create(vendor.token, { name: 'Hyde Park', polygonJson: square, baseFee: 0, minOrder: null })
    expect(response.statusCode).toBe(201)
    const { zone } = response.json() as { zone: { id: string; polygonJson: { type: string }; baseFee: string } }
    expect(zone.polygonJson.type).toBe('Polygon')
    expect(Number(zone.baseFee)).toBe(0)
  })

  it('explains a shape that cannot be delivered to', async () => {
    const response = await create(vendor.token, { name: 'Bow tie', polygonJson: [square[0], square[2], square[1], square[3]], baseFee: 2 })
    expect(response.statusCode).toBe(400)
    expect(response.json().error).toMatch(/cross/)
  })

  it('keeps other vendors out', async () => {
    const response = await create(other.token, { name: 'Mine now', polygonJson: square, baseFee: 1 })
    expect(response.statusCode).toBe(403)
  })

  it('previews an address inside and outside the zone with checkout rules', async () => {
    const preview = (address: Record<string, string>, subtotal?: number) =>
      app.inject({ method: 'POST', url: `/api/stores/${storeId}/delivery-preview`, headers: authHeaders(vendor.token), payload: { address, subtotal } })
    // ZIP centers stand in for addresses in tests (no geocoding account); 78751 is inside, 78701 is not.
    const inside = await preview({ line1: '4500 Duval St', city: 'Austin', state: 'TX', postalCode: '78751' })
    expect(inside.statusCode).toBe(200)
    const insideBody = inside.json()
    expect(insideBody.destination).toMatchObject({ approximate: true })
    expect(insideBody.eligibility).toMatchObject({ available: true, fee: 0, zoneName: 'Hyde Park' })
    const outside = (await preview({ line1: '100 Congress Ave', city: 'Austin', state: 'TX', postalCode: '78701' })).json()
    expect(outside.eligibility.available).toBe(false)
    const blocked = await app.inject({ method: 'POST', url: `/api/stores/${storeId}/delivery-preview`, headers: authHeaders(other.token), payload: { address: {} } })
    expect(blocked.statusCode).toBe(403)
  })
})
