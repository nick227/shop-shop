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

    getMyReferralEvents: (params?: { eventType?: string; limit?: number; offset?: number }) => {
      const q = new URLSearchParams()
      if (params?.eventType) q.set('eventType', params.eventType)
      if (params?.limit) q.set('limit', String(params.limit))
      if (params?.offset) q.set('offset', String(params.offset))
      return request<{ events: Record<string, unknown>[]; total: number }>(
        `/api/affiliates/me/referral-events?${q.toString()}`
      )
    },

    getMyReferredUsers: () => 
      request<{ users: Record<string, unknown>[] }>('/api/affiliates/me/referred-users'),

    getMyReferredStores: () => 
      request<{ stores: Record<string, unknown>[] }>('/api/affiliates/me/referred-stores'),

    getMyReferredOrders: () =>
      request<{ orders: Record<string, unknown>[] }>('/api/affiliates/me/referred-orders'),

    // Stripe Connect payout account
    initiateStripeOnboarding: (body?: { returnUrl?: string; refreshUrl?: string }) =>
      request<{ url: string; accountId: string }>('/api/affiliates/me/payout-account/stripe', {
        method: 'POST',
        body: JSON.stringify(body ?? {}),
      }),

    getPayoutAccountStatus: () =>
      request<{
        payoutProvider: string | null
        payoutProviderAccountId: string | null
        payoutProviderStatus: string
        payoutsEnabled: boolean
        detailsSubmitted: boolean
      }>('/api/affiliates/me/payout-account'),

    getStripeLoginLink: () =>
      request<{ url: string }>('/api/affiliates/me/payout-account/stripe/login'),

    // Admin methods
    getAffiliateReferralEvents: (affiliateId: string, params?: { eventType?: string; limit?: number; offset?: number }) => {
      const q = new URLSearchParams()
      if (params?.eventType) q.set('eventType', params.eventType)
      if (params?.limit) q.set('limit', String(params.limit))
      if (params?.offset) q.set('offset', String(params.offset))
      return request<{ events: Record<string, unknown>[]; total: number }>(
        `/api/affiliates/${affiliateId}/referral-events?${q.toString()}`
      )
    },

    getAffiliateReferredUsers: (affiliateId: string) => 
      request<{ users: Record<string, unknown>[] }>(`/api/affiliates/${affiliateId}/referred-users`),

    getAffiliateReferredStores: (affiliateId: string) => 
      request<{ stores: Record<string, unknown>[] }>(`/api/affiliates/${affiliateId}/referred-stores`),

    getAffiliateReferredOrders: (affiliateId: string) => 
      request<{ orders: Record<string, unknown>[] }>(`/api/affiliates/${affiliateId}/referred-orders`),
  }
}
