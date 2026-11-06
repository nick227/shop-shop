import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import axios from 'axios'

// The adapter is a process-wide singleton, so each case loads a fresh copy of the module.
async function freshAdapter() {
  return import('../adapters/geocoding.adapter')
}

describe('Positionstack host', () => {
  beforeEach(() => vi.resetModules())
  afterEach(() => vi.restoreAllMocks())

  it('calls the APILayer host by default, which APILayer-issued keys require', async () => {
    const get = vi.spyOn(axios, 'get').mockResolvedValue({ data: { data: [] } })
    const { createGeocodingAdapter, POSITIONSTACK_BASE_URL } = await freshAdapter()
    await createGeocodingAdapter({ apiKey: 'k' }).geocodeZipCode('78758')
    expect(POSITIONSTACK_BASE_URL).toBe('https://api.apilayer.net/positionstack/v1')
    expect(get.mock.calls[0]?.[0]).toBe('https://api.apilayer.net/positionstack/v1/forward')
  })

  it('honours an explicit base URL for a legacy key', async () => {
    const get = vi.spyOn(axios, 'get').mockResolvedValue({ data: { data: [] } })
    const { createGeocodingAdapter } = await freshAdapter()
    await createGeocodingAdapter({ apiKey: 'k', baseUrl: 'http://api.positionstack.com/v1/' }).geocodeZipCode('78758')
    expect(get.mock.calls[0]?.[0]).toBe('http://api.positionstack.com/v1/forward')
  })
})

describe('Positionstack field cleanup', () => {
  it('stores two-letter countries and unsplit ZIPs', async () => {
    const { countryIso2, cleanPostalCode } = await import('../adapters/geocoding.adapter')
    expect(countryIso2('USA')).toBe('US')
    expect(countryIso2('us')).toBe('US')
    expect(countryIso2('ZZZ')).toBeUndefined()
    expect(cleanPostalCode('787 58')).toBe('78758')
    expect(cleanPostalCode('  ')).toBeUndefined()
  })
})
