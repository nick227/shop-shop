import { useQuery } from '@tanstack/react-query'
import type { AccountCapabilities } from '@packages/schemas'
import { useAuthStore } from '@stores/authStore'
import { authGet } from '@shared/lib/auth/authFetch'

export const accountCapabilitiesKey = (userId?: string) => ['account-capabilities', userId] as const

export function useAccountCapabilities() {
  const userId = useAuthStore((s) => s.user?.id)
  const authenticated = useAuthStore((s) => s.isAuthenticated)
  const query = useQuery<AccountCapabilities>({
    queryKey: accountCapabilitiesKey(userId),
    queryFn: async () => {
      const response = await authGet<AccountCapabilities>('/api/auth/v1/capabilities')
      if (!response.ok) throw new Error('Account access could not be checked')
      return response.json()
    },
    enabled: authenticated && Boolean(userId),
    staleTime: 10_000,
    refetchOnWindowFocus: 'always',
    retry: false,
  })
  // Never trust persisted roles or a failed/stale account from another login.
  const capabilities = authenticated && userId && !query.isError ? query.data : undefined
  return { ...query, capabilities }
}
