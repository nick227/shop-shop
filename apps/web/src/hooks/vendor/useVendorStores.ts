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
    queryKey: ['vendor-stores', user?.id],
    queryFn: async () => {
      return await apiClient.stores().listStores({
        ownerUserId: user!['id']})
    },
    enabled: !!user,
    select: (data) => data?.data || []})
}

