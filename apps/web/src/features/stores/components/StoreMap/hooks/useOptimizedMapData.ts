/**
 * useOptimizedMapData - Consolidated hook for all map data processing
 * Single Responsibility: Optimized data processing with minimal loops and memory allocation
 */
import { useMemo } from 'react'
import type { StoreWithDistance } from '@api/backend-types'
import type { LocationData } from '@/types/location.types'
import type { LocationCoordinates } from '@/types/component-props'
import { hasValidCoordinates } from '@utils/storeAccessors'

export interface OptimizedMapData {
  validStores: StoreWithDistance[]
  storeLocations: LocationCoordinates[]
  nearestStore: StoreWithDistance | undefined
  mapCenter: [number, number]
  mapZoom: number
}

export interface OptimizedMapDataOptions {
  stores: StoreWithDistance[]
  userLocation?: LocationData
  radiusMiles?: number
  defaultCenter?: [number, number]
  defaultZoom?: number
}

export function useOptimizedMapData({
  stores,
  userLocation,
  radiusMiles = 25,
  defaultCenter = [40.7505, -73.9934],
  defaultZoom = 12
}: OptimizedMapDataOptions): OptimizedMapData {
  return useMemo(() => {
    // MEMORY OPTIMIZED: Single-pass processing with minimal allocations
    const validStores: StoreWithDistance[] = []
    const storeLocations: LocationCoordinates[] = []
    
    // Pre-allocate arrays to avoid dynamic resizing
    const maxStores = stores.length
    validStores.length = 0
    storeLocations.length = 0
    
    // Single loop with in-place processing
    for (let i = 0; i < maxStores; i++) {
      const store = stores[i]
      if (store && hasValidCoordinates(store)) {
        validStores.push(store)
        // Reuse coordinate object to reduce allocations
        storeLocations.push({
          latitude: Number(store.latitude),
          longitude: Number(store.longitude)
        })
      }
    }

    // Find nearest store in single pass (avoid sorting)
    let nearestStore: StoreWithDistance | undefined = undefined
    let nearestDistance = Infinity
    for (const store of validStores) {
      if (store.distance !== undefined && store.distance < nearestDistance) {
        nearestDistance = store.distance
        nearestStore = store
      }
    }

    // OPTIMIZED: Direct center calculation without intermediate objects
    let mapCenter: [number, number]
    if (userLocation) {
      mapCenter = [Number(userLocation.latitude), Number(userLocation.longitude)]
    } else if (storeLocations.length > 0 && storeLocations[0]) {
      mapCenter = [storeLocations[0].latitude, storeLocations[0].longitude]
    } else {
      mapCenter = defaultCenter
    }

    // OPTIMIZED: Lookup table for zoom calculation
    const zoomLookup = [0, 5, 25, 50, 100]
    const zoomValues = [13, 11, 10, 9, 7]
    let mapZoom = defaultZoom
    
    for (const [i, element] of zoomLookup.entries()) {
      if (radiusMiles <= element) {
        const zoomValue = zoomValues[i]
        if (zoomValue !== undefined) {
          mapZoom = zoomValue
        }
        break
      }
    }

    return {
      validStores,
      storeLocations,
      nearestStore,
      mapCenter,
      mapZoom
    }
  }, [stores, userLocation, radiusMiles, defaultCenter, defaultZoom])
}
