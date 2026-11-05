import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import type { RiverPost } from '@api/types'
import { useUrlLocation } from '@shared/hooks/hooks/useUrlLocation'
import { discoveryLocated } from './discoveryLocated'
import { type NeighborhoodCard } from './neighborhoodHero'
import {
  loadNeighborhoodsByZip,
  loadProducts,
  loadPublishedNeighborhoods,
  loadStores,
  loadStories,
} from './loadDiscovery'

export function useNeighborhoodData() {
  const [params] = useSearchParams()
  const { location, urlLocationNotice } = useUrlLocation()
  const zip = params.get('zip')
  const zipCode = (location?.zip || zip || '').replace(/\D/g, '').slice(0, 5)
  const located = discoveryLocated(Boolean(location))
  const waitingForZip = Boolean(zip) && !location && !urlLocationNotice
  const ready = located || (!zip && !waitingForZip)

  const storeQuery = useQuery({
    queryKey: ['home-stores', location?.latitude ?? 'all', location?.longitude ?? 'all', location?.radiusMiles ?? 'all'],
    enabled: ready,
    queryFn: () => loadStores(location),
  })

  const productQuery = useQuery({
    queryKey: ['home-products', location?.latitude ?? 'all', location?.longitude ?? 'all', location?.radiusMiles ?? 'all'],
    queryFn: () => loadProducts(location),
    enabled: ready,
    staleTime: 5 * 60 * 1000,
  })

  const neighborhoodQuery = useQuery<NeighborhoodCard[]>({
    queryKey: ['home-neighborhood', zipCode || 'published'],
    enabled: zipCode.length === 5 || (!zip && !waitingForZip),
    queryFn: () => (zipCode.length === 5 ? loadNeighborhoodsByZip(zipCode) : loadPublishedNeighborhoods()),
  })

  const storyQuery = useQuery<RiverPost[]>({
    queryKey: ['home-stories', location?.latitude ?? 'all', location?.longitude ?? 'all', location?.radiusMiles ?? 'all'],
    enabled: ready,
    queryFn: () => loadStories(location),
  })

  return {
    location,
    notice: urlLocationNotice,
    waitingForZip,
    stores: storeQuery.data ?? [],
    products: productQuery.data ?? [],
    stories: storyQuery.data ?? [],
    neighborhoods: neighborhoodQuery.data ?? [],
    storesLoading: storeQuery.isLoading || waitingForZip,
    productsLoading: productQuery.isLoading,
  }
}
