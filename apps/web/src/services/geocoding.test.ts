import { afterEach, describe, expect, it, vi } from 'vitest'
import { geocodeZip, ZipLookupUnavailableError } from './geocoding'

const respond = (status: number, body: unknown) => vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(body), { status }))

describe('geocodeZip', () => {
  afterEach(() => vi.restoreAllMocks())

  it('resolves a known ZIP', async () => {
    respond(200, { latitude: 30.387, longitude: -97.7055, city: 'Austin', state: 'TX', zip: '78758', displayName: 'Austin, TX 78758' })
    await expect(geocodeZip('78758')).resolves.toMatchObject({ city: 'Austin', zip: '78758' })
  })

  it('reports a ZIP that does not exist as not found', async () => {
    respond(404, { message: 'ZIP code 00000 not found' })
    await expect(geocodeZip('00000')).resolves.toBeUndefined()
  })

  it('does not report a lookup outage as a bad ZIP', async () => {
    respond(503, { message: 'ZIP lookup is unavailable right now' })
    await expect(geocodeZip('75758')).rejects.toBeInstanceOf(ZipLookupUnavailableError)
  })
})
