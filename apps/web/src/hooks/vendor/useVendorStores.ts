/**
 * useVendorStores - Fetch vendor's stores;
 */
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@api/client'
import { useAuth } from '../useAuth'
import type { StoreResponse } from '@api/types'

export function useVendorStores() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['vendor-stores', (user as any)?.id],
    queryFn: async () => {
      // Note: SDK doesn't support ownerUserId filtering yet
      // This will return all stores, not filtered by owner
      const response = await apiClient.stores().listStores({})
      return response.data || []
    },
    enabled: !!user,
    select: (data) => data || []
  })
}

