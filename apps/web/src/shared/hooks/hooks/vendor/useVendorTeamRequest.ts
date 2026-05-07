import { useAuthStore } from '@stores/authStore'
import { getVendorApiBase } from './vendorTeamApi'

export function useVendorTeamRequest() {
  const token = useAuthStore((s) => s.token)
  const base = getVendorApiBase()

  return async function teamRequest<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${base}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    })
    if (!response.ok) {
      const data: { error?: string; message?: string } = await response.json().catch(() => ({}))
      throw new Error(data.error || data.message || 'Request failed')
    }
    if (response.status === 204) return null as T
    return response.json() as Promise<T>
  }
}
