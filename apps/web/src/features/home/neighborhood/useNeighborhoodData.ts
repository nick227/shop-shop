import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import type { RiverPost } from '@api/types'
import { useUrlLocation } from '@shared/hooks/hooks/useUrlLocation'
import { discoveryLocated } from './discoveryLocated'
import { type NeighborhoodCard } from './neighborhoodHero'
import { apiOrigin, loadProducts, loadStores, loadStories } from './loadDiscovery'

async function loadNeighborhoods(zip: string): Promise<NeighborhoodCard[]> {
  const response = await fetch(`${apiOrigin()}/api/places/by-zip/${zip}`)
  if (!response.ok) return []
  const body = await response.json() as { neighborhoods?: NeighborhoodCard[] }
  return body.neighborhoods ?? []
}

export function useNeighborhoodData() {
  const [params] = useSearchParams()
  const { location, urlLocationNotice } = useUrlLocation()
  const zip = params.get('zip')
  const zipCode = (location?.zip || zip || '').replace(/\D/g, '').slice(0, 5)
  const located = discoveryLocated(Boolean(location))
  const waitingForZip = Boolean(zip) && !location && !urlLocationNotice

  const storeQuery = useQuery({
    queryKey: ['home-stores', location?.latitude, location?.longitude, location?.radiusMiles],
    enabled: located,
    queryFn: () => {
      if (!location) throw new Error('ZIP is not resolved')
      return loadStores(location)
    },
  })

  const productQuery = useQuery({
    queryKey: ['home-products', location?.latitude, location?.longitude, location?.radiusMiles],
    queryFn: () => {
      if (!location) throw new Error('ZIP is not resolved')
      return loadProducts(location)
    },
    enabled: located,
    staleTime: 5 * 60 * 1000,
  })

  const neighborhoodQuery = useQuery({
    queryKey: ['home-neighborhood', zipCode],
    enabled: zipCode.length === 5,
    queryFn: () => loadNeighborhoods(zipCode),
  })

  const storyQuery = useQuery<RiverPost[]>({
    queryKey: ['home-stories', location?.latitude, location?.longitude, location?.radiusMiles],
    enabled: located,
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
