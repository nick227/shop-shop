import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query'
import { HOME_RADIUS_MILES } from '../shell/placeMemory'
import { apiOrigin } from './loadDiscovery'
import type { DirectoryListing } from './DirectoryList'

export interface DirectoryOptions { readonly q?: string; readonly group?: string; readonly limit?: number; readonly radius?: number }

/** One definition of the directory request, so anything that previews a filter hits the same cache entry the feed will use. */
export function directoryQuery(latitude?: number, longitude?: number, options?: DirectoryOptions) {
  const radius = options?.radius ?? HOME_RADIUS_MILES
  const q = options?.q ?? ''
  const group = options?.group ?? ''
  const limit = options?.limit ?? 40
  const located = latitude != null && longitude != null
  return queryOptions({
    queryKey: ['directory', latitude ?? 'all', longitude ?? 'all', q, group, limit, radius],
    queryFn: async (): Promise<DirectoryListing[]> => {
      const params = new URLSearchParams({
        limit: String(limit),
      })
      if (located) {
        params.set('latitude', String(latitude))
        params.set('longitude', String(longitude))
        params.set('radiusMiles', String(radius))
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

export function useDirectory(latitude?: number, longitude?: number, options?: DirectoryOptions) {
  return useQuery({ ...directoryQuery(latitude, longitude, options), placeholderData: keepPreviousData })
}
