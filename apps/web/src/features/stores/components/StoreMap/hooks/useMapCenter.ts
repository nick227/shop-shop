/**
 * useMapCenter - Hook for calculating map center coordinates
 * Single Responsibility: Map center calculation logic
 */
import { useMemo } from 'react'
import type { LocationData } from '@shared/types/types/location.types'



export interface MapCenterOptions {
  userLocation?: LocationData
  stores: LocationData[]
  defaultCenter?: [number, number]
}

export function useMapCenter({ 
  userLocation, 
  stores, 
  defaultCenter = [40.7505, -73.9934] 
}: MapCenterOptions): [number, number] {
  return useMemo((): [number, number] => {
    if (userLocation) {
      return [userLocation.latitude, userLocation.longitude]
    }
    if (stores.length > 0 && stores[0]) {
      return [stores[0].latitude, stores[0].longitude]
    }
    return defaultCenter
  }, [userLocation, stores, defaultCenter])
}

export {type LocationData} from '@shared/types/types/location.types'