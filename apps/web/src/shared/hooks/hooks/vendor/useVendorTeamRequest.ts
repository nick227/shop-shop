import { getVendorApiBase } from './vendorTeamApi'
import { authFetch } from '@shared/lib/auth/authFetch'

export function useVendorTeamRequest() {
  const base = getVendorApiBase()

  return async function teamRequest<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
    const response = await authFetch<T>(`${base}${path}`, options)
    
    if (!response.ok) {
      const data = await response.json().catch(() => ({})) as { error?: string; message?: string }
      throw new Error(data.error || data.message || 'Request failed')
    }
    
    if (response.status === 204) return null as T
    return response.json() as Promise<T>
  }
}
