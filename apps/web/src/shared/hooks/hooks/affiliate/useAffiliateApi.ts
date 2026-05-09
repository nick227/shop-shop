import { authFetch } from '@shared/lib/auth/authFetch'
import { AffiliateApiError, type AffiliateAccountStatus } from './affiliateApiError'

export function useAffiliateApi() {
  async function request<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
    const res = await authFetch<T>(path, options)
    if (!res.ok) {
      const data = await res.json().catch(() => ({})) as { error?: string; message?: string; status?: AffiliateAccountStatus }
      throw new AffiliateApiError({
        message: data.error || data.message || `Request failed (${res.status})`,
        httpStatus: res.status,
        affiliateStatus: data.status,
      })
    }
    if (res.status === 204) return null as T
    return res.json()
  }

  return {
    signup: (body: { bio?: string; website?: string; paypalEmail?: string; taxId?: string }) =>
      request<{ affiliate: Record<string, unknown> }>('/api/affiliates/signup', {
        method: 'POST',
        body: JSON.stringify(body),
      }),

    getMyProfile: () => request<{ affiliate: Record<string, unknown> }>('/api/affiliates/me'),

    getMyApplication: () =>
      request<{ affiliate: { id: string; status: string } | null }>('/api/affiliates/application'),

    getMyStats: () => request<Record<string, unknown>>('/api/affiliates/me/stats'),

    updateProfile: (body: Record<string, unknown>) =>
      request<{ affiliate: Record<string, unknown> }>('/api/affiliates/me', {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),

    getMyCommissions: (params?: { status?: string; limit?: number; offset?: number }) => {
      const q = new URLSearchParams()
      if (params?.status) q.set('status', params.status)
      if (params?.limit) q.set('limit', String(params.limit))
      if (params?.offset) q.set('offset', String(params.offset))
      return request<{ commissions: Record<string, unknown>[]; total: number }>(
        `/api/affiliates/me/commissions?${q.toString()}`
      )
    },

    getMyPayouts: (params?: { status?: string; limit?: number; offset?: number }) => {
      const q = new URLSearchParams()
      if (params?.status) q.set('status', params.status)
      if (params?.limit) q.set('limit', String(params.limit))
      if (params?.offset) q.set('offset', String(params.offset))
      return request<{ payouts: Record<string, unknown>[]; total: number }>(
        `/api/affiliates/me/payouts?${q.toString()}`
      )
    },
  }
}
