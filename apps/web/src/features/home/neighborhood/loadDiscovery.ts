import { apiClient } from '@api/client'
import { items, stores } from '@api/apiWrapper'
import type { ItemResponse, RiverPost, StoreWithDistance } from '@api/types'
import { mapFeedItemToRiverPost, type RiverFeedItemWire } from '@/features/river/mapFeedItemToRiverPost'
import type { LocationData } from '@shared/types'
import { HOME_RADIUS_MILES } from '../shell/placeMemory'

export function apiOrigin(): string {
  const raw = import.meta.env.VITE_API_URL
  if (raw) return String(raw).replace(/\/$/, '').replace(/\/api$/i, '')
  return import.meta.env.DEV ? '' : 'http://localhost:3005'
}

export async function loadStores(location: LocationData) {
  const envelope = await stores.listPage({
    page: '1',
    limit: '24',
    isPublished: 'true',
    latitude: location.latitude,
    longitude: location.longitude,
    radiusMiles: HOME_RADIUS_MILES,
  })
  return envelope.data as unknown as StoreWithDistance[]
}

export async function loadProducts(location: LocationData) {
  const envelope = await items.listPage({
    limit: '48',
    page: '1',
    latitude: location.latitude,
    longitude: location.longitude,
    radiusMiles: HOME_RADIUS_MILES,
  })
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
