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
  const token = useAuthStore((s) => s.token)

  return useQuery({
    queryKey: ['vendor-managed-stores', user?.id],
    queryFn: async () => fetchTeamMeStores(token!),
    enabled: Boolean(user?.id && token),
    select: (data: StoreResponse[]) => data ?? [],
  })
}

