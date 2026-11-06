import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { HOME_RADIUS_MILES } from '../shell/placeMemory'
import { apiOrigin } from './loadDiscovery'
import type { DirectoryListing } from './DirectoryList'

export function useDirectory(latitude?: number, longitude?: number, options?: { readonly q?: string; readonly group?: string; readonly limit?: number }) {
  const q = options?.q ?? ''
  const group = options?.group ?? ''
  const limit = options?.limit ?? 40
  const located = latitude != null && longitude != null
  return useQuery({
    queryKey: ['directory', latitude ?? 'all', longitude ?? 'all', q, group, limit],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: String(limit),
      })
      if (located) {
        params.set('latitude', String(latitude))
        params.set('longitude', String(longitude))
        params.set('radiusMiles', String(HOME_RADIUS_MILES))
      }
      if (q) params.set('q', q)
      if (group) params.set('group', group)
      const response = await fetch(`${apiOrigin()}/api/directory?${params}`)
      if (!response.ok) return []
      const body = await response.json() as { listings?: DirectoryListing[] }
      return body.listings ?? []
    },
  })
}
