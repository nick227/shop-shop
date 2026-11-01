import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useVendorTeamRequest } from './useVendorTeamRequest'

/** Pause or resume new orders for a store. Never changes an admin restriction. */
export function useStoreOrdering(storeId: string) {
  const request = useVendorTeamRequest()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { readonly acceptingOrders: boolean; readonly reason?: string }) =>
      request(`/stores/${storeId}/ordering`, { method: 'PUT', body: JSON.stringify(input) }),
    onSuccess: (_result, input) => {
      void queryClient.invalidateQueries({ queryKey: ['vendor-managed-stores'] })
      toast.success(input.acceptingOrders ? 'Taking orders again' : 'New orders paused')
    },
    onError: (error: unknown) => toast.error(error instanceof Error ? error.message : 'Could not change order intake'),
  })
}
