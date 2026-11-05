/** The signed-in shopper's saved delivery addresses. */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authGet, authPost } from '@shared/lib/auth/authFetch'
import type { DeliveryAddressDraft } from './useCheckoutQuote'

export interface SavedAddress extends DeliveryAddressDraft {
  readonly id: string
  readonly label: string | null
  readonly isDefault: boolean
}

const KEY = ['addresses', 'mine'] as const

export function useAddresses(enabled: boolean) {
  return useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<SavedAddress[]> => {
      const response = await authGet('/api/addresses?limit=50')
      if (!response.ok) throw new Error('Your addresses could not be loaded')
      const body = (await response.json()) as { data?: SavedAddress[] }
      return body.data ?? []
    },
    enabled,
  })
}

export function useSaveAddress() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (address: DeliveryAddressDraft & { label?: string }): Promise<SavedAddress> => {
      const response = await authPost('/api/addresses', { ...address, country: 'US' })
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string; message?: string }
        throw new Error(body.error ?? body.message ?? 'The address could not be saved')
      }
      const body = (await response.json()) as { data?: SavedAddress } & SavedAddress
      return body.data ?? body
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: KEY }),
  })
}
