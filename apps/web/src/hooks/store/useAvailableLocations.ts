/**
 * useAvailableLocations - Fetch available cities and zip codes from published stores
 */
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@api/client'
import type { Store } from '@api/types'

interface LocationInfo {
  cities: { city: string; state: string; count: number }[]
  zipCodes: { zipCode: string; city: string; state: string; count: number }[]
}

export function useAvailableLocations() {
  return useQuery<LocationInfo>({
    queryKey: ['available-locations'],
    queryFn: async () => {
      const response = await apiClient.stores().listStores({ 
        isPublished: 'true'
      })
      const stores = (response?.data || response || []) as Store[]
      
      // Extract unique cities
      const cityMap = new Map<string, { city: string; state: string; count: number }>()
      const zipMap = new Map<string, { zipCode: string; city: string; state: string; count: number }>()
      
      for (const store of stores) {
        // Cities
        if (store.addressCity && store.addressState) {
          const key = '${store.addressCity}, ' + store.addressState + ''
          const existing = cityMap.get(key)
          if (existing) {
            existing.count++
          } else {
            cityMap.set(key, {
              city: store.addressCity,
              state: store.addressState,
              count: 1
            })
          }
        }
        
        // Zip codes
        if (store.addressZip && store.addressCity && store.addressState) {
          const existing = zipMap.get(store.addressZip)
          if (existing) {
            existing.count++
          } else {
            zipMap.set(store.addressZip, {
              zipCode: store.addressZip,
              city: store.addressCity,
              state: store.addressState,
              count: 1
            })
          }
        }
      }
      
      return {
        cities: [...cityMap.values()].sort((a, b) => b.count - a.count),
        zipCodes: [...zipMap.values()].sort((a, b) => b.count - a.count)
      }
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
  })
}

