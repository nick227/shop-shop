import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@stores/authStore'
import type { OrderResponse } from '@api/types'
import { mapOrder } from '@api/type-mappers'

function getApiBaseUrl() {
  return (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
}

export function useDriverDeliveries() {
  const token = useAuthStore((s) => s.token)

  return useQuery<OrderResponse[]>({
    queryKey: ['driver-deliveries'],
    enabled: Boolean(token),
    queryFn: async () => {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/driver/deliveries`, {
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || data.message || 'Failed to load driver deliveries')
      }
      const data = await res.json()
      const raw = (data.orders || []) as any[]
      return raw.map(mapOrder)
    },
  })
}

