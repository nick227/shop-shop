import { useQuery } from '@tanstack/react-query'
import type { UnifiedSearchResponse } from '@features/search/hooks/useUnifiedSearchApi'

export interface RiverBrowseStoresParams {
  readonly storeTypeFilter: string
  readonly nearMe: boolean
  readonly latitude: number | undefined
  readonly longitude: number | undefined
}

export function useRiverBrowseStores(params: RiverBrowseStoresParams) {
  const { storeTypeFilter, nearMe, latitude, longitude } = params
  const geoReady = latitude != null && longitude != null
  const enabled = !nearMe || geoReady

  return useQuery<UnifiedSearchResponse, Error>({
    queryKey: ['river-browse-stores', storeTypeFilter || 'ALL', nearMe, latitude, longitude],
    queryFn: async () => {
      const sp = new URLSearchParams()
      if (storeTypeFilter) sp.set('storeType', storeTypeFilter)
      if (nearMe && latitude != null && longitude != null) {
        sp.set('latitude', String(latitude))
        sp.set('longitude', String(longitude))
        sp.set('radiusMiles', '25')
      }
      const response = await fetch(`/api/search/unified?${sp.toString()}`)
      if (!response.ok) {
        throw new Error(`Browse failed: ${response.statusText}`)
      }
      return response.json()
    },
    enabled,
    staleTime: 30_000,
  })
}
