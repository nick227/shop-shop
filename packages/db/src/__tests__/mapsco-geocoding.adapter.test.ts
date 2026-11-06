import { afterEach, describe, expect, it, vi } from 'vitest'
import axios from 'axios'
import { mapsCoResult, MapsCoGeocodingAdapter } from '../adapters/mapsco-geocoding.adapter'

const place = (postcode: string) => ({
  lat: '30.3810698',
  lon: '-97.7074236',
  display_name: `${postcode}, Austin, Travis County, Texas, United States`,
  address: { postcode, city: 'Austin', state: 'Texas', 'ISO3166-2-lvl4': 'US-TX', country_code: 'us' },
})

describe('maps.co adapter', () => {
  afterEach(() => vi.restoreAllMocks())

  it('maps Nominatim fields to the app shape: two-letter state and country, clean ZIP', () => {
    expect(mapsCoResult(place('787 58'), 'high')).toMatchObject({ latitude: 30.3810698, city: 'Austin', state: 'TX', zip: '78758', country: 'US' })
    expect(mapsCoResult({ lat: 'x', lon: '1' }, 'high')).toBeNull()
  })

  it('rejects a postcode search that drifted to a different ZIP', async () => {
    vi.spyOn(axios, 'get').mockResolvedValue({ data: [place('78757')] })
    await expect(new MapsCoGeocodingAdapter('k').geocodeZipCode('78758')).resolves.toBeNull()
  })

  it('reverse geocodes into address fields', async () => {
    vi.spyOn(axios, 'get').mockResolvedValue({ data: { ...place('78758'), address: { ...place('78758').address, house_number: '10003', road: 'Chukar Circle' } } })
    await expect(new MapsCoGeocodingAdapter('k').reverse(30.37, -97.7)).resolves.toEqual({ line1: '10003 Chukar Circle', city: 'Austin', state: 'TX', postalCode: '78758', country: 'US' })
  })
})
