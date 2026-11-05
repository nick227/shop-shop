import { useQuery } from '@tanstack/react-query'
import { HOME_RADIUS_MILES } from '../shell/placeMemory'
import { apiOrigin } from './loadDiscovery'
import type { DirectoryListing } from './DirectoryList'

export function useDirectory(latitude?: number, longitude?: number) {
  return useQuery({
    queryKey: ['directory', latitude, longitude],
    enabled: latitude != null && longitude != null,
    queryFn: async () => {
      const response = await fetch(`${apiOrigin()}/api/directory?latitude=${latitude}&longitude=${longitude}&radiusMiles=${HOME_RADIUS_MILES}&limit=40`)
      if (!response.ok) return []
      const body = await response.json() as { listings?: DirectoryListing[] }
      return body.listings ?? []
    },
  })
}
