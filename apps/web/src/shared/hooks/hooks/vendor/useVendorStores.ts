import { useAccountCapabilities } from '@features/account/useAccountCapabilities'
/**
 * useVendorStores — stores the signed-in user can manage (owned + team memberships).
 * Source: GET /team/me/stores
 */
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@stores/authStore'
import { fetchTeamMeStores, type VendorStore } from './vendorTeamApi'

export function useVendorStores() {
  const { capabilities } = useAccountCapabilities()
  const user = useAuthStore((s) => s.user)

  const query = useQuery({
    queryKey: ['vendor-managed-stores', user?.id],
    queryFn: async () => fetchTeamMeStores(),
    enabled: Boolean(user?.id) && capabilities?.canAccessVendorPortal === true,
    refetchInterval: 15_000,
    select: (data: VendorStore[]) => data ?? [],
  })
  return { ...query, data: capabilities?.canAccessVendorPortal ? query.data : undefined }
}

