/**
 * geocode.maps.co adapter (OpenStreetMap / Nominatim data). Used as the fallback when the primary
 * Positionstack lookup fails or finds nothing. Same result shape as the Positionstack adapter.
 */
import axios from 'axios'
import { cleanPostalCode, countryIso2, type GeocodingResult } from './geocoding.adapter.js'

export const MAPSCO_BASE_URL = 'https://geocode.maps.co'

interface MapsCoAddress {
  readonly house_number?: string
  readonly road?: string
  readonly city?: string
  readonly town?: string
  readonly village?: string
  readonly hamlet?: string
  readonly state?: string
  readonly 'ISO3166-2-lvl4'?: string
  readonly postcode?: string
  readonly country_code?: string
}

interface MapsCoPlace {
  readonly lat: string
  readonly lon: string
  readonly display_name?: string
  readonly importance?: number
  readonly address?: MapsCoAddress
}

/** Nominatim names the state ("Texas"); the two-letter code is in the ISO 3166-2 subdivision ("US-TX"). */
function stateCode(address: MapsCoAddress | undefined): string | undefined {
  const iso = address?.['ISO3166-2-lvl4']
  const code = iso?.split('-')[1]
  return code && code.length === 2 ? code.toUpperCase() : undefined
}

export function mapsCoResult(place: MapsCoPlace, confidence: GeocodingResult['confidence']): GeocodingResult | null {
  const latitude = Number(place.lat)
  const longitude = Number(place.lon)
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null
  const address = place.address
  return {
    latitude,
    longitude,
    confidence,
    formattedAddress: place.display_name ?? '',
    city: address?.city ?? address?.town ?? address?.village ?? address?.hamlet,
    state: stateCode(address),
    zip: cleanPostalCode(address?.postcode),
    country: countryIso2(address?.country_code),
  }
}

export interface MapsCoReverse {
  readonly line1?: string
  readonly city?: string
  readonly state?: string
  readonly postalCode?: string
  readonly country?: string
}

export class MapsCoGeocodingAdapter {
  constructor(private readonly apiKey: string, private readonly baseUrl: string = MAPSCO_BASE_URL) {}

  private async search(params: Record<string, string>): Promise<MapsCoPlace | undefined> {
    const response = await axios.get<MapsCoPlace[]>(`${this.baseUrl}/search`, {
      params: { ...params, format: 'json', addressdetails: '1', limit: '1', api_key: this.apiKey },
      timeout: 10000,
    })
    return Array.isArray(response.data) ? response.data[0] : undefined
  }

  async geocodeZipCode(zip: string, country: string = 'US'): Promise<GeocodingResult | null> {
    const place = await this.search({ postalcode: zip, country })
    if (!place) return null
    const result = mapsCoResult(place, 'high')
    // A postcode search can drift to a nearby code; only accept the ZIP that was asked for.
    return result && (!result.zip || result.zip === zip) ? { ...result, zip } : null
  }

  async geocodeCityState(city: string, state: string, country: string = 'US'): Promise<GeocodingResult | null> {
    const place = await this.search({ city, state, country })
    return place ? mapsCoResult(place, 'medium') : null
  }

  async geocodeAddress(address: string): Promise<GeocodingResult | null> {
    const place = await this.search({ q: address, countrycodes: 'us' })
    return place ? mapsCoResult(place, place.address?.house_number ? 'high' : 'medium') : null
  }

  async reverse(latitude: number, longitude: number): Promise<MapsCoReverse | null> {
    const response = await axios.get<MapsCoPlace & { error?: string }>(`${this.baseUrl}/reverse`, {
      params: { lat: String(latitude), lon: String(longitude), format: 'json', api_key: this.apiKey },
      timeout: 10000,
    })
    const place = response.data
    if (!place || place.error || !place.address) return null
    const address = place.address
    return {
      line1: address.road ? [address.house_number, address.road].filter(Boolean).join(' ') : undefined,
      city: address.city ?? address.town ?? address.village ?? address.hamlet,
      state: stateCode(address),
      postalCode: cleanPostalCode(address.postcode),
      country: countryIso2(address.country_code),
    }
  }
}
