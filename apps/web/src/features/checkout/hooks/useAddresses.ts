/** The signed-in shopper's saved delivery addresses. */
import { useEffect, useState } from 'react'
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
      // No `limit`: the list endpoint passes it to the database as a string and fails.
      const response = await authGet('/api/addresses')
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

export interface AddressSuggestion {
  readonly id: string
  readonly label: string
  readonly line1: string
  readonly city: string
  readonly state: string
  readonly postalCode: string
}

/** Addresses matching what's typed, once typing pauses; empty when the server has no provider. */
export function useAddressSuggestions(query: string) {
  const [debounced, setDebounced] = useState(query)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query.trim()), 250)
    return () => clearTimeout(timer)
  }, [query])
  return useQuery({
    queryKey: ['address-suggestions', debounced],
    queryFn: async (): Promise<AddressSuggestion[]> => {
      const response = await authGet(`/api/address-suggestions?q=${encodeURIComponent(debounced)}`)
      if (!response.ok) return []
      return ((await response.json()) as { data?: AddressSuggestion[] }).data ?? []
    },
    enabled: debounced.length >= 3,
    staleTime: 60_000,
  })
}
