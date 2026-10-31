import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { apiClient } from '@api/client'
import { items, stores } from '@api/apiWrapper'
import type { ItemResponse, RiverPost, StoreWithDistance } from '@api/types'
import { mapFeedItemToRiverPost, type RiverFeedItemWire } from '@/features/river/mapFeedItemToRiverPost'
import { useUrlLocation } from '@shared/hooks/hooks/useUrlLocation'
import type { LocationData } from '@shared/types'

async function loadStores(location: LocationData | undefined) {
  const envelope = await stores.listPage({
    page: '1',
    limit: '12',
    isPublished: 'true',
    latitude: location?.latitude,
    longitude: location?.longitude,
    radiusMiles: location?.radiusMiles,
  })
  return envelope.data as unknown as StoreWithDistance[]
}

async function loadProducts() {
  const fetchLimit = 48
  const envelope = await items.listPage({ limit: String(fetchLimit), page: '1' })
  return envelope.data as unknown as ItemResponse[]
}

async function loadStories(location: LocationData | undefined) {
  const page = await apiClient.river.getFeed({
    limit: 8,
    allowEmptyMedia: false,
    near: location
      ? { lat: location.latitude, lng: location.longitude, radiusMiles: location.radiusMiles }
      : undefined,
  })
  return (page.items ?? []).map((row) => mapFeedItemToRiverPost(row as RiverFeedItemWire))
}

export function useNeighborhoodData() {
  const [params] = useSearchParams()
  const { location, urlLocationNotice } = useUrlLocation()
  const waitingForZip = Boolean(params.get('zip')) && !location && !urlLocationNotice

  const storeQuery = useQuery({
    queryKey: ['home-stores', location?.latitude, location?.longitude, location?.radiusMiles],
    enabled: !waitingForZip,
    queryFn: () => loadStores(location),
  })

  const productQuery = useQuery({
    queryKey: ['home-products'],
    queryFn: loadProducts,
    staleTime: 5 * 60 * 1000,
  })

  const storyQuery = useQuery<RiverPost[]>({
    queryKey: ['home-stories', location?.latitude, location?.longitude, location?.radiusMiles],
    enabled: !waitingForZip,
    queryFn: () => loadStories(location),
  })

  return {
    location,
    notice: urlLocationNotice,
    waitingForZip,
    stores: storeQuery.data ?? [],
    products: productQuery.data ?? [],
    stories: storyQuery.data ?? [],
    storesLoading: storeQuery.isLoading || waitingForZip,
    productsLoading: productQuery.isLoading,
  }
}
