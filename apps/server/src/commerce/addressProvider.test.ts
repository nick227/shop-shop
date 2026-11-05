/**
 * Address providers: Mapbox suggestions and positions are mapped faithfully, a weak or mismatched match
 * is never called precise, and a ZIP center never stands in for an exact address in production.
 */
import { describe, it, expect, vi } from 'vitest'
import { addressProvider, approximateDeliveryAllowed, mapboxProvider } from './addressProvider.js'

const feature = (overrides: Record<string, unknown> = {}) => ({
  properties: {
    mapbox_id: 'addr.1',
    feature_type: 'address',
    full_address: '4500 Duval Street, Austin, Texas 78751, United States',
    name: '4500 Duval Street',
    coordinates: { latitude: 30.3121, longitude: -97.7263, accuracy: 'rooftop' },
    context: { address: { name: '4500 Duval Street' }, postcode: { name: '78751' }, place: { name: 'Austin' }, region: { region_code: 'TX' } },
    ...overrides,
  },
})
const respond = (features: unknown[]) => vi.fn(async (_url: string) => ({ ok: true, json: async () => ({ features }) }))
const HOME = { line1: '4500 Duval St', city: 'Austin', state: 'TX', postalCode: '78751' }

describe('Mapbox address provider', () => {
  it('suggests full US street addresses near the store', async () => {
    const fetcher = respond([feature()])
    const suggestions = await mapboxProvider('pk.test', fetcher).suggest('4500 duv', { lat: 30.31, lng: -97.72 })
    expect(suggestions).toEqual([
      { id: 'addr.1', label: '4500 Duval Street, Austin, Texas 78751, United States', line1: '4500 Duval Street', city: 'Austin', state: 'TX', postalCode: '78751' },
    ])
    const url = new URL(fetcher.mock.calls[0][0])
    expect(url.searchParams.get('autocomplete')).toBe('true')
    expect(url.searchParams.get('proximity')).toBe('-97.72,30.31')
    expect(url.searchParams.get('country')).toBe('us')
  })

  it('calls a rooftop match precise and anything weaker not', async () => {
    expect(await mapboxProvider('pk.test', respond([feature()])).locate(HOME)).toEqual({ lat: 30.3121, lng: -97.7263, precision: 'address' })
    const approximate = feature({ coordinates: { latitude: 30.31, longitude: -97.72, accuracy: 'approximate' } })
    expect((await mapboxProvider('pk.test', respond([approximate])).locate(HOME))?.precision).toBe('street')
  })

  it('never accepts a match in a different ZIP as the typed address', async () => {
    const elsewhere = feature({ context: { postcode: { name: '78701' }, place: { name: 'Austin' }, region: { region_code: 'TX' } } })
    const located = await mapboxProvider('pk.test', respond([elsewhere])).locate(HOME)
    expect(located?.precision).toBe('postal')
  })
})

describe('provider selection and policy', () => {
  it('uses Mapbox when configured, and only the ZIP center when nothing is', () => {
    expect(addressProvider({ MAPBOX_ACCESS_TOKEN: 'pk.abc' } as NodeJS.ProcessEnv).name).toBe('mapbox')
    expect(addressProvider({ GEOCODING_API_KEY: 'your_geocoding_key' } as NodeJS.ProcessEnv).name).toBe('postal')
  })

  it('decides delivery from a ZIP center only outside production, unless told otherwise', () => {
    expect(approximateDeliveryAllowed({ NODE_ENV: 'production' } as NodeJS.ProcessEnv)).toBe(false)
    expect(approximateDeliveryAllowed({ NODE_ENV: 'development' } as NodeJS.ProcessEnv)).toBe(true)
    expect(approximateDeliveryAllowed({ NODE_ENV: 'development', ALLOW_APPROXIMATE_DELIVERY: 'false' } as NodeJS.ProcessEnv)).toBe(false)
  })
})
