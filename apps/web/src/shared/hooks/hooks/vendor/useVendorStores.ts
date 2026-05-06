/**
 * useVendorStores - Fetch vendor's stores;
 */
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@api/client'
import { useAuth } from '@features/auth/hooks/useAuth'
import type { StoreResponse } from '@api/types'

export function useVendorStores() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['vendor-stores', (user as any)?.id],
    queryFn: async () => {
      const response = await apiClient.stores().listStores({ ownerUserId: (user as any)?.id } as any)
      return response.data || []
    },
    enabled: !!user,
    select: (data) => data || []
  })
}

