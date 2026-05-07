/**
 * useVendorStores — stores the signed-in user can manage (owned + team memberships).
 * Source: GET /team/me/stores
 */
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@stores/authStore'
import type { StoreResponse } from '@api/types'
import { fetchTeamMeStores } from './vendorTeamApi'

export function useVendorStores() {
  const user = useAuthStore((s) => s.user)

  return useQuery({
    queryKey: ['vendor-managed-stores', user?.id],
    queryFn: async () => fetchTeamMeStores(),
    enabled: Boolean(user?.id),
    select: (data: StoreResponse[]) => data ?? [],
  })
}

