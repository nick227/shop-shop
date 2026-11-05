import { useQuery } from '@tanstack/react-query'
import { HOME_RADIUS_MILES } from '../shell/placeMemory'
import { apiOrigin } from './loadDiscovery'
import type { DirectoryListing } from './DirectoryList'

export function useDirectory(latitude?: number, longitude?: number, options?: { readonly q?: string; readonly group?: string; readonly limit?: number }) {
  const q = options?.q ?? ''
  const group = options?.group ?? ''
  const limit = options?.limit ?? 40
  return useQuery({
    queryKey: ['directory', latitude, longitude, q, group, limit],
    enabled: latitude != null && longitude != null,
    queryFn: async () => {
      const params = new URLSearchParams({
        latitude: String(latitude),
        longitude: String(longitude),
        radiusMiles: String(HOME_RADIUS_MILES),
        limit: String(limit),
      })
      if (q) params.set('q', q)
      if (group) params.set('group', group)
      const response = await fetch(`${apiOrigin()}/api/directory?${params}`)
      if (!response.ok) return []
      const body = await response.json() as { listings?: DirectoryListing[] }
      return body.listings ?? []
    },
  })
}
