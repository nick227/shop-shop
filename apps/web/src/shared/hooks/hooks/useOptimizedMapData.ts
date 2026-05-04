/**
 * useMapData - Ultra-high performance map data processing
 * Single Responsibility: Minimize loops, reduce memory allocations, optimize data flow
 */
import { useMemo, useRef } from 'react'
import type { StoreWithDistance } from '@api/types'
import type { LocationData, LocationCoordinates } from '@shared/types'
import { hasValidCoordinates } from '@shared/lib/utils/storeAccessors'
import { processStoresOptimized } from '@shared/lib/utils/performance/optimized-loops'

export interface MapData {
  validStores: StoreWithDistance[]
  storeLocations: LocationCoordinates[]
  nearestStore: StoreWithDistance | undefined
  mapCenter: [number, number]
  mapZoom: number
  minDistance: number
  maxDistance: number
  totalStores: number
  validStoresCount: number
}

export interface MapDataOptions {
  stores: StoreWithDistance[]
  userLocation?: LocationData
  radiusMiles?: number
  defaultCenter?: [number, number]
  defaultZoom?: number
}

/**
 * Optimized map data hook with single-pass processing
 * Replaces multiple loops with one efficient pass
 */
export function useMapData({
  stores,
  userLocation,
  radiusMiles = 25,
  defaultCenter = [40.7505, -73.9934],
  defaultZoom = 12
}: MapDataOptions): MapData {
  // Use ref to maintain stable reference and avoid unnecessary recalculations
  const lastProcessedStores = useRef<StoreWithDistance[]>([])
  const lastProcessedUserLocation = useRef<LocationData | undefined>(undefined)
  
  return useMemo(() => {
    // Early return if data hasn't changed
    if (stores === lastProcessedStores.current && userLocation === lastProcessedUserLocation.current) {
      return {
        validStores: [],
        storeLocations: [],
        nearestStore: undefined,
        mapCenter: defaultCenter,
        mapZoom: defaultZoom,
        minDistance: 0,
        maxDistance: 0,
        totalStores: 0,
        validStoresCount: 0
      }
    }
    
    // Update refs
    lastProcessedStores.current = stores
    lastProcessedUserLocation.current = userLocation
    
    // Single-pass processing using optimized utility
    const processed = processStoresOptimized(stores, {
      findNearest: true,
      filterValid: true,
      sortByDistance: true
    })
    
    // Calculate map center efficiently
    let mapCenter: [number, number]
    if (userLocation) {
      mapCenter = [userLocation.latitude, userLocation.longitude]
    } else if (processed.storeLocations.length > 0 && processed.storeLocations[0]) {
      // Use first store location (already sorted by distance)
      mapCenter = [processed.storeLocations[0].latitude, processed.storeLocations[0].longitude]
    } else {
      mapCenter = defaultCenter
    }
    
    // Optimized zoom calculation using lookup table
    const zoomLookup = [
      { maxRadius: 5, zoom: 13 },
      { maxRadius: 25, zoom: 11 },
      { maxRadius: 50, zoom: 10 },
      { maxRadius: 100, zoom: 9 },
      { maxRadius: Infinity, zoom: 7 }
    ]
    
    let mapZoom = defaultZoom
    for (const entry of zoomLookup) {
      if (radiusMiles <= entry.maxRadius) {
        mapZoom = entry.zoom
        break
      }
    }
    
    return {
      validStores: processed.validStores,
      storeLocations: processed.storeLocations,
      nearestStore: processed.nearestStore,
      mapCenter,
      mapZoom,
      minDistance: processed.minDistance,
      maxDistance: processed.maxDistance,
      totalStores: stores.length,
      validStoresCount: processed.validStores.length
    }
  }, [stores, userLocation, radiusMiles, defaultCenter, defaultZoom])
}

/**
 * Optimized marker processing hook
 * Batch operations for better DOM performance
 */
export function useOptimizedMarkers(
  stores: StoreWithDistance[],
  options: {
    batchSize?: number
    findNearest?: boolean
  } = {}
) {
  return useMemo(() => {
    const { batchSize = 50, findNearest = true } = options
    
    const markerData: {
      store: StoreWithDistance
      isNearest: boolean
      position: [number, number]
      distance?: number
    }[] = []
    
    let nearestStore: StoreWithDistance | undefined
    let minDistance = Infinity
    
    // Process in batches for better performance
    for (let i = 0; i < stores.length; i += batchSize) {
      const batch = stores.slice(i, i + batchSize)
      
      for (const store of batch) {
        
        if (!hasValidCoordinates(store)) continue
        
        // Find nearest in same pass
        let isNearest = false
        if (findNearest && store.distance !== undefined && store.distance < minDistance) {
          minDistance = store.distance
          nearestStore = store
          isNearest = true
        }
        
        markerData.push({
          store,
          isNearest,
          position: [Number(store.latitude), Number(store.longitude)],
          distance: store.distance
        })
      }
    }
    
    return { markerData, nearestStore }
  }, [stores, options.batchSize, options.findNearest])
}
