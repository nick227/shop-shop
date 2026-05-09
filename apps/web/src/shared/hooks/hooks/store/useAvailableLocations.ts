/**
 * Directory of cities with stores + ZIPs observed for each city (for URL + filter context).
 */
import { useQuery } from '@tanstack/react-query'
import { stores } from '@api/apiWrapper'
import type { StoreResponse } from '@api/types'

export interface CityZipInfo {
  readonly zip: string
  readonly count: number
}

export interface CityDirectoryEntry {
  readonly city: string
  readonly state: string
  readonly count: number
  readonly zips: readonly CityZipInfo[]
}

interface LocationInfo {
  readonly cities: readonly CityDirectoryEntry[]
  readonly total: number
}

function buildDirectory(storeList: StoreResponse[]): { cities: CityDirectoryEntry[] } {
  interface Agg {
    city: string
    state: string
    count: number
    zipCounts: Map<string, number>
  }
  const cityMap = new Map<string, Agg>()

  for (const store of storeList) {
    if (!store.addressCity || !store.addressState) continue
    const ck = `${store.addressCity}|${store.addressState}`
    let agg = cityMap.get(ck)
    if (!agg) {
      agg = {
        city: store.addressCity,
        state: store.addressState,
        count: 0,
        zipCounts: new Map<string, number>(),
      }
      cityMap.set(ck, agg)
    }
    agg.count++
    const z = store.addressZip?.trim()
    if (z) {
      agg.zipCounts.set(z, (agg.zipCounts.get(z) ?? 0) + 1)
    }
  }

  const cities: CityDirectoryEntry[] = [...cityMap.values()]
    .map((agg) => ({
      city: agg.city,
      state: agg.state,
      count: agg.count,
      zips: [...agg.zipCounts.entries()]
        .map(([zip, count]) => ({ zip, count }))
        .sort((a, b) => b.count - a.count || a.zip.localeCompare(b.zip)),
    }))
    .sort((a, b) => a.city.localeCompare(b.city))

  return { cities }
}

export function useAvailableLocations() {
  return useQuery<LocationInfo>({
    queryKey: ['available-locations'],
    queryFn: async () => {
      const envelope = await stores.listPage({ limit: '500', page: '1' })
      const storeList = envelope.data as unknown as StoreResponse[]
      const { cities } = buildDirectory(storeList)
      return { cities, total: envelope.total }
    },
    staleTime: 15 * 60 * 1000,
  })
}
