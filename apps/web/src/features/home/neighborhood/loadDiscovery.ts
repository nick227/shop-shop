import { apiClient } from '@api/client'
import { items, stores } from '@api/apiWrapper'
import type { ItemResponse, RiverPost, StoreWithDistance } from '@api/types'
import { mapFeedItemToRiverPost, type RiverFeedItemWire } from '@/features/river/mapFeedItemToRiverPost'
import type { LocationData } from '@shared/types'
import { HOME_RADIUS_MILES } from '../shell/placeMemory'
import type { NeighborhoodCard } from './neighborhoodHero'

export type PublishedNeighborhoodRow = NeighborhoodCard & {
  readonly city?: { readonly name: string; readonly state: string | null } | null
  readonly postalCodes?: readonly string[]
}

export function apiOrigin(): string {
  const raw = import.meta.env.VITE_API_URL
  if (raw) return String(raw).replace(/\/$/, '').replace(/\/api$/i, '')
  return import.meta.env.DEV ? '' : 'http://localhost:3005'
}

export async function loadStores(location?: LocationData) {
  const envelope = await stores.listPage(
    location
      ? {
          page: '1',
          limit: '24',
          isPublished: 'true',
          latitude: location.latitude,
          longitude: location.longitude,
          radiusMiles: HOME_RADIUS_MILES,
        }
      : {
          page: '1',
          limit: '24',
          isPublished: 'true',
        },
  )
  return envelope.data as unknown as StoreWithDistance[]
}

export async function loadProducts(location?: LocationData) {
  const envelope = await items.listPage(
    location
      ? {
          limit: '48',
          page: '1',
          latitude: location.latitude,
          longitude: location.longitude,
          radiusMiles: HOME_RADIUS_MILES,
        }
      : {
          limit: '48',
          page: '1',
        },
  )
  return envelope.data as unknown as ItemResponse[]
}

export async function loadStories(location: LocationData | undefined) {
  const page = await apiClient.river.getFeed({
    limit: 8,
    allowEmptyMedia: false,
    near: location
      ? { lat: location.latitude, lng: location.longitude, radiusMiles: HOME_RADIUS_MILES }
      : undefined,
  })
  return (page.items ?? []).map((row) => mapFeedItemToRiverPost(row as RiverFeedItemWire))
}

export async function loadNeighborhoodsByZip(zip: string): Promise<NeighborhoodCard[]> {
  const response = await fetch(`${apiOrigin()}/api/places/by-zip/${zip}`)
  const byZip = response.ok
    ? ((await response.json() as { neighborhoods?: NeighborhoodCard[] }).neighborhoods ?? [])
    : []
  if (byZip.length >= 4) return byZip
  const published = await loadPublishedNeighborhoods()
  const seen = new Set(byZip.map((area) => area.slug))
  const combined = [...byZip]
  for (const area of published) {
    if (seen.has(area.slug)) continue
    seen.add(area.slug)
    combined.push(area)
    if (combined.length >= 4) break
  }
  return combined
}

export async function loadPublishedNeighborhoods(q = ''): Promise<PublishedNeighborhoodRow[]> {
  const params = q ? `?q=${encodeURIComponent(q)}` : ''
  const response = await fetch(`${apiOrigin()}/api/places/neighborhoods${params}`)
  if (!response.ok) return []
  const body = await response.json() as { neighborhoods?: PublishedNeighborhoodRow[] }
  return body.neighborhoods ?? []
}
