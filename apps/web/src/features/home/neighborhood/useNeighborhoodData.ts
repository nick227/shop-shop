import { useQuery } from '@tanstack/react-query'
import { useLocation, useSearchParams } from 'react-router-dom'
import type { RiverPost } from '@api/types'
import { useUrlLocation } from '@shared/hooks/hooks/useUrlLocation'
import type { LocationData } from '@shared/types'
import { readDiscoveryContext } from '../discovery/discoveryContext'
import { HOME_RADIUS_MILES } from '../shell/placeMemory'
import { discoveryLocated } from './discoveryLocated'
import { type NeighborhoodCard } from './neighborhoodHero'
import {
  loadDiscoveryPlace,
  loadNeighborhoodsByZip,
  loadProducts,
  loadPublishedNeighborhoods,
  loadStores,
  loadStories,
} from './loadDiscovery'

export function useNeighborhoodData() {
  const { pathname } = useLocation()
  const [params] = useSearchParams()
  const context = readDiscoveryContext(pathname, params.toString())
  const { location: urlLocation, urlLocationNotice } = useUrlLocation()
  const placeSlug = context.neighborhood ?? (context.zip ? undefined : context.city)
  const placeQuery = useQuery({
    queryKey: ['discovery-place', placeSlug],
    enabled: Boolean(placeSlug),
    queryFn: () => loadDiscoveryPlace(placeSlug ?? ''),
  })
  const place = placeQuery.data ?? undefined
  const placeLocation: LocationData | undefined = place?.latitude != null && place.longitude != null
    ? {
        latitude: place.latitude,
        longitude: place.longitude,
        radiusMiles: HOME_RADIUS_MILES,
        source: context.neighborhood ? 'manual' : 'city',
        city: place.city?.name,
        state: place.city?.state ?? undefined,
        displayName: place.name,
      }
    : undefined
  const location = context.neighborhood || (context.city && !context.zip) ? placeLocation : urlLocation
  const zip = context.zip
  const zipCode = (location?.zip || zip || '').replace(/\D/g, '').slice(0, 5)
  const located = discoveryLocated(Boolean(location))
  const waitingForZip = Boolean(zip) && !location && !urlLocationNotice
  const ready = located || (!zip && !waitingForZip && !placeSlug) || Boolean(placeLocation) || (Boolean(placeSlug) && placeQuery.isFetched)

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
    activePlace: context.neighborhood ? place ?? null : null,
    stores: storeQuery.data ?? [],
    products: productQuery.data ?? [],
    stories: storyQuery.data ?? [],
    neighborhoods: neighborhoodQuery.data ?? [],
    storesLoading: storeQuery.isLoading || waitingForZip,
    productsLoading: productQuery.isLoading,
  }
}
