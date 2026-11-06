import { keepPreviousData, useQuery } from '@tanstack/react-query'
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
        radiusMiles: Number.isFinite(Number(params.get('radius'))) && Number(params.get('radius')) > 0 ? Number(params.get('radius')) : HOME_RADIUS_MILES,
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
  const awaitingPlace = Boolean(placeSlug) && !placeLocation && (placeQuery.isLoading || placeQuery.isFetching)
  const ready = located || (!zip && !waitingForZip && !placeSlug) || Boolean(placeLocation) || (Boolean(placeSlug) && placeQuery.isFetched)
  const scope = location ? `${location.latitude}:${location.longitude}` : awaitingPlace ? 'pending' : 'all'

  const storeQuery = useQuery({
    queryKey: ['home-stores', scope, location?.radiusMiles ?? 'all', context.deliveryFirst],
    enabled: ready && scope !== 'pending',
    placeholderData: keepPreviousData,
    queryFn: () => loadStores(location, context.deliveryFirst),
  })

  const productQuery = useQuery({
    queryKey: ['home-products', scope, location?.radiusMiles ?? 'all'],
    queryFn: () => loadProducts(location),
    enabled: ready && scope !== 'pending',
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  })

  const neighborhoodQuery = useQuery<NeighborhoodCard[]>({
    queryKey: ['home-neighborhood', zipCode || 'published'],
    enabled: zipCode.length === 5 || (!zip && !waitingForZip),
    queryFn: () => (zipCode.length === 5 ? loadNeighborhoodsByZip(zipCode) : loadPublishedNeighborhoods()),
  })

  const storyQuery = useQuery<RiverPost[]>({
    queryKey: ['home-stories', scope, location?.radiusMiles ?? 'all'],
    enabled: ready && scope !== 'pending',
    placeholderData: keepPreviousData,
    queryFn: () => loadStories(location),
  })

  const shownPlace = place?.slug === placeSlug ? place : undefined
  return {
    location,
    notice: urlLocationNotice,
    waitingForZip,
    placePending: awaitingPlace,
    /** The URL names a place the API does not know (or has not published). */
    placeMissing: Boolean(placeSlug) && placeQuery.isFetched && placeQuery.data === null,
    activePlace: context.neighborhood ? shownPlace ?? null : null,
    cityPlace: context.city && !context.neighborhood && !context.zip ? shownPlace ?? null : null,
    nearby: context.neighborhood && shownPlace ? shownPlace.nearby ?? [] : [],
    stores: storeQuery.data ?? [],
    products: productQuery.data ?? [],
    stories: storyQuery.data ?? [],
    neighborhoods: neighborhoodQuery.data ?? [],
    storesLoading: storeQuery.isLoading || waitingForZip,
    productsLoading: productQuery.isLoading,
  }
}
